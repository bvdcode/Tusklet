// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using System.ComponentModel.DataAnnotations;

namespace Tusklet.Server.Features.Accounts
{
    public record InitialAdminInput(
        [Required, RegularExpression("[a-zA-Z0-9._-]{3,64}")] string Username,
        [Required, StringLength(128, MinimumLength = 12)] string Password,
        [Required, StringLength(32, MinimumLength = 32)] string SetupCode);
}
