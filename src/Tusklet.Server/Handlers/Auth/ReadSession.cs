// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using EasyExtensions.Mediator;
using EasyExtensions.Mediator.Contracts;
using Microsoft.EntityFrameworkCore;
using Tusklet.Server.Models;
using Tusklet.Server.Models.Dto;

namespace Tusklet.Server.Handlers.Auth
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
                .LeftJoin(db.ExternalIdentities.Where(link => link.Issuer == currentIssuer),
                    user => user.Id, link => link.UserId,
                    (user, link) => new SessionUserDto
                    {
                        Id = user.Id,
                        Username = user.Username,
                        IsAdmin = user.IsAdmin,
                        OpenIdLinked = link != null,
                        PictureUrl = link == null ? null : link.PictureUrl,
                        Preferences = user.Preferences ?? new Dictionary<string, string>(),
                    })
                .SingleOrDefaultAsync(ct);

            bool setupRequired = user is null && !await db.Users.AnyAsync(ct);
            return new SessionStatus(setupRequired, provider?.Enabled == true, user);
        }
    }
}
