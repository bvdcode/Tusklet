// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using EasyExtensions.EntityFrameworkCore.Abstractions;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Tusklet.Server.Database
{
    [Table("task_lists")]
    [Index(nameof(OwnerId), nameof(Position))]
    public class TaskList : BaseEntity<Guid>
    {
        public TaskList() { }

        internal TaskList(Guid id) => Id = id;

        [Column("owner_id")]
        public Guid OwnerId { get; set; }

        [ForeignKey(nameof(OwnerId))]
        [DeleteBehavior(DeleteBehavior.Restrict)]
        public User Owner { get; set; } = null!;

        [Column("name")]
        [MaxLength(255)]
        public string Name { get; set; } = null!;

        [Column("position")]
        public int Position { get; set; }
    }
}
