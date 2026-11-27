// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using EasyExtensions.EntityFrameworkCore.Abstractions;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Tusklet.Server.Database
{
    [Table("task_steps")]
    [Index(nameof(TaskItemId), nameof(Position))]
    public class TaskStep : BaseEntity<Guid>
    {
        [Column("task_item_id")]
        public Guid TaskItemId { get; set; }

        [ForeignKey(nameof(TaskItemId))]
        [DeleteBehavior(DeleteBehavior.Restrict)]
        public TaskItem TaskItem { get; set; } = null!;

        [Column("title")]
        [MaxLength(255)]
        public string Title { get; set; } = null!;

        [Column("completed_at")]
        public DateTime? CompletedAt { get; set; }

        [Column("position")]
        public int Position { get; set; }
    }
}
