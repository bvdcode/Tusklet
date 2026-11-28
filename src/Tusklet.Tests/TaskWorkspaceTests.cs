// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using NUnit.Framework;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Tusklet.Server.Database;
using Tusklet.Server.Models.Dto;

namespace Tusklet.Tests
{
    public class TaskWorkspaceTests
    {
        [Test]
        public async Task CreatesTasksInTheRequestedListAndUpdatesCompletionForTheOwner()
        {
            await using TuskletFactory factory = new();
            using HttpClient browser = factory.CreateBrowser();
            using HttpResponseMessage anonymousTasks = await browser.GetAsync("/api/tasks");
            Assert.That(anonymousTasks.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
            string initialToken = await GetRequestTokenAsync(browser);
            using HttpResponseMessage setup = await SendAsync(browser, HttpMethod.Post, "/api/auth/setup", initialToken,
                new { username = "workspace-admin", password = "local-test-passphrase" });
            Assert.That(setup.StatusCode, Is.EqualTo(HttpStatusCode.NoContent));
            string token = await GetRequestTokenAsync(browser);

            HttpResponseMessage[] creations = await Task.WhenAll(
                SendAsync(browser, HttpMethod.Post, "/api/tasks", token,
                    new { title = "  Read the draft  ", note = "  Check the introduction  ", dueDate = "2026-12-01", isImportant = true }),
                SendAsync(browser, HttpMethod.Post, "/api/tasks", token, new { title = "Send the draft" }));
            using HttpResponseMessage first = creations[0];
            using HttpResponseMessage second = creations[1];
            Assert.That(creations.Select(response => response.StatusCode), Is.All.EqualTo(HttpStatusCode.Created));
            Guid listId = (await first.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("listId").GetGuid();
            Assert.That((await second.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("listId").GetGuid(), Is.EqualTo(listId));

            TaskListSummaryDto[]? lists = await browser.GetFromJsonAsync<TaskListSummaryDto[]>("/api/tasks/lists");
            Assert.That(lists?.Single().Name, Is.EqualTo("Inbox"));
            Assert.That(lists?.Single().IsInbox, Is.True);
            TaskItemSummaryDto[]? items = await browser.GetFromJsonAsync<TaskItemSummaryDto[]>($"/api/tasks?listId={listId}");
            TaskItemSummaryDto task = items!.Single(item => item.Title == "Read the draft");
            using (Assert.EnterMultipleScope())
            {
                Assert.That(items, Has.Length.EqualTo(2));
                Assert.That(task.Note, Is.EqualTo("Check the introduction"));
                Assert.That(task.DueDate, Is.EqualTo(new DateOnly(2026, 12, 1)));
                Assert.That(task.IsImportant, Is.True);
            }

            string completionPath = $"/api/tasks/{task.Id}/completion";
            using HttpResponseMessage completed = await SendAsync(browser, HttpMethod.Put, completionPath, token, new { isCompleted = true });
            Assert.That(completed.StatusCode, Is.EqualTo(HttpStatusCode.NoContent));
            TaskItemSummaryDto[]? completedItems = await browser.GetFromJsonAsync<TaskItemSummaryDto[]>($"/api/tasks?listId={listId}");
            Assert.That(completedItems?.Single(item => item.Id == task.Id).IsCompleted, Is.True);
            using HttpResponseMessage reopened = await SendAsync(browser, HttpMethod.Put, completionPath, token, new { isCompleted = false });
            Assert.That(reopened.StatusCode, Is.EqualTo(HttpStatusCode.NoContent));

            await using AsyncServiceScope scope = factory.Services.CreateAsyncScope();
            TuskletDbContext db = scope.ServiceProvider.GetRequiredService<TuskletDbContext>();
            User owner = await db.Users.SingleAsync();
            TaskList selected = new() { Owner = owner, Name = "Work", Position = 1 };
            TaskItem otherTask = new()
            {
                Title = "Another owner's task",
                TaskList = new TaskList
                {
                    Name = "Private",
                    Owner = new User { Username = "other-user", NormalizedUsername = "OTHER-USER", PasswordHash = "test-hash" },
                },
            };
            db.TaskLists.Add(selected);
            db.TaskItems.Add(otherTask);
            await db.SaveChangesAsync();

            using HttpResponseMessage selectedResponse = await SendAsync(browser, HttpMethod.Post, "/api/tasks", token,
                new { title = "In the selected list", listId = selected.Id });
            Assert.That(selectedResponse.StatusCode, Is.EqualTo(HttpStatusCode.Created));
            using HttpResponseMessage forbiddenList = await SendAsync(browser, HttpMethod.Post, "/api/tasks", token,
                new { title = "Outside my account", listId = otherTask.TaskListId });
            using HttpResponseMessage forbiddenCompletion = await SendAsync(browser, HttpMethod.Put,
                $"/api/tasks/{otherTask.Id}/completion", token, new { isCompleted = true });

            string taskPath = $"/api/tasks/{task.Id}";
            using HttpResponseMessage forbiddenEdit = await SendAsync(browser, HttpMethod.Patch,
                $"/api/tasks/{otherTask.Id}", token, new { title = "Not my task" });
            using HttpResponseMessage forbiddenMove = await SendAsync(browser, HttpMethod.Patch, taskPath, token,
                new { listId = otherTask.TaskListId, title = "Not my list" });
            using HttpResponseMessage invalidTitle = await SendAsync(browser, HttpMethod.Patch, taskPath, token,
                new { title = "   " });
            using HttpResponseMessage renamed = await SendAsync(browser, HttpMethod.Patch, taskPath, token,
                new { listId = selected.Id, title = "  Review the draft  ", isImportant = false });
            Assert.That(renamed.StatusCode, Is.EqualTo(HttpStatusCode.NoContent));

            TaskItemSummaryDto[]? movedItems = await browser.GetFromJsonAsync<TaskItemSummaryDto[]>($"/api/tasks?listId={selected.Id}");
            TaskItemSummaryDto moved = movedItems!.Last();
            using (Assert.EnterMultipleScope())
            {
                Assert.That(forbiddenEdit.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
                Assert.That(forbiddenMove.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
                Assert.That(invalidTitle.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
                Assert.That(moved.Id, Is.EqualTo(task.Id));
                Assert.That(moved.Title, Is.EqualTo("Review the draft"));
                Assert.That(moved.Note, Is.EqualTo(task.Note));
                Assert.That(moved.DueDate, Is.EqualTo(task.DueDate));
                Assert.That(moved.IsImportant, Is.False);
            }

            using HttpResponseMessage cleared = await SendAsync(browser, HttpMethod.Patch, taskPath, token,
                new { note = (string?)null, dueDate = (DateOnly?)null });
            Assert.That(cleared.StatusCode, Is.EqualTo(HttpStatusCode.NoContent));
            TaskItemSummaryDto[]? clearedItems = await browser.GetFromJsonAsync<TaskItemSummaryDto[]>($"/api/tasks?listId={selected.Id}");
            TaskItemSummaryDto clearedTask = clearedItems!.Single(item => item.Id == task.Id);
            TaskItemSummaryDto[]? allTasks = await browser.GetFromJsonAsync<TaskItemSummaryDto[]>("/api/tasks");
            TaskItemSummaryDto[]? unfilteredTasks = await browser.GetFromJsonAsync<TaskItemSummaryDto[]>("/api/tasks?listId=");
            TaskItemSummaryDto[]? otherTasks = await browser.GetFromJsonAsync<TaskItemSummaryDto[]>($"/api/tasks?listId={otherTask.TaskListId}");
            using HttpResponseMessage invalidFilter = await browser.GetAsync("/api/tasks?listId=invalid");

            using (Assert.EnterMultipleScope())
            {
                Assert.That(forbiddenList.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
                Assert.That(forbiddenCompletion.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
                Assert.That(clearedTask.Note, Is.Null);
                Assert.That(clearedTask.DueDate, Is.Null);
                Assert.That(await db.TaskItems.AnyAsync(item => item.TaskListId == selected.Id && item.Title == "In the selected list"), Is.True);
                Assert.That(await db.TaskItems.AnyAsync(item => item.Id == task.Id && item.CompletedAt == null), Is.True);
                Assert.That(allTasks?.Select(item => item.ListId), Is.EqualTo(new[] { listId, selected.Id, selected.Id }));
                Assert.That(allTasks?.Any(item => item.Id == otherTask.Id), Is.False);
                Assert.That(unfilteredTasks?.Select(item => item.Id), Is.EqualTo(allTasks?.Select(item => item.Id)));
                Assert.That(otherTasks, Is.Empty);
                Assert.That(invalidFilter.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
            }

            db.TaskSteps.Add(new TaskStep { TaskItemId = task.Id, Title = "Proofread" });
            db.TaskAttachments.Add(new TaskAttachment { TaskItemId = task.Id, FileName = "draft.txt", ContentType = "text/plain", Content = [1] });
            db.TaskLinks.Add(new TaskLink { TaskItemId = task.Id, Url = "https://example.com" });
            await db.SaveChangesAsync();

            using HttpResponseMessage missingToken = await browser.DeleteAsync(taskPath);
            using HttpResponseMessage forbiddenDelete = await SendAsync(browser, HttpMethod.Delete, $"/api/tasks/{otherTask.Id}", token);
            using HttpResponseMessage deleted = await SendAsync(browser, HttpMethod.Delete, taskPath, token);
            using HttpResponseMessage deletedAgain = await SendAsync(browser, HttpMethod.Delete, taskPath, token);
            using (Assert.EnterMultipleScope())
            {
                Assert.That(missingToken.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
                Assert.That(forbiddenDelete.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
                Assert.That(deleted.StatusCode, Is.EqualTo(HttpStatusCode.NoContent));
                Assert.That(deletedAgain.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
                Assert.That(await db.TaskItems.AnyAsync(item => item.Id == otherTask.Id), Is.True);
                Assert.That(await db.TaskItems.AnyAsync(item => item.Id == task.Id), Is.False);
                Assert.That(await db.TaskSteps.AnyAsync(item => item.TaskItemId == task.Id), Is.False);
                Assert.That(await db.TaskAttachments.AnyAsync(item => item.TaskItemId == task.Id), Is.False);
                Assert.That(await db.TaskLinks.AnyAsync(item => item.TaskItemId == task.Id), Is.False);
            }
        }

        private static async Task<string> GetRequestTokenAsync(HttpClient browser)
        {
            JsonElement session = await browser.GetFromJsonAsync<JsonElement>("/api/auth/session");
            return session.GetProperty("requestToken").GetString()!;
        }

        private static async Task<HttpResponseMessage> SendAsync(HttpClient browser, HttpMethod method, string path, string token, object? body = null)
        {
            using HttpRequestMessage request = new(method, path);
            if (body is not null)
            {
                request.Content = JsonContent.Create(body);
            }
            request.Headers.Add("X-CSRF-Token", token);
            return await browser.SendAsync(request);
        }
    }
}
