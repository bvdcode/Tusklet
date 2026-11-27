// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

namespace Tusklet.Server.Models
{
    internal class TaskImportBatch
    {
        public List<TaskList> Lists { get; } = [];
        public List<TaskItem> Tasks { get; } = [];
        public List<TaskStep> Steps { get; } = [];
        public List<TaskAttachment> Attachments { get; } = [];
        public Dictionary<Guid, DateTime> CreationTimes { get; } = [];
        public int UnsupportedTasks { get; set; }
        public int SharedLists { get; set; }
    }
}
