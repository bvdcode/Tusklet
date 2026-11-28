// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using EasyExtensions.Mediator;
using EasyExtensions.Mediator.Contracts;
using Microsoft.EntityFrameworkCore;
using Tusklet.Server.Realtime;

namespace Tusklet.Server.Handlers.Tasks
{
    internal record SetTaskCompletion(Guid OwnerId, Guid TaskId, bool IsCompleted) : IRequest<bool>;

    internal class SetTaskCompletionHandler(TuskletDbContext db, TaskWorkspacePublisher publisher) : IRequestHandler<SetTaskCompletion, bool>
    {
        public async Task<bool> Handle(SetTaskCompletion request, CancellationToken ct)
        {
            TaskItem? task = await db.TaskItems.SingleOrDefaultAsync(item => item.Id == request.TaskId
                && item.TaskList.OwnerId == request.OwnerId, ct);
            if (task is null)
            {
                return false;
            }
            if (task.CompletedAt.HasValue != request.IsCompleted)
            {
                task.CompletedAt = request.IsCompleted ? DateTime.UtcNow : null;
                await db.SaveChangesAsync(ct);
                await publisher.PublishAsync(request.OwnerId);
            }
            return true;
        }
    }
}
