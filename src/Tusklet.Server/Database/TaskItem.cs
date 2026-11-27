// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using EasyExtensions.EntityFrameworkCore.Abstractions;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace Tusklet.Server.Database
{
    [Table("task_items")]
    [Index(nameof(TaskListId), nameof(Position))]
    public class TaskItem : BaseEntity<Guid>
    {
        public TaskItem() { }

        internal TaskItem(Guid id) => Id = id;

        [Column("task_list_id")]
        public Guid TaskListId { get; set; }

        [ForeignKey(nameof(TaskListId))]
        [DeleteBehavior(DeleteBehavior.Restrict)]
        public TaskList TaskList { get; set; } = null!;

        [Column("title")]
        [MaxLength(255)]
        public string Title { get; set; } = null!;

        [Column("note")]
        public string? Note { get; set; }

        [Column("priority")]
        public TaskPriority Priority { get; set; }

        [Column("due_date")]
        public DateOnly? DueDate { get; set; }

        [Column("progress")]
        public TaskProgress? Progress { get; set; }

        [Column("starts_at")]
        public DateTime? StartsAt { get; set; }

        [Column("start_time_zone")]
        [MaxLength(255)]
        public string? StartTimeZone { get; set; }

        [Column("reminder_at")]
        public DateTime? ReminderAt { get; set; }

        [Column("reminder_time_zone")]
        [MaxLength(255)]
        public string? ReminderTimeZone { get; set; }

        [Column("reminder_enabled")]
        public bool? ReminderEnabled { get; set; }

        [Column("recurrence", TypeName = "jsonb")]
        public JsonElement? Recurrence { get; set; }

        [Column("completed_at")]
        public DateTime? CompletedAt { get; set; }

        [Column("position")]
        public int Position { get; set; }

        public ICollection<TaskLink> Links { get; set; } = [];
    }
}
