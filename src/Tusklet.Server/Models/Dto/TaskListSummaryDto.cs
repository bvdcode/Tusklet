// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using EasyExtensions.Models.Dto;

namespace Tusklet.Server.Models.Dto
{
    public class TaskListSummaryDto : BaseDto<Guid>
    {
        public required string Name { get; init; }
        public bool IsInbox { get; init; }
    }
}
