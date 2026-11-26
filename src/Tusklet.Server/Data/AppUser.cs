// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using EasyExtensions.EntityFrameworkCore.Abstractions;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Tusklet.Server.Data
{
    [Table("users")]
    [Index(nameof(NormalizedUsername), IsUnique = true)]
    public class AppUser : BaseEntity<Guid>
    {
        [Column("username")]
        [MaxLength(64)]
        public string Username { get; set; } = null!;

        [Column("normalized_username")]
        [MaxLength(64)]
        public string NormalizedUsername { get; set; } = null!;

        [Column("password_hash")]
        public string PasswordHash { get; set; } = null!;

        [Column("is_admin")]
        public bool IsAdmin { get; set; }
    }
}
