// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

namespace Tusklet.Server.Features.Accounts
{
    internal record OpenIdConfiguration(
        Guid Revision,
        string Issuer,
        string ClientId,
        string ProtectedClientSecret,
        string CallbackUrl);
}
