// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using EasyExtensions.Models.Dto;

namespace Tusklet.Server.Models.Dto
{
    public class OpenIdSettingsDto : BaseDto<Guid>
    {
        public required string Issuer { get; init; }

        public required string ClientId { get; init; }

        public required string CallbackUrl { get; init; }

        public required bool HasClientSecret { get; init; }

        public required bool Enabled { get; init; }
    }
}
