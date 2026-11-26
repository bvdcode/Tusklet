// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using EasyExtensions.Mediator;
using EasyExtensions.Mediator.Contracts;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Tusklet.Server.Data;

namespace Tusklet.Server.Features.Accounts
{
    internal record VerifyPassword(Credentials Input) : IRequest<AppUser?>;

    internal class VerifyPasswordHandler(TuskletDbContext db, IPasswordHasher<AppUser> passwords)
        : IRequestHandler<VerifyPassword, AppUser?>
    {
        public async Task<AppUser?> Handle(VerifyPassword request, CancellationToken ct)
        {
            string username = request.Input.Username.Trim().ToUpperInvariant();
            AppUser? user = await db.Users.SingleOrDefaultAsync(x => x.NormalizedUsername == username, ct);
            if (user is null)
            {
                return null;
            }
            PasswordVerificationResult result = passwords.VerifyHashedPassword(
                user, user.PasswordHash, request.Input.Password);
            if (result == PasswordVerificationResult.Failed)
            {
                return null;
            }
            if (result == PasswordVerificationResult.SuccessRehashNeeded)
            {
                user.PasswordHash = passwords.HashPassword(user, request.Input.Password);
                await db.SaveChangesAsync(ct);
            }
            return user;
        }
    }
}
