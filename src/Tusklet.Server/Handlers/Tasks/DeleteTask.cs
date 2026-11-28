// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using EasyExtensions.Mediator;
using EasyExtensions.Mediator.Contracts;
using Microsoft.EntityFrameworkCore;

namespace Tusklet.Server.Handlers.Tasks
{
    internal record DeleteTask(Guid OwnerId, Guid TaskId) : IRequest<bool>;

    internal class DeleteTaskHandler(TuskletDbContext db) : IRequestHandler<DeleteTask, bool>
    {
        public async Task<bool> Handle(DeleteTask request, CancellationToken ct)
        {
            TaskItem? task = await db.TaskItems.Include(item => item.Links)
                .SingleOrDefaultAsync(item => item.Id == request.TaskId && item.TaskList.OwnerId == request.OwnerId, ct);
            if (task is null)
            {
                return false;
            }

            List<TaskStep> steps = await db.TaskSteps.Where(item => item.TaskItemId == task.Id).ToListAsync(ct);
            Guid[] attachmentIds = await db.TaskAttachments.Where(item => item.TaskItemId == task.Id)
                .Select(item => item.Id).ToArrayAsync(ct);
            db.TaskSteps.RemoveRange(steps);
            db.TaskAttachments.RemoveRange(attachmentIds.Select(id => new TaskAttachment(id) { TaskItemId = task.Id }));
            db.TaskLinks.RemoveRange(task.Links);
            db.TaskItems.Remove(task);
            await db.SaveChangesAsync(ct);
            return true;
        }
    }
}
