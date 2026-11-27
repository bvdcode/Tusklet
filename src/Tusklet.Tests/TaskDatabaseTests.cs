// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using NUnit.Framework;
using Tusklet.Server.Database;

namespace Tusklet.Tests
{
    public class TaskDatabaseTests
    {
        [Test]
        public async Task TaskStorageWorksAfterUpgradingAnExistingAccountDatabase()
        {
            await using TuskletFactory factory = new();
            await using AsyncServiceScope scope = factory.Services.CreateAsyncScope();
            TuskletDbContext db = scope.ServiceProvider.GetRequiredService<TuskletDbContext>();
            await db.Database.MigrateAsync("20261127001827_CreateAccounts");

            User owner = new()
            {
                Username = "task-owner",
                NormalizedUsername = "TASK-OWNER",
                PasswordHash = "test-password-hash",
            };
            db.Users.Add(owner);
            await db.SaveChangesAsync();
            db.ChangeTracker.Clear();

            await db.Database.MigrateAsync();
            User savedOwner = await db.Users.SingleAsync();
            Assert.That(savedOwner.Id, Is.EqualTo(owner.Id));

            DateOnly dueDate = new(2026, 12, 1);
            DateTime completedAt = new(2026, 11, 30, 12, 0, 0, DateTimeKind.Utc);
            byte[] fileContent = [1, 2, 3, 4];
            TaskItem task = new()
            {
                TaskList = new TaskList { Owner = savedOwner, Name = "Work" },
                Title = "Review draft",
                Note = "Check the figures before sending.",
                Priority = TaskPriority.High,
                DueDate = dueDate,
            };
            db.TaskSteps.Add(new TaskStep { TaskItem = task, Title = "Check totals", CompletedAt = completedAt });
            db.TaskAttachments.Add(new TaskAttachment
            {
                TaskItem = task,
                FileName = "draft.pdf",
                ContentType = "application/pdf",
                Content = fileContent,
            });
            await db.SaveChangesAsync();
            db.ChangeTracker.Clear();

            TaskItem savedTask = await db.TaskItems.Include(item => item.TaskList).SingleAsync();
            TaskStep savedStep = await db.TaskSteps.SingleAsync();
            TaskAttachment savedAttachment = await db.TaskAttachments.SingleAsync();
            using (Assert.EnterMultipleScope())
            {
                Assert.That(savedTask.TaskList.OwnerId, Is.EqualTo(owner.Id));
                Assert.That(savedTask.Note, Is.EqualTo(task.Note));
                Assert.That(savedTask.DueDate, Is.EqualTo(dueDate));
                Assert.That(savedTask.Priority, Is.EqualTo(TaskPriority.High));
                Assert.That(savedStep.TaskItemId, Is.EqualTo(savedTask.Id));
                Assert.That(savedStep.CompletedAt, Is.EqualTo(completedAt));
                Assert.That(savedAttachment.TaskItemId, Is.EqualTo(savedTask.Id));
                Assert.That(savedAttachment.Content, Is.EqualTo(fileContent));
            }

            db.ChangeTracker.Clear();
            db.TaskItems.Remove(savedTask);
            await Assert.ThatAsync(() => db.SaveChangesAsync(), Throws.InstanceOf<DbUpdateException>());
        }
    }
}
