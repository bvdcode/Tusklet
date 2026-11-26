// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using Microsoft.EntityFrameworkCore;
using Tusklet.Server.Data;

namespace Tusklet.Server.Features.Accounts
{
    internal class AccountStartup(IServiceScopeFactory scopes,
        SetupCode setupCode, OpenIdOptions openId, ILogger<AccountStartup> logger) : IHostedService
    {
        public async Task StartAsync(CancellationToken ct)
        {
            await using AsyncServiceScope scope = scopes.CreateAsyncScope();
            TuskletDbContext db = scope.ServiceProvider.GetRequiredService<TuskletDbContext>();
            await db.Database.MigrateAsync(ct);

            OpenIdProvider? provider = await db.OpenIdProviders.AsNoTracking().SingleOrDefaultAsync(ct);
            openId.Refresh(provider);
            if (await db.Users.AnyAsync(ct))
            {
                setupCode.Clear();
                return;
            }

            await setupCode.CreateAsync(ct);
            logger.LogInformation("First-time setup code is available at {Path}", setupCode.FilePath);
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            return Task.CompletedTask;
        }
    }
}
