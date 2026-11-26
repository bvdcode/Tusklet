// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using System.Security.Cryptography;
using Tusklet.Server.Data;

namespace Tusklet.Server.Features.Accounts
{
    internal class OpenIdOptions(
        IDataProtectionProvider protection,
        IOptionsMonitorCache<OpenIdConnectOptions> optionsCache,
        ILogger<OpenIdOptions> logger)
        : IConfigureNamedOptions<OpenIdConnectOptions>, IDisposable
    {
        public const string Scheme = OpenIdConnectDefaults.AuthenticationScheme;
        public const string CallbackPath = "/api/auth/openid/callback";
        public const string SecretPurpose = "Tusklet.OpenId.ClientSecret";
        public const string RevisionKey = "openid-revision";
        public const string LinkSessionKey = "link-session";

        private OpenIdConfiguration? _configuration;
        public SemaphoreSlim SettingsLock { get; } = new(1);
        public bool Enabled => Volatile.Read(ref _configuration) is not null;

        public void Refresh(OpenIdProvider? provider)
        {
            OpenIdConfiguration? configuration = null;
            if (provider?.Enabled == true)
            {
                configuration = new OpenIdConfiguration(provider.Revision, provider.Issuer, provider.ClientId,
                    provider.ProtectedClientSecret, provider.CallbackUrl);
            }
            Volatile.Write(ref _configuration, configuration);
            optionsCache.TryRemove(Scheme);
        }

        public void Configure(string? name, OpenIdConnectOptions options)
        {
            if (name != Scheme)
            {
                return;
            }

            options.CallbackPath = CallbackPath;
            options.SignInScheme = Session.Scheme;
            options.ResponseType = OpenIdConnectResponseType.Code;
            options.ResponseMode = OpenIdConnectResponseMode.Query;
            options.UsePkce = true;
            options.MapInboundClaims = false;
            options.ClaimActions.Remove("iss");
            options.Scope.Clear();
            options.Scope.Add(OpenIdConnectScope.OpenId);
            options.BackchannelTimeout = TimeSpan.FromSeconds(10);
            OpenIdConfiguration? configuration = Volatile.Read(ref _configuration);
            string? clientSecret = ReadSecret(configuration);
            options.Events.OnRedirectToIdentityProvider = context => OpenIdEvents.RedirectAsync(
                context, clientSecret is null ? null : configuration);
            options.Events.OnTicketReceived = OpenIdEvents.CompleteAsync;
            options.Events.OnRemoteFailure = OpenIdEvents.FailAsync;
            if (configuration is null || clientSecret is null)
            {
                options.ClientId = "disabled";
                options.Configuration = new OpenIdConnectConfiguration();
                return;
            }

            options.Authority = configuration.Issuer;
            options.ClientId = configuration.ClientId;
            options.ClientSecret = clientSecret;
            options.TokenValidationParameters.ValidAudience = configuration.ClientId;
        }

        public void Configure(OpenIdConnectOptions options)
        {
            Configure(Options.DefaultName, options);
        }

        public void Dispose()
        {
            SettingsLock.Dispose();
        }

        private string? ReadSecret(OpenIdConfiguration? configuration)
        {
            if (configuration is null)
            {
                return null;
            }
            try
            {
                return protection.CreateProtector(SecretPurpose).Unprotect(configuration.ProtectedClientSecret);
            }
            catch (CryptographicException)
            {
                logger.LogWarning("Could not decrypt the saved OpenID client secret. Replace it in OpenID settings.");
                return null;
            }
        }
    }
}
