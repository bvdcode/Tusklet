// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using EasyExtensions.Mediator;
using EasyExtensions.Mediator.Contracts;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Tusklet.Server.Models.Requests;

namespace Tusklet.Server.Handlers.Auth
{
    internal record VerifyPassword(Credentials Input) : IRequest<User?>;

    internal class VerifyPasswordHandler(TuskletDbContext db, IPasswordHasher<User> passwords)
        : IRequestHandler<VerifyPassword, User?>
    {
        public async Task<User?> Handle(VerifyPassword request, CancellationToken ct)
        {
            string username = request.Input.Username.Trim().ToUpperInvariant();
            User? user = await db.Users.SingleOrDefaultAsync(x => x.NormalizedUsername == username, ct);
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
