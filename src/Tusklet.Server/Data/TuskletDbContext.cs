// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using EasyExtensions.EntityFrameworkCore.Database;
using Microsoft.AspNetCore.DataProtection.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Tusklet.Server.Data
{
    public class TuskletDbContext(DbContextOptions<TuskletDbContext> options)
        : AuditedDbContext(options), IDataProtectionKeyContext
    {
        public DbSet<AppUser> Users => Set<AppUser>();
        public DbSet<OpenIdProvider> OpenIdProviders => Set<OpenIdProvider>();
        public DbSet<ExternalIdentity> ExternalIdentities => Set<ExternalIdentity>();
        public DbSet<DataProtectionKey> DataProtectionKeys => Set<DataProtectionKey>();
    }
}
