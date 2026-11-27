// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using EasyExtensions.Models.Dto;

namespace Tusklet.Server.Models.Dto
{
    public class TaskLinkDto : BaseDto<Guid>
    {
        public required string Url { get; init; }
        public string? DisplayName { get; init; }
        public string? ApplicationName { get; init; }
        public string? ExternalId { get; init; }
    }
}
