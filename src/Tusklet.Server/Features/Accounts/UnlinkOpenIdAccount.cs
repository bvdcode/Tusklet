// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using EasyExtensions.Mediator;
using EasyExtensions.Mediator.Contracts;
using Microsoft.EntityFrameworkCore;
using Tusklet.Server.Data;

namespace Tusklet.Server.Features.Accounts
{
    internal record UnlinkOpenIdAccount(Guid UserId) : IRequest<int>;

    internal class UnlinkOpenIdAccountHandler(TuskletDbContext db, ILogger<UnlinkOpenIdAccountHandler> logger)
        : IRequestHandler<UnlinkOpenIdAccount, int>
    {
        public async Task<int> Handle(UnlinkOpenIdAccount request, CancellationToken ct)
        {
            ExternalIdentity? identity = await db.ExternalIdentities.SingleOrDefaultAsync(
                link => link.UserId == request.UserId
                    && db.OpenIdProviders.Any(provider => provider.Issuer == link.Issuer), ct);
            if (identity is null)
            {
                return 0;
            }
            db.ExternalIdentities.Remove(identity);
            try
            {
                return await db.SaveChangesAsync(ct);
            }
            catch (DbUpdateConcurrencyException)
            {
                logger.LogInformation("Another request already removed the OpenID account link");
                return 0;
            }
        }
    }
}
