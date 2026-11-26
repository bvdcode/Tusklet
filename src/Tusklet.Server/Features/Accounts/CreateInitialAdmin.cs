// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using EasyExtensions.Mediator;
using EasyExtensions.Mediator.Contracts;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Npgsql;
using System.Data;
using Tusklet.Server.Data;

namespace Tusklet.Server.Features.Accounts
{
    internal record CreateInitialAdmin(InitialAdminInput Input) : IRequest<AppUser?>;

    internal class CreateInitialAdminHandler(TuskletDbContext db, SetupCode code,
        IPasswordHasher<AppUser> passwords, ILogger<CreateInitialAdminHandler> logger)
        : IRequestHandler<CreateInitialAdmin, AppUser?>
    {
        public async Task<AppUser?> Handle(CreateInitialAdmin request, CancellationToken ct)
        {
            if (!code.Matches(request.Input.SetupCode))
            {
                return null;
            }

            AppUser user = new()
            {
                Username = request.Input.Username,
                NormalizedUsername = request.Input.Username.ToUpperInvariant(),
                IsAdmin = true,
            };
            user.PasswordHash = passwords.HashPassword(user, request.Input.Password);
            try
            {
                await using IDbContextTransaction transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
                if (await db.Users.AnyAsync(ct))
                {
                    return null;
                }

                db.Users.Add(user);
                await db.SaveChangesAsync(ct);
                await transaction.CommitAsync(ct);
            }
            catch (Exception exception) when (IsConcurrentSetup(exception) || IsConcurrentSetup(exception.InnerException))
            {
                logger.LogInformation("Another request completed first-time setup");
                return null;
            }
            code.Clear();
            return user;
        }

        private static bool IsConcurrentSetup(Exception? exception)
        {
            return exception is PostgresException
            {
                SqlState: PostgresErrorCodes.SerializationFailure or PostgresErrorCodes.UniqueViolation,
            };
        }
    }
}
