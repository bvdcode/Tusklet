// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using EasyExtensions.EntityFrameworkCore.Abstractions;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Tusklet.Server.Database
{
    [Table("task_links")]
    public class TaskLink : BaseEntity<Guid>
    {
        public TaskLink() { }

        internal TaskLink(Guid id) => Id = id;

        [Column("task_item_id")]
        public Guid TaskItemId { get; set; }

        [ForeignKey(nameof(TaskItemId))]
        [DeleteBehavior(DeleteBehavior.Restrict)]
        public TaskItem TaskItem { get; set; } = null!;

        [Column("url")]
        public string Url { get; set; } = null!;

        [Column("display_name")]
        [MaxLength(255)]
        public string? DisplayName { get; set; }

        [Column("application_name")]
        [MaxLength(255)]
        public string? ApplicationName { get; set; }

        [Column("external_id")]
        [MaxLength(512)]
        public string? ExternalId { get; set; }
    }
}
