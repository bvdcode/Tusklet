// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using NUnit.Framework;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Tusklet.Server;
using Tusklet.Server.Database;

namespace Tusklet.Tests
{
    public class AccountTests
    {
        private const string Password = "local-test-passphrase";
        private const string Callback = "https://tusklet.test/api/auth/openid/callback";

        [Test]
        public async Task OnlyOneRequestCanCreateAnAdministrator()
        {
            await using TuskletFactory factory = new();
            using HttpClient first = factory.CreateBrowser();
            using HttpClient second = factory.CreateBrowser();
            JsonElement firstSession = await SessionAsync(first);
            JsonElement secondSession = await SessionAsync(second);
            Assert.That(firstSession.GetProperty("setupRequired").GetBoolean(), Is.True);

            using HttpResponseMessage noCsrf = await first.PostAsJsonAsync("/api/auth/setup",
                new { username = "admin", password = Password });
            Assert.That(noCsrf.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));

            HttpResponseMessage[] responses = await Task.WhenAll(
                SendAsync(first, firstSession, HttpMethod.Post, "/api/auth/setup",
                    new { username = "first", password = Password }),
                SendAsync(second, secondSession, HttpMethod.Post, "/api/auth/setup",
                    new { username = "second", password = Password }));
            using HttpResponseMessage firstReply = responses[0];
            using HttpResponseMessage secondReply = responses[1];
            Assert.That(responses.Select(x => x.StatusCode),
                Is.EquivalentTo(new[] { HttpStatusCode.NoContent, HttpStatusCode.Unauthorized }));
            JsonElement afterSetup = await SessionAsync(first);
            Assert.That(afterSetup.GetProperty("setupRequired").GetBoolean(), Is.False);

            await using AsyncServiceScope scope = factory.Services.CreateAsyncScope();
            TuskletDbContext db = scope.ServiceProvider.GetRequiredService<TuskletDbContext>();
            User user = await db.Users.SingleAsync();
            Assert.That(user.IsAdmin, Is.True);
            Assert.That(user.PasswordHash, Is.Not.EqualTo(Password));
        }

        [Test]
        public async Task AdminCanConfigureLinkAndSignInWithOpenId()
        {
            const string picture = "https://identity.test/avatars/original.png";
            const string updatedPicture = "https://identity.test/avatars/updated.png";
            using TestOpenIdProvider provider = new();
            await using TuskletFactory factory = new(provider);
            using HttpClient browser = factory.CreateBrowser();

            using HttpResponseMessage anonymousSettings = await browser.GetAsync("/api/admin/openid");
            Assert.That(anonymousSettings.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
            JsonElement beforeSetup = await SessionAsync(browser);
            using HttpResponseMessage setup = await SendAsync(browser, beforeSetup, HttpMethod.Post,
                "/api/auth/setup", new { username = "admin", password = Password });
            Assert.That(setup.StatusCode, Is.EqualTo(HttpStatusCode.NoContent));
            JsonElement admin = await SessionAsync(browser);
            Assert.That(admin.GetProperty("user").GetProperty("isAdmin").GetBoolean(), Is.True);

            using HttpResponseMessage save = await SendAsync(browser, admin, HttpMethod.Put, "/api/admin/openid",
                new { issuer = TestOpenIdProvider.Issuer, clientId = TestOpenIdProvider.ClientId,
                    clientSecret = TestOpenIdProvider.ClientSecret, callbackUrl = Callback, enabled = true });
            Assert.That(save.StatusCode, Is.EqualTo(HttpStatusCode.NoContent));
            using HttpResponseMessage settings = await browser.GetAsync("/api/admin/openid");
            Assert.That(await settings.Content.ReadAsStringAsync(), Does.Not.Contain(TestOpenIdProvider.ClientSecret));
            await using (AsyncServiceScope scope = factory.Services.CreateAsyncScope())
            {
                TuskletDbContext db = scope.ServiceProvider.GetRequiredService<TuskletDbContext>();
                OpenIdProvider saved = await db.OpenIdProviders.SingleAsync();
                Assert.That(saved.ProtectedClientSecret, Is.Not.EqualTo(TestOpenIdProvider.ClientSecret));
                Assert.That(await db.DataProtectionKeys.AnyAsync(), Is.True);
            }

            using HttpResponseMessage link = await StartOpenIdAsync(browser, await SessionAsync(browser), "link");
            using HttpResponseMessage linkResult = await browser.GetAsync(
                provider.Authorize(link.Headers.Location!, Callback, pictureUrl: picture));
            Assert.That(provider.CallbackFailure?.Message, Is.Null);
            Assert.That(linkResult.Headers.Location?.OriginalString, Is.EqualTo("/profile?openid=linked"));
            JsonElement linked = await SessionAsync(browser);
            Assert.That(linked.GetProperty("user").GetProperty("openIdLinked").GetBoolean(), Is.True);
            Assert.That(linked.GetProperty("user").GetProperty("pictureUrl").GetString(), Is.EqualTo(picture));
            using HttpResponseMessage logout = await SendAsync(browser, linked, HttpMethod.Post, "/api/auth/logout");
            Assert.That(logout.StatusCode, Is.EqualTo(HttpStatusCode.NoContent));

            await using WebApplicationFactory<Program> replacement = factory.ReplaceContainer();
            using HttpClient replacementBrowser = factory.CreateBrowser(replacement);
            using HttpResponseMessage wrongLogin = await StartOpenIdAsync(
                replacementBrowser, await SessionAsync(replacementBrowser), "login");
            using HttpResponseMessage wrongResult = await replacementBrowser.GetAsync(
                provider.Authorize(wrongLogin.Headers.Location!, Callback, "unlinked-subject"));
            Assert.That(wrongResult.Headers.Location?.OriginalString, Is.EqualTo("/?openid=failed"));
            JsonElement signedOut = await SessionAsync(replacementBrowser);
            Assert.That(signedOut.GetProperty("user").ValueKind, Is.EqualTo(JsonValueKind.Null));

            using HttpResponseMessage login = await StartOpenIdAsync(replacementBrowser, signedOut, "login");
            using HttpResponseMessage loginResult = await replacementBrowser.GetAsync(
                provider.Authorize(login.Headers.Location!, Callback, pictureUrl: updatedPicture));
            Assert.That(loginResult.Headers.Location?.OriginalString, Is.EqualTo("/"));
            JsonElement signedIn = await SessionAsync(replacementBrowser);
            Assert.That(signedIn.GetProperty("user").GetProperty("username").GetString(), Is.EqualTo("admin"));
            Assert.That(signedIn.GetProperty("user").GetProperty("pictureUrl").GetString(), Is.EqualTo(updatedPicture));
            using HttpResponseMessage secondLogout = await SendAsync(
                replacementBrowser, signedIn, HttpMethod.Post, "/api/auth/logout");
            Assert.That(secondLogout.StatusCode, Is.EqualTo(HttpStatusCode.NoContent));
            using HttpResponseMessage passwordLogin = await SendAsync(replacementBrowser, await SessionAsync(replacementBrowser),
                HttpMethod.Post, "/api/auth/login", new { username = "ADMIN", password = Password });
            Assert.That(passwordLogin.StatusCode, Is.EqualTo(HttpStatusCode.NoContent));
            JsonElement localSession = await SessionAsync(replacementBrowser);
            Assert.That(localSession.GetProperty("user").GetProperty("pictureUrl").GetString(), Is.EqualTo(updatedPicture));

            using HttpResponseMessage unlink = await SendAsync(
                replacementBrowser, localSession, HttpMethod.Delete, "/api/auth/openid/link");
            Assert.That(unlink.StatusCode, Is.EqualTo(HttpStatusCode.NoContent));
            JsonElement unlinked = await SessionAsync(replacementBrowser);
            Assert.That(unlinked.GetProperty("user").GetProperty("openIdLinked").GetBoolean(), Is.False);
            Assert.That(unlinked.GetProperty("user").GetProperty("pictureUrl").ValueKind, Is.EqualTo(JsonValueKind.Null));
        }

        private static Task<JsonElement> SessionAsync(HttpClient browser)
        {
            return browser.GetFromJsonAsync<JsonElement>("/api/auth/session");
        }

        private static async Task<HttpResponseMessage> SendAsync(HttpClient browser, JsonElement session, HttpMethod method,
            string path, object? body = null)
        {
            using HttpRequestMessage request = new(method, path);
            request.Headers.Add("X-CSRF-Token", session.GetProperty("requestToken").GetString());
            if (body is not null)
            {
                request.Content = JsonContent.Create(body);
            }
            return await browser.SendAsync(request);
        }

        private static async Task<HttpResponseMessage> StartOpenIdAsync(HttpClient browser, JsonElement session, string action)
        {
            using FormUrlEncodedContent form = new(new Dictionary<string, string>
            {
                ["__RequestVerificationToken"] = session.GetProperty("requestToken").GetString()!,
            });
            return await browser.PostAsync($"/api/auth/openid/{action}", form);
        }
    }
}
