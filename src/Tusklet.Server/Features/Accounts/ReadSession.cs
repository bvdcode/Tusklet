// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using EasyExtensions.Mediator;
using EasyExtensions.Mediator.Contracts;
using Microsoft.EntityFrameworkCore;
using Tusklet.Server.Data;

namespace Tusklet.Server.Features.Accounts
{
    internal record ReadSession(Guid? UserId) : IRequest<SessionStatus>;

    internal class ReadSessionHandler(TuskletDbContext db) : IRequestHandler<ReadSession, SessionStatus>
    {
        public async Task<SessionStatus> Handle(ReadSession request, CancellationToken ct)
        {
            OpenIdProvider? provider = await db.OpenIdProviders.AsNoTracking().SingleOrDefaultAsync(ct);
            string? currentIssuer = provider?.Issuer;
            SessionUserDto? user = await db.Users
                .Where(user => user.Id == request.UserId)
                .Select(user => new SessionUserDto
                {
                    Id = user.Id,
                    Username = user.Username,
                    IsAdmin = user.IsAdmin,
                    OpenIdLinked = db.ExternalIdentities.Any(
                        link => link.UserId == user.Id && link.Issuer == currentIssuer),
                })
                .SingleOrDefaultAsync(ct);

            bool setupRequired = user is null && !await db.Users.AnyAsync(ct);
            return new SessionStatus(setupRequired, provider?.Enabled == true, user);
        }
    }
}
