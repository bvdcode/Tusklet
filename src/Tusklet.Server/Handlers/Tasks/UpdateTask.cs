// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using EasyExtensions.Mediator;
using EasyExtensions.Mediator.Contracts;
using Microsoft.EntityFrameworkCore;
using Tusklet.Server.Models.Requests;

namespace Tusklet.Server.Handlers.Tasks
{
    internal record UpdateTask(Guid OwnerId, Guid TaskId, UpdateTaskInput Input) : IRequest<bool>;

    internal class UpdateTaskHandler(TuskletDbContext db) : IRequestHandler<UpdateTask, bool>
    {
        public async Task<bool> Handle(UpdateTask request, CancellationToken ct)
        {
            TaskItem? task = await db.TaskItems.SingleOrDefaultAsync(item => item.Id == request.TaskId
                && item.TaskList.OwnerId == request.OwnerId, ct);
            if (task is null)
            {
                return false;
            }

            UpdateTaskInput input = request.Input;
            if (input.ListId is Guid listId && listId != task.TaskListId)
            {
                if (!await db.TaskLists.AnyAsync(list => list.Id == listId && list.OwnerId == request.OwnerId, ct))
                {
                    return false;
                }
                int? lastPosition = await db.TaskItems.Where(item => item.TaskListId == listId)
                    .Select(item => (int?)item.Position).MaxAsync(ct);
                task.TaskListId = listId;
                task.Position = (lastPosition ?? -1) + 1;
            }
            if (input.Title is not null)
            {
                task.Title = input.Title.Trim();
            }
            if (input.HasNote)
            {
                string? note = input.Note?.Trim();
                task.Note = string.IsNullOrEmpty(note) ? null : note;
            }
            if (input.HasDueDate)
            {
                task.DueDate = input.DueDate;
            }
            if (input.IsImportant is bool important && important != (task.Priority == TaskPriority.High))
            {
                task.Priority = important ? TaskPriority.High : TaskPriority.Normal;
            }

            await db.SaveChangesAsync(ct);
            return true;
        }
    }
}
