// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using EasyExtensions.Mediator;
using EasyExtensions.Mediator.Contracts;
using Microsoft.EntityFrameworkCore;
using Tusklet.Server.Models.Dto;

namespace Tusklet.Server.Handlers.Tasks
{
    internal record ReadTaskItems(Guid OwnerId, Guid ListId) : IRequest<List<TaskItemSummaryDto>>;

    internal class ReadTaskItemsHandler(TuskletDbContext db) : IRequestHandler<ReadTaskItems, List<TaskItemSummaryDto>>
    {
        public Task<List<TaskItemSummaryDto>> Handle(ReadTaskItems request, CancellationToken ct)
        {
            return db.TaskItems.Where(task => task.TaskListId == request.ListId && task.TaskList.OwnerId == request.OwnerId)
                .OrderBy(task => task.Position).ThenBy(task => task.Id)
                .Select(task => new TaskItemSummaryDto
                {
                    Id = task.Id,
                    Title = task.Title,
                    Note = task.Note,
                    DueDate = task.DueDate,
                    Progress = task.Progress,
                    StartsAt = task.StartsAt,
                    StartTimeZone = task.StartTimeZone,
                    ReminderAt = task.ReminderAt,
                    ReminderTimeZone = task.ReminderTimeZone,
                    ReminderEnabled = task.ReminderEnabled,
                    Recurrence = task.Recurrence,
                    Links = task.Links.OrderBy(link => link.Id).Select(link => new TaskLinkDto
                    {
                        Id = link.Id,
                        Url = link.Url,
                        DisplayName = link.DisplayName,
                        ApplicationName = link.ApplicationName,
                        ExternalId = link.ExternalId,
                    }).ToList(),
                    IsImportant = task.Priority == TaskPriority.High,
                    IsCompleted = task.CompletedAt.HasValue,
                }).ToListAsync(ct);
        }
    }
}
