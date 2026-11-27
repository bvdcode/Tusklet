// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using EasyExtensions.Models.Dto;

namespace Tusklet.Server.Models.Dto
{
    public class TaskItemSummaryDto : BaseDto<Guid>
    {
        public required string Title { get; init; }
        public string? Note { get; init; }
        public DateOnly? DueDate { get; init; }
        public required bool IsImportant { get; init; }
        public required bool IsCompleted { get; init; }
    }
}
