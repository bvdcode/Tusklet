// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using EasyExtensions.Models.Dto;
using System.Text.Json;

namespace Tusklet.Server.Models.Dto
{
    public class TaskItemSummaryDto : BaseDto<Guid>
    {
        public required Guid ListId { get; init; }
        public required string Title { get; init; }
        public string? Note { get; init; }
        public DateOnly? DueDate { get; init; }
        public TaskProgress? Progress { get; init; }
        public DateTime? StartsAt { get; init; }
        public string? StartTimeZone { get; init; }
        public DateTime? ReminderAt { get; init; }
        public string? ReminderTimeZone { get; init; }
        public bool? ReminderEnabled { get; init; }
        public JsonElement? Recurrence { get; init; }
        public IReadOnlyList<TaskLinkDto> Links { get; init; } = [];
        public required bool IsImportant { get; init; }
        public required bool IsCompleted { get; init; }
    }
}
