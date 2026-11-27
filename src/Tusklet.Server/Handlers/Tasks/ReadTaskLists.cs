// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using EasyExtensions.Mediator;
using EasyExtensions.Mediator.Contracts;
using Microsoft.EntityFrameworkCore;
using Tusklet.Server.Models.Dto;

namespace Tusklet.Server.Handlers.Tasks
{
    internal record ReadTaskLists(Guid OwnerId) : IRequest<List<TaskListSummaryDto>>;

    internal class ReadTaskListsHandler(TuskletDbContext db) : IRequestHandler<ReadTaskLists, List<TaskListSummaryDto>>
    {
        public Task<List<TaskListSummaryDto>> Handle(ReadTaskLists request, CancellationToken ct)
        {
            return db.TaskLists.Where(list => list.OwnerId == request.OwnerId)
                .OrderBy(list => list.Position).ThenBy(list => list.Id)
                .Select(list => new TaskListSummaryDto { Id = list.Id, Name = list.Name }).ToListAsync(ct);
        }
    }
}
