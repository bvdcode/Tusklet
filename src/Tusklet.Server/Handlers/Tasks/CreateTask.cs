// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using EasyExtensions.Mediator;
using EasyExtensions.Mediator.Contracts;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Tusklet.Server.Models.Requests;
using Tusklet.Server.Realtime;

namespace Tusklet.Server.Handlers.Tasks
{
    internal record CreateTask(Guid OwnerId, CreateTaskInput Input) : IRequest<Guid?>;

    internal class CreateTaskHandler(TuskletDbContext db, ILogger<CreateTaskHandler> logger, TaskWorkspacePublisher publisher)
        : IRequestHandler<CreateTask, Guid?>
    {
        public async Task<Guid?> Handle(CreateTask request, CancellationToken ct)
        {
            try
            {
                return await CreateAsync(request, ct);
            }
            catch (DbUpdateException exception) when (request.Input.ListId is null && exception.InnerException is PostgresException
                { SqlState: PostgresErrorCodes.UniqueViolation, ConstraintName: "PK_task_lists" })
            {
                logger.LogInformation("Reusing the task list created by a concurrent request");
                db.ChangeTracker.Clear();
                return await CreateAsync(request, ct);
            }
        }

        private async Task<Guid?> CreateAsync(CreateTask request, CancellationToken ct)
        {
            CreateTaskInput input = request.Input;
            IQueryable<TaskList> lists = db.TaskLists.Where(list => list.OwnerId == request.OwnerId);
            TaskList? list = input.ListId is Guid listId
                ? await lists.SingleOrDefaultAsync(list => list.Id == listId, ct)
                : await lists.OrderBy(list => list.Position).ThenBy(list => list.Id).FirstOrDefaultAsync(ct);
            bool listCreated = list is null;
            if (list is null)
            {
                if (input.ListId.HasValue)
                {
                    return null;
                }
                list = new TaskList(request.OwnerId) { OwnerId = request.OwnerId, Name = "Inbox" };
                db.TaskLists.Add(list);
            }

            int? lastPosition = await db.TaskItems.Where(task => task.TaskListId == list.Id)
                .Select(task => (int?)task.Position).MaxAsync(ct);
            string? note = input.Note?.Trim();
            db.TaskItems.Add(new TaskItem
            {
                TaskList = list,
                Title = input.Title.Trim(),
                Note = string.IsNullOrEmpty(note) ? null : note,
                DueDate = input.DueDate,
                Priority = input.IsImportant ? TaskPriority.High : TaskPriority.Normal,
                Position = (lastPosition ?? -1) + 1,
            });
            await db.SaveChangesAsync(ct);
            await publisher.PublishAsync(request.OwnerId, listCreated);
            return list.Id;
        }
    }
}
