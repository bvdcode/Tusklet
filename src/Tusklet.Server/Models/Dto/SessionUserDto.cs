// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using EasyExtensions.Models.Dto;

namespace Tusklet.Server.Models.Dto
{
    public class SessionUserDto : BaseDto<Guid>
    {
        public required string Username { get; init; }

        public required bool IsAdmin { get; init; }

        public required bool OpenIdLinked { get; init; }

        public string? PictureUrl { get; init; }
    }
}
