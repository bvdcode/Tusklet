// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using Microsoft.EntityFrameworkCore;
using Tusklet.Server.Auth;

namespace Tusklet.Server.Services
{
    internal class AccountStartup(IServiceScopeFactory scopes, OpenIdOptions openId) : IHostedService
    {
        public async Task StartAsync(CancellationToken ct)
        {
            await using AsyncServiceScope scope = scopes.CreateAsyncScope();
            TuskletDbContext db = scope.ServiceProvider.GetRequiredService<TuskletDbContext>();
            await db.Database.MigrateAsync(ct);

            OpenIdProvider? provider = await db.OpenIdProviders.AsNoTracking().SingleOrDefaultAsync(ct);
            openId.Refresh(provider);
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            return Task.CompletedTask;
        }
    }
}
