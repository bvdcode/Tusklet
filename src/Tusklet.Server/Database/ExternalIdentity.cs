// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using EasyExtensions.EntityFrameworkCore.Abstractions;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Tusklet.Server.Database
{
    [Table("external_identities")]
    [Index(nameof(Issuer), nameof(Subject), IsUnique = true)]
    [Index(nameof(UserId), nameof(Issuer), IsUnique = true)]
    public class ExternalIdentity : BaseEntity<Guid>
    {
        internal const int PictureUrlMaxLength = 2048;

        [Column("user_id")]
        public Guid UserId { get; set; }

        [ForeignKey(nameof(UserId))]
        [DeleteBehavior(DeleteBehavior.Restrict)]
        public User User { get; set; } = null!;

        [Column("issuer")]
        [MaxLength(512)]
        public string Issuer { get; set; } = null!;

        [Column("subject")]
        [MaxLength(255)]
        public string Subject { get; set; } = null!;

        [Column("picture_url")]
        [MaxLength(PictureUrlMaxLength)]
        public string? PictureUrl { get; set; }
    }
}
