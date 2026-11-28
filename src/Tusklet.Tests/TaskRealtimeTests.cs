// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using Microsoft.AspNetCore.Http.Connections;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using NUnit.Framework;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Channels;
using Tusklet.Server.Database;
using Tusklet.Server.Models.Dto;

namespace Tusklet.Tests
{
    public class TaskRealtimeTests
    {
        private const string HubPath = "/api/tasks/live";
        private const string Password = "local-test-passphrase";

        [Test]
        public async Task PublishesCommittedChangesOnlyToTheOwner()
        {
            await using TuskletFactory factory = new();
            using HttpClient owner = factory.CreateBrowser();
            using HttpClient other = factory.CreateBrowser();
            using HttpResponseMessage anonymous = await owner.PostAsync($"{HubPath}/negotiate", null);
            Assert.That(anonymous.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));

            using HttpResponseMessage setup = await SendAsync(owner, HttpMethod.Post, "/api/auth/setup",
                await ReadTokenAsync(owner), new { username = "realtime-owner", password = Password });
            Assert.That(setup.StatusCode, Is.EqualTo(HttpStatusCode.NoContent));
            await AddOtherUserAsync(factory);
            using HttpResponseMessage login = await SendAsync(other, HttpMethod.Post, "/api/auth/login",
                await ReadTokenAsync(other), new { username = "realtime-other", password = Password });
            Assert.That(login.StatusCode, Is.EqualTo(HttpStatusCode.NoContent));
            string ownerToken = await ReadTokenAsync(owner);
            string otherToken = await ReadTokenAsync(other);

            using HttpRequestMessage foreignRequest = new(HttpMethod.Post, $"{HubPath}/negotiate");
            foreignRequest.Headers.Add("Origin", "https://other.tusklet.test");
            using HttpResponseMessage foreign = await owner.SendAsync(foreignRequest);
            Assert.That(foreign.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));

            Channel<(bool ListsChanged, string? Origin)> ownerEvents = Channel.CreateUnbounded<(bool, string?)>();
            Channel<(bool ListsChanged, string? Origin)> peerEvents = Channel.CreateUnbounded<(bool, string?)>();
            Channel<(bool ListsChanged, string? Origin)> otherEvents = Channel.CreateUnbounded<(bool, string?)>();
            await using HubConnection ownerHub = CreateHub(factory, owner.BaseAddress!, setup, ownerEvents.Writer);
            await using HubConnection peerHub = CreateHub(factory, owner.BaseAddress!, setup, peerEvents.Writer);
            await using HubConnection otherHub = CreateHub(factory, other.BaseAddress!, login, otherEvents.Writer);
            using CancellationTokenSource timeout = new(TimeSpan.FromSeconds(15));
            await ownerHub.StartAsync(timeout.Token);
            await peerHub.StartAsync(timeout.Token);
            await otherHub.StartAsync(timeout.Token);

            using HttpResponseMessage created = await SendAsync(owner, HttpMethod.Post, "/api/tasks", ownerToken,
                new { title = "First workspace task" }, "owner-origin");
            Assert.That(created.StatusCode, Is.EqualTo(HttpStatusCode.Created));
            Assert.That(await ownerEvents.Reader.ReadAsync(timeout.Token), Is.EqualTo((true, "owner-origin")));
            Assert.That(await peerEvents.Reader.ReadAsync(timeout.Token), Is.EqualTo((true, "owner-origin")));

            TaskItemSummaryDto[]? tasks = await owner.GetFromJsonAsync<TaskItemSummaryDto[]>("/api/tasks", timeout.Token);
            Guid taskId = tasks!.Single().Id;
            using HttpResponseMessage changed = await SendAsync(owner, HttpMethod.Patch, $"/api/tasks/{taskId}", ownerToken,
                new { title = "Updated workspace task" });
            Assert.That(changed.StatusCode, Is.EqualTo(HttpStatusCode.NoContent));
            Assert.That(await ownerEvents.Reader.ReadAsync(timeout.Token), Is.EqualTo((false, (string?)null)));
            Assert.That(await peerEvents.Reader.ReadAsync(timeout.Token), Is.EqualTo((false, (string?)null)));
            TaskItemSummaryDto[]? updated = await owner.GetFromJsonAsync<TaskItemSummaryDto[]>("/api/tasks", timeout.Token);
            Assert.That(updated?.Single().Title, Is.EqualTo("Updated workspace task"));

            using HttpResponseMessage completed = await SendAsync(owner, HttpMethod.Put, $"/api/tasks/{taskId}/completion",
                ownerToken, new { isCompleted = true }, "owner-origin");
            Assert.That(completed.StatusCode, Is.EqualTo(HttpStatusCode.NoContent));
            Assert.That(await peerEvents.Reader.ReadAsync(timeout.Token), Is.EqualTo((false, "owner-origin")));

            using HttpResponseMessage deleted = await SendAsync(owner, HttpMethod.Delete, $"/api/tasks/{taskId}",
                ownerToken, origin: "owner-origin");
            Assert.That(deleted.StatusCode, Is.EqualTo(HttpStatusCode.NoContent));
            Assert.That(await peerEvents.Reader.ReadAsync(timeout.Token), Is.EqualTo((false, "owner-origin")));

            using HttpResponseMessage otherCreated = await SendAsync(other, HttpMethod.Post, "/api/tasks", otherToken,
                new { title = "Another account's task" }, "other-origin");
            Assert.That(otherCreated.StatusCode, Is.EqualTo(HttpStatusCode.Created));
            Assert.That(await otherEvents.Reader.ReadAsync(timeout.Token), Is.EqualTo((true, "other-origin")));
        }

        private static HubConnection CreateHub(TuskletFactory factory, Uri baseAddress, HttpResponseMessage login,
            ChannelWriter<(bool, string?)> events)
        {
            string cookie = login.Headers.GetValues("Set-Cookie")
                .Single(value => value.StartsWith("__Host-Tusklet.Session=", StringComparison.Ordinal)).Split(';', 2)[0];
            HubConnection hub = new HubConnectionBuilder().WithUrl(new Uri(baseAddress, HubPath), options =>
            {
                options.Transports = HttpTransportType.WebSockets;
                options.SkipNegotiation = true;
                options.WebSocketFactory = async (context, cancellationToken) =>
                {
                    WebSocketClient client = factory.Server.CreateWebSocketClient();
                    client.ConfigureRequest = request =>
                    {
                        request.Headers.Cookie = cookie;
                        request.Headers.Origin = baseAddress.GetLeftPart(UriPartial.Authority);
                    };
                    return await client.ConnectAsync(context.Uri, cancellationToken);
                };
            }).Build();
            hub.On<bool, string?>("WorkspaceChanged", (listsChanged, origin) => events.TryWrite((listsChanged, origin)));
            return hub;
        }

        private static async Task AddOtherUserAsync(TuskletFactory factory)
        {
            await using AsyncServiceScope scope = factory.Services.CreateAsyncScope();
            TuskletDbContext db = scope.ServiceProvider.GetRequiredService<TuskletDbContext>();
            IPasswordHasher<User> hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<User>>();
            User user = new() { Username = "realtime-other", NormalizedUsername = "REALTIME-OTHER" };
            user.PasswordHash = hasher.HashPassword(user, Password);
            db.Users.Add(user);
            await db.SaveChangesAsync();
        }

        private static async Task<string> ReadTokenAsync(HttpClient browser)
        {
            JsonElement session = await browser.GetFromJsonAsync<JsonElement>("/api/auth/session");
            return session.GetProperty("requestToken").GetString()!;
        }

        private static async Task<HttpResponseMessage> SendAsync(HttpClient browser, HttpMethod method,
            string path, string token, object? body = null, string? origin = null)
        {
            using HttpRequestMessage request = new(method, path);
            if (body is not null)
            {
                request.Content = JsonContent.Create(body);
            }
            request.Headers.Add("X-CSRF-Token", token);
            if (origin is not null)
            {
                request.Headers.Add("X-Tusklet-Connection-Id", origin);
            }
            return await browser.SendAsync(request);
        }
    }
}
