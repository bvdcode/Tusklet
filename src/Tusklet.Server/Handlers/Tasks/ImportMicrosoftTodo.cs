// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using EasyExtensions.EntityFrameworkCore.Abstractions;
using EasyExtensions.Mediator;
using EasyExtensions.Mediator.Contracts;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Tusklet.Server.Models;
using Tusklet.Server.Models.Dto;
using Tusklet.Server.Services;

namespace Tusklet.Server.Handlers.Tasks
{
    internal record ImportMicrosoftTodo(Guid OwnerId, Stream Archive, bool Preview) : IRequest<TaskImportReport>;

    internal class ImportMicrosoftTodoHandler(TuskletDbContext db, ILogger<ImportMicrosoftTodoHandler> logger)
        : IRequestHandler<ImportMicrosoftTodo, TaskImportReport>
    {
        public async Task<TaskImportReport> Handle(ImportMicrosoftTodo request, CancellationToken ct)
        {
            TaskImportBatch batch = await MicrosoftTodoArchive.ReadAsync(request.Archive, request.OwnerId, ct);
            try
            {
                return await ApplyAsync(batch, request.OwnerId, request.Preview, ct);
            }
            catch (DbUpdateException exception) when (exception.InnerException is PostgresException
                { SqlState: PostgresErrorCodes.UniqueViolation })
            {
                logger.LogInformation("Rechecking the task import after a concurrent insert");
                db.ChangeTracker.Clear();
                request.Archive.Position = 0;
                batch = await MicrosoftTodoArchive.ReadAsync(request.Archive, request.OwnerId, ct);
                return await ApplyAsync(batch, request.OwnerId, request.Preview, ct);
            }
        }

        private async Task<TaskImportReport> ApplyAsync(TaskImportBatch batch, Guid ownerId, bool preview, CancellationToken ct)
        {
            IQueryable<TaskList> ownedLists = db.TaskLists.Where(item => item.OwnerId == ownerId);
            Guid[] sourceIds = [.. batch.Tasks.Select(item => item.Id)];
            HashSet<Guid> existingLists = await ownedLists.Select(item => item.Id).ToHashSetAsync(ct);
            HashSet<Guid> existingTasks = await db.TaskItems
                .Where(item => item.TaskList.OwnerId == ownerId && sourceIds.Contains(item.Id))
                .Select(item => item.Id).ToHashSetAsync(ct);

            List<TaskList> newLists = [.. batch.Lists.Where(list => !existingLists.Contains(list.Id))];
            List<TaskItem> newTasks = [.. batch.Tasks.Where(task => !existingTasks.Contains(task.Id))];
            if (!preview && (newLists.Count > 0 || newTasks.Count > 0))
            {
                int position = await ownedLists.Select(list => (int?)list.Position).MaxAsync(ct) ?? -1;
                foreach (TaskList list in newLists)
                {
                    list.Position = ++position;
                }
                HashSet<Guid> newTaskIds = [.. newTasks.Select(task => task.Id)];
                db.TaskLists.AddRange(newLists);
                AddWithCreationTimes(newTasks, batch.CreationTimes);
                AddWithCreationTimes(batch.Steps.Where(step => newTaskIds.Contains(step.TaskItemId)), batch.CreationTimes);
                db.TaskAttachments.AddRange(batch.Attachments.Where(file => newTaskIds.Contains(file.TaskItemId)));
                await db.SaveChangesAsync(ct);
            }

            return new TaskImportReport(batch.Lists.Count, batch.Tasks.Count,
                batch.Tasks.Count(task => task.CompletedAt.HasValue), batch.Steps.Count, batch.Attachments.Count,
                newLists.Count, newTasks.Count, batch.UnsupportedTasks, batch.SharedLists);
        }

        private void AddWithCreationTimes<T>(IEnumerable<T> entities, Dictionary<Guid, DateTime> times)
            where T : BaseEntity<Guid>
        {
            foreach (T entity in entities)
            {
                db.Add(entity).Property(item => item.CreatedAt).CurrentValue = times[entity.Id];
            }
        }
    }
}
