// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using EasyExtensions.EntityFrameworkCore.Database;
using Microsoft.AspNetCore.DataProtection.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Tusklet.Server.Database
{
    public class TuskletDbContext(DbContextOptions<TuskletDbContext> options)
        : AuditedDbContext(options), IDataProtectionKeyContext
    {
        public DbSet<User> Users => Set<User>();
        public DbSet<OpenIdProvider> OpenIdProviders => Set<OpenIdProvider>();
        public DbSet<ExternalIdentity> ExternalIdentities => Set<ExternalIdentity>();
        public DbSet<TaskList> TaskLists => Set<TaskList>();
        public DbSet<TaskItem> TaskItems => Set<TaskItem>();
        public DbSet<TaskStep> TaskSteps => Set<TaskStep>();
        public DbSet<TaskAttachment> TaskAttachments => Set<TaskAttachment>();
        public DbSet<DataProtectionKey> DataProtectionKeys => Set<DataProtectionKey>();
    }
}
