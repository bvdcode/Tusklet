// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

namespace Tusklet.Server.Features.Accounts
{
    internal record SessionStatus(bool SetupRequired, bool OpenIdEnabled, SessionUserDto? User);
}
