// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using EasyExtensions.EntityFrameworkCore.Abstractions;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Tusklet.Server.Database
{
    [Table("task_attachments")]
    public class TaskAttachment : BaseEntity<Guid>
    {
        public TaskAttachment() { }

        internal TaskAttachment(Guid id) => Id = id;

        [Column("task_item_id")]
        public Guid TaskItemId { get; set; }

        [ForeignKey(nameof(TaskItemId))]
        [DeleteBehavior(DeleteBehavior.Restrict)]
        public TaskItem TaskItem { get; set; } = null!;

        [Column("file_name")]
        [MaxLength(255)]
        public string FileName { get; set; } = null!;

        [Column("content_type")]
        [MaxLength(255)]
        public string ContentType { get; set; } = null!;

        [Column("content")]
        public byte[] Content { get; set; } = null!;
    }
}
