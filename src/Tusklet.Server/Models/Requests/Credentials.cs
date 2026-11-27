// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using System.ComponentModel.DataAnnotations;

namespace Tusklet.Server.Models.Requests
{
    public record Credentials(
        [Required, StringLength(64)] string Username,
        [Required, StringLength(128)] string Password);
}
