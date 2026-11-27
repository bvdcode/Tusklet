// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using EasyExtensions.Mediator;
using EasyExtensions.Mediator.Contracts;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Tusklet.Server.Auth;
using Tusklet.Server.Models.Requests;

namespace Tusklet.Server.Handlers.Auth.OpenId
{
    internal record SaveOpenIdSettings(OpenIdSettingsInput Input) : IRequest<bool>;

    internal class SaveOpenIdSettingsHandler(TuskletDbContext db, IDataProtectionProvider protection,
        OpenIdOptions options) : IRequestHandler<SaveOpenIdSettings, bool>
    {
        public async Task<bool> Handle(SaveOpenIdSettings request, CancellationToken ct)
        {
            OpenIdSettingsInput input = request.Input;
            if (!IsIssuer(input.Issuer) || !IsCallback(input.CallbackUrl))
            {
                return false;
            }

            await options.SettingsLock.WaitAsync(ct);
            try
            {
                await using IDbContextTransaction transaction = await db.Database.BeginTransactionAsync(ct);
                OpenIdProvider? provider = await db.OpenIdProviders.SingleOrDefaultAsync(ct);
                string? secret = input.ClientSecret;
                if (string.IsNullOrWhiteSpace(secret)
                    && (provider is null || provider.Issuer != input.Issuer || provider.ClientId != input.ClientId))
                {
                    return false;
                }
                if (provider is null)
                {
                    provider = new OpenIdProvider();
                    db.OpenIdProviders.Add(provider);
                }

                provider.Issuer = input.Issuer;
                provider.ClientId = input.ClientId;
                provider.CallbackUrl = input.CallbackUrl;
                provider.Enabled = input.Enabled;
                provider.Revision = Guid.NewGuid();
                if (!string.IsNullOrWhiteSpace(secret))
                {
                    provider.ProtectedClientSecret = protection.CreateProtector(OpenIdOptions.SecretPurpose).Protect(secret);
                }

                await db.SaveChangesAsync(ct);
                await transaction.CommitAsync(CancellationToken.None);
                options.Refresh(provider);
                return true;
            }
            finally
            {
                options.SettingsLock.Release();
            }
        }

        private static bool IsIssuer(string value)
        {
            return Uri.TryCreate(value, UriKind.Absolute, out Uri? uri)
                && uri.Scheme == Uri.UriSchemeHttps
                && HasNoExtraComponents(uri);
        }

        private static bool IsCallback(string value)
        {
            return Uri.TryCreate(value, UriKind.Absolute, out Uri? uri)
                && (uri.Scheme == Uri.UriSchemeHttps || (uri.IsLoopback && uri.Scheme == Uri.UriSchemeHttp))
                && HasNoExtraComponents(uri)
                && uri.AbsolutePath == OpenIdOptions.CallbackPath;
        }

        private static bool HasNoExtraComponents(Uri uri)
        {
            return uri.UserInfo.Length == 0 && uri.Query.Length == 0 && uri.Fragment.Length == 0;
        }
    }
}
