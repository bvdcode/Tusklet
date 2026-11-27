// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace Tusklet.Server.Handlers.Auth
{
    internal class PreferenceWriteStrategy(TuskletDbContext db)
        : ExecutionStrategy(db, maxRetryCount: 3, maxRetryDelay: TimeSpan.FromMilliseconds(100))
    {
        protected override bool ShouldRetryOn(Exception exception)
        {
            return exception is DbUpdateConcurrencyException;
        }
    }
}
