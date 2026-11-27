// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using Tusklet.Server.Models.Dto;

namespace Tusklet.Server.Models
{
    internal record SessionStatus(bool SetupRequired, bool OpenIdEnabled, SessionUserDto? User);
}
