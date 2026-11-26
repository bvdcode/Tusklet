// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using EasyExtensions.Mediator;
using EasyExtensions.Mediator.Contracts;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Npgsql;
using Tusklet.Server.Data;

namespace Tusklet.Server.Features.Accounts
{
    internal record ResolveOpenIdAccount(Guid Revision, string Issuer, string Subject, Guid? LinkUserId)
        : IRequest<AppUser?>;

    internal class ResolveOpenIdAccountHandler(TuskletDbContext db, ILogger<ResolveOpenIdAccountHandler> logger)
        : IRequestHandler<ResolveOpenIdAccount, AppUser?>
    {
        public async Task<AppUser?> Handle(ResolveOpenIdAccount request, CancellationToken ct)
        {
            await using IDbContextTransaction transaction = await db.Database.BeginTransactionAsync(ct);
            if (!await db.OpenIdProviders.AnyAsync(provider => provider.Enabled
                && provider.Revision == request.Revision && provider.Issuer == request.Issuer, ct))
            {
                return null;
            }

            ExternalIdentity? identity = await db.ExternalIdentities.Include(link => link.User)
                .SingleOrDefaultAsync(link => link.Issuer == request.Issuer && link.Subject == request.Subject, ct);
            if (identity is not null)
            {
                return request.LinkUserId is null || request.LinkUserId == identity.UserId ? identity.User : null;
            }
            if (request.LinkUserId is not Guid userId)
            {
                return null;
            }

            AppUser? user = await db.Users.FindAsync([userId], ct);
            if (user is null || await db.ExternalIdentities.AnyAsync(
                link => link.UserId == userId && link.Issuer == request.Issuer, ct))
            {
                return null;
            }

            db.ExternalIdentities.Add(new ExternalIdentity
            {
                UserId = user.Id,
                Issuer = request.Issuer,
                Subject = request.Subject,
            });
            try
            {
                await db.SaveChangesAsync(ct);
                await transaction.CommitAsync(ct);
            }
            catch (DbUpdateException exception) when (exception.InnerException is PostgresException
                { SqlState: PostgresErrorCodes.UniqueViolation })
            {
                logger.LogInformation("Another request already linked an OpenID account");
                return null;
            }
            return user;
        }
    }
}
