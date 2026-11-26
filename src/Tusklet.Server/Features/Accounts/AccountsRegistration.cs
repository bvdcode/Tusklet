// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Threading.RateLimiting;
using Tusklet.Server.Data;

namespace Tusklet.Server.Features.Accounts
{
    internal static class AccountsRegistration
    {
        public const string AnonymousAuthRateLimit = "anonymous-auth";

        public static IServiceCollection AddAccounts(this IServiceCollection services)
        {
            services.AddSingleton<SetupCode>();
            services.AddHostedService<AccountStartup>();
            services.AddDbContext<TuskletDbContext>((provider, options) =>
            {
                IConfiguration configuration = provider.GetRequiredService<IConfiguration>();
                options.UseNpgsql(PostgresSettings.ReadConnectionString(configuration));
            });

            services.AddDataProtection().SetApplicationName("Tusklet").PersistKeysToDbContext<TuskletDbContext>();

            services.AddSingleton<IPasswordHasher<AppUser>, PasswordHasher<AppUser>>();
            services.AddSingleton<OpenIdOptions>();
            services.AddSingleton<IConfigureOptions<OpenIdConnectOptions>>(provider =>
                provider.GetRequiredService<OpenIdOptions>());
            services.AddAuthentication(Session.Scheme)
                .AddCookie(Session.Scheme, options =>
                {
                    options.Cookie.Name = "__Host-Tusklet.Session";
                    options.Cookie.Path = "/";
                    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
                    options.Events.OnRedirectToLogin = context => SetStatus(context.Response, StatusCodes.Status401Unauthorized);
                    options.Events.OnRedirectToAccessDenied = context => SetStatus(context.Response, StatusCodes.Status403Forbidden);
                    options.Events.OnValidatePrincipal = async context =>
                    {
                        if (context.Principal is null || Session.GetUserId(context.Principal) is not Guid userId)
                        {
                            context.RejectPrincipal();
                            return;
                        }

                        bool isAdmin = context.Principal.IsInRole(Session.AdminRole);
                        TuskletDbContext db = context.HttpContext.RequestServices.GetRequiredService<TuskletDbContext>();
                        if (!await db.Users.AnyAsync(user => user.Id == userId && user.IsAdmin == isAdmin,
                            context.HttpContext.RequestAborted))
                        {
                            context.RejectPrincipal();
                        }
                    };
                })
                .AddOpenIdConnect(OpenIdOptions.Scheme, _ => { });

            services.AddAuthorization();
            services.AddAntiforgery(options => options.HeaderName = "X-CSRF-Token");
            services.AddRateLimiter(options =>
            {
                options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
                options.AddPolicy(AnonymousAuthRateLimit, context => RateLimitPartition.GetFixedWindowLimiter(
                    context.Connection.RemoteIpAddress,
                    _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 15,
                        Window = TimeSpan.FromMinutes(1),
                    }));
            });
            return services;
        }

        private static Task SetStatus(HttpResponse response, int statusCode)
        {
            response.StatusCode = statusCode;
            return Task.CompletedTask;
        }
    }
}
