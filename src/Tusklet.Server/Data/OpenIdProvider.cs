// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using EasyExtensions.EntityFrameworkCore.Abstractions;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Tusklet.Server.Data
{
    [Table("openid_providers")]
    public class OpenIdProvider : BaseEntity<Guid>
    {
        [Column("issuer")]
        [MaxLength(512)]
        public string Issuer { get; set; } = null!;

        [Column("client_id")]
        [MaxLength(256)]
        public string ClientId { get; set; } = null!;

        [Column("protected_client_secret")]
        public string ProtectedClientSecret { get; set; } = null!;

        [Column("callback_url")]
        [MaxLength(512)]
        public string CallbackUrl { get; set; } = null!;

        [Column("revision")]
        public Guid Revision { get; set; }

        [Column("enabled")]
        public bool Enabled { get; set; }
    }
}
