// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using EasyExtensions.Mediator;
using EasyExtensions.Mediator.Contracts;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Npgsql;

namespace Tusklet.Server.Handlers.Auth.OpenId
{
    internal record ResolveOpenIdAccount(Guid Revision, string Issuer, string Subject, Guid? LinkUserId,
        string? PictureUrl)
        : IRequest<User?>;

    internal class ResolveOpenIdAccountHandler(TuskletDbContext db, ILogger<ResolveOpenIdAccountHandler> logger)
        : IRequestHandler<ResolveOpenIdAccount, User?>
    {
        public async Task<User?> Handle(ResolveOpenIdAccount request, CancellationToken ct)
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
                if (request.LinkUserId is not null && request.LinkUserId != identity.UserId)
                {
                    return null;
                }
                if (identity.PictureUrl == request.PictureUrl)
                {
                    return identity.User;
                }
            }
            else
            {
                if (request.LinkUserId is not Guid userId)
                {
                    return null;
                }

                User? user = await db.Users.FindAsync([userId], ct);
                if (user is null || await db.ExternalIdentities.AnyAsync(
                    link => link.UserId == userId && link.Issuer == request.Issuer, ct))
                {
                    return null;
                }

                identity = new ExternalIdentity
                {
                    User = user,
                    Issuer = request.Issuer,
                    Subject = request.Subject,
                };
                db.ExternalIdentities.Add(identity);
            }

            identity.PictureUrl = request.PictureUrl;
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
            catch (DbUpdateConcurrencyException)
            {
                logger.LogInformation("Another request already removed the OpenID account link");
                return null;
            }
            return identity.User;
        }
    }
}
