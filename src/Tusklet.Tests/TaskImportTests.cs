// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using NUnit.Framework;
using System.IO.Compression;
using System.Net;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text.Json;
using Tusklet.Server.Database;
using Tusklet.Server.Models.Dto;

namespace Tusklet.Tests
{
    public class TaskImportTests
    {
        [Test]
        public async Task PreviewAndRepeatedImportPreserveTasksStepsAttachmentsAndLocalEdits()
        {
            byte[] content = [11, 22, 33, 44];
            byte[] backup = CreateBackup(content, Convert.ToHexString(SHA256.HashData(content)));
            await using TuskletFactory factory = new();
            using HttpClient browser = factory.CreateBrowser();
            string initialToken = await RequestTokenAsync(browser);
            using HttpRequestMessage setup = new(HttpMethod.Post, "/api/auth/setup")
            {
                Content = JsonContent.Create(new { username = "import-admin", password = "local-test-passphrase" }),
            };
            setup.Headers.Add("X-CSRF-Token", initialToken);
            using HttpResponseMessage signedIn = await browser.SendAsync(setup);
            Assert.That(signedIn.StatusCode, Is.EqualTo(HttpStatusCode.NoContent));
            string token = await RequestTokenAsync(browser);

            using HttpResponseMessage noCsrf = await UploadAsync(browser, backup, null, preview: false);
            Assert.That(noCsrf.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
            using HttpResponseMessage preview = await UploadAsync(browser, backup, token, preview: true);
            TaskImportReport? forecast = await preview.Content.ReadFromJsonAsync<TaskImportReport>();
            Assert.That(forecast, Is.EqualTo(new TaskImportReport(1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0)));

            byte[] corrupted = CreateBackup(content, new string('0', 64));
            using HttpResponseMessage invalid = await UploadAsync(browser, corrupted, token, preview: false);
            Assert.That(invalid.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));

            await using AsyncServiceScope scope = factory.Services.CreateAsyncScope();
            TuskletDbContext db = scope.ServiceProvider.GetRequiredService<TuskletDbContext>();
            Assert.That(await db.TaskItems.CountAsync(), Is.Zero);

            HttpResponseMessage[] imports = await Task.WhenAll(
                UploadAsync(browser, backup, token, preview: false),
                UploadAsync(browser, backup, token, preview: false));
            using HttpResponseMessage first = imports[0];
            using HttpResponseMessage second = imports[1];
            TaskImportReport? firstReport = await first.Content.ReadFromJsonAsync<TaskImportReport>();
            TaskImportReport? secondReport = await second.Content.ReadFromJsonAsync<TaskImportReport>();
            Assert.That(new[] { firstReport?.NewTasks, secondReport?.NewTasks }, Is.EquivalentTo(new[] { 0, 1 }));

            TaskList list = await db.TaskLists.SingleAsync();
            TaskItem task = await db.TaskItems.SingleAsync();
            TaskStep step = await db.TaskSteps.SingleAsync();
            TaskAttachment attachment = await db.TaskAttachments.SingleAsync();
            using (Assert.EnterMultipleScope())
            {
                Assert.That(task.Note, Is.EqualTo("Task note"));
                Assert.That(task.DueDate, Is.EqualTo(new DateOnly(2026, 11, 28)));
                Assert.That(task.CreatedAt, Is.EqualTo(new DateTime(2026, 11, 24, 12, 0, 0, DateTimeKind.Utc)));
                Assert.That(task.Priority, Is.EqualTo(TaskPriority.High));
                Assert.That(task.CompletedAt, Is.EqualTo(new DateTime(2026, 11, 27, 11, 0, 0, DateTimeKind.Utc)));
                Assert.That(step.CompletedAt, Is.Not.Null);
                Assert.That(attachment.Content, Is.EqualTo(content));
            }
            list.Name = "Renamed list";
            task.Title = "Edited in Tusklet";
            await db.SaveChangesAsync();

            byte[] updated = CreateBackup(content, Convert.ToHexString(SHA256.HashData(content)), includeDetails: true);
            using HttpResponseMessage restorePreview = await UploadAsync(browser, updated, token, preview: true);
            TaskImportReport? restoreForecast = await restorePreview.Content.ReadFromJsonAsync<TaskImportReport>();
            Assert.That(restoreForecast, Is.EqualTo(new TaskImportReport(1, 1, 0, 1, 1, 0, 0, 0, 0, 1, 1)));
            Assert.That(await db.TaskLinks.CountAsync(), Is.Zero);

            using HttpResponseMessage restored = await UploadAsync(browser, updated, token, preview: false);
            Assert.That(await restored.Content.ReadFromJsonAsync<TaskImportReport>(), Is.EqualTo(restoreForecast));
            using HttpResponseMessage repeated = await UploadAsync(browser, updated, token, preview: false);
            TaskImportReport? repeatReport = await repeated.Content.ReadFromJsonAsync<TaskImportReport>();
            Assert.That(repeatReport, Is.EqualTo(new TaskImportReport(1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 1)));
            TaskListSummaryDto[]? lists = await browser.GetFromJsonAsync<TaskListSummaryDto[]>("/api/tasks/lists");
            TaskItemSummaryDto[]? tasks = await browser.GetFromJsonAsync<TaskItemSummaryDto[]>($"/api/tasks/lists/{list.Id}");
            TaskItemSummaryDto restoredTask = tasks!.Single();
            using (Assert.EnterMultipleScope())
            {
                Assert.That(lists?.Single().Name, Is.EqualTo("Renamed list"));
                Assert.That(restoredTask.Title, Is.EqualTo("Edited in Tusklet"));
                Assert.That(restoredTask.IsCompleted, Is.True);
                Assert.That(restoredTask.Progress, Is.EqualTo(TaskProgress.InProgress));
                Assert.That(restoredTask.StartsAt, Is.EqualTo(new DateTime(2026, 11, 26, 8, 0, 0, DateTimeKind.Utc)));
                Assert.That(restoredTask.StartTimeZone, Is.EqualTo("W. Europe Standard Time"));
                Assert.That(restoredTask.ReminderAt, Is.EqualTo(new DateTime(2026, 11, 27, 12, 15, 0, DateTimeKind.Utc)));
                Assert.That(restoredTask.ReminderTimeZone, Is.EqualTo("UTC"));
                Assert.That(restoredTask.ReminderEnabled, Is.False);
                Assert.That(restoredTask.Recurrence?.GetProperty("pattern").GetProperty("interval").GetInt32(), Is.EqualTo(2));
                Assert.That(restoredTask.Links.Single().ExternalId, Is.EqualTo("reference-id"));
                Assert.That(restoredTask.Links.Single().Url, Is.EqualTo("https://example.com/reference"));
            }
        }

        private static async Task<string> RequestTokenAsync(HttpClient browser)
        {
            JsonElement session = await browser.GetFromJsonAsync<JsonElement>("/api/auth/session");
            return session.GetProperty("requestToken").GetString()!;
        }

        private static async Task<HttpResponseMessage> UploadAsync(HttpClient browser, byte[] backup, string? token, bool preview)
        {
            using MultipartFormDataContent payload = new();
            payload.Add(new ByteArrayContent(backup), "file", "backup.zip");
            using HttpRequestMessage request = new(HttpMethod.Post, $"/api/tasks/import?preview={preview}") { Content = payload };
            if (token is not null)
            {
                request.Headers.Add("X-CSRF-Token", token);
            }
            return await browser.SendAsync(request);
        }

        private static byte[] CreateBackup(byte[] content, string hash, bool includeDetails = false)
        {
            using MemoryStream buffer = new();
            using (ZipArchive archive = new(buffer, ZipArchiveMode.Create, leaveOpen: true))
            {
                const string path = "attachments/file.txt";
                using (Stream file = archive.CreateEntry(path).Open())
                {
                    file.Write(content);
                }
                using Stream json = archive.CreateEntry("tasks.json").Open();
                JsonSerializer.Serialize(json, new
                {
                    format = "microsoft-todo-export",
                    formatVersion = 1,
                    source = new { accountId = "source-account" },
                    lists = new[] { new
                    {
                        id = "list-id", displayName = "Work", tasks = new[] { new
                        {
                            id = "task-id", title = "Original title", status = includeDetails ? "inProgress" : "completed", importance = "high",
                            createdDateTime = "2026-11-24T12:00:00Z",
                            body = new { contentType = "text", content = "Task note" },
                            dueDateTime = new { dateTime = "2026-11-28T00:00:00.0000000", timeZone = "UTC" },
                            completedDateTime = new { dateTime = "2026-11-27T12:00:00.0000000", timeZone = "W. Europe Standard Time" },
                            startDateTime = includeDetails ? new { dateTime = "2026-11-26T09:00:00.0000000", timeZone = "W. Europe Standard Time" } : null,
                            isReminderOn = false,
                            reminderDateTime = includeDetails ? new { dateTime = "2026-11-27T12:15:00.0000000", timeZone = "UTC" } : null,
                            recurrence = includeDetails ? new
                            {
                                pattern = new { type = "weekly", interval = 2, daysOfWeek = new[] { "thursday" } },
                                range = new { type = "numbered", startDate = "2026-11-26", numberOfOccurrences = 5, recurrenceTimeZone = "UTC" },
                            } : null,
                            linkedResources = includeDetails ? new[] { new
                            {
                                id = "link-id", webUrl = "https://example.com/reference", displayName = "Reference",
                                applicationName = "Example", externalId = "reference-id",
                            } } : null,
                            checklistItems = new[] { new
                            {
                                id = "step-id", displayName = "Checklist step", isChecked = true,
                                createdDateTime = "2026-11-25T12:00:00Z", checkedDateTime = "2026-11-26T12:00:00Z",
                            } },
                            attachments = new[] { new
                            {
                                id = "file-id", name = "file.txt", size = content.Length + 3, contentType = "text/plain",
                                exportedFile = new { path, bytes = content.Length, sha256 = hash },
                            } },
                        } },
                    } },
                });
            }
            return buffer.ToArray();
        }
    }
}
