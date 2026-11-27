// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using EasyExtensions.Mediator;
using EasyExtensions.Mediator.Contracts;
using Microsoft.EntityFrameworkCore;
using Tusklet.Server.Models.Dto;

namespace Tusklet.Server.Handlers.Auth.OpenId
{
    internal record ReadOpenIdSettings : IRequest<OpenIdSettingsDto?>;

    internal class ReadOpenIdSettingsHandler(TuskletDbContext db)
        : IRequestHandler<ReadOpenIdSettings, OpenIdSettingsDto?>
    {
        public Task<OpenIdSettingsDto?> Handle(ReadOpenIdSettings request, CancellationToken ct)
        {
            return db.OpenIdProviders
                .Select(provider => new OpenIdSettingsDto
                {
                    Id = provider.Id,
                    Issuer = provider.Issuer,
                    ClientId = provider.ClientId,
                    CallbackUrl = provider.CallbackUrl,
                    HasClientSecret = provider.ProtectedClientSecret != "",
                    Enabled = provider.Enabled,
                })
                .SingleOrDefaultAsync(ct);
        }
    }
}
