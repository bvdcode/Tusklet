// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using EasyExtensions.Mediator;
using EasyExtensions.Mediator.Contracts;
using Microsoft.EntityFrameworkCore;
using Tusklet.Server.Models;

namespace Tusklet.Server.Handlers.Auth
{
    internal record UpdateUserPreference(Guid UserId, string Key, string Value) : IRequest<PreferenceUpdateResult>;

    internal class UpdateUserPreferenceHandler(TuskletDbContext db) : IRequestHandler<UpdateUserPreference, PreferenceUpdateResult>
    {
        public Task<PreferenceUpdateResult> Handle(UpdateUserPreference request, CancellationToken ct)
        {
            if (!UserPreferences.IsValid(request.Key, request.Value))
            {
                return Task.FromResult(PreferenceUpdateResult.Invalid);
            }

            return new PreferenceWriteStrategy(db).ExecuteAsync(async cancellationToken =>
            {
                db.ChangeTracker.Clear();
                User? user = await db.Users.SingleOrDefaultAsync(user => user.Id == request.UserId, cancellationToken);
                if (user is null)
                {
                    return PreferenceUpdateResult.MissingUser;
                }

                Dictionary<string, string> preferences = user.Preferences ?? [];
                if (preferences.TryGetValue(request.Key, out string? savedValue) && savedValue == request.Value)
                {
                    return PreferenceUpdateResult.Updated;
                }

                user.Preferences = new(preferences) { [request.Key] = request.Value };
                await db.SaveChangesAsync(cancellationToken);
                return PreferenceUpdateResult.Updated;
            }, ct);
        }
    }
}
