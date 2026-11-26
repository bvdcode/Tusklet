// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using System.ComponentModel.DataAnnotations;

namespace Tusklet.Server.Features.Accounts
{
    public record OpenIdSettingsInput(
        [Required, StringLength(512)] string Issuer,
        [Required, StringLength(256)] string ClientId,
        [StringLength(4096)] string? ClientSecret,
        [Required, StringLength(512)] string CallbackUrl,
        bool Enabled);
}
