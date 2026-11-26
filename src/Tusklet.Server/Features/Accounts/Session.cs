// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using System.Security.Claims;
using Tusklet.Server.Data;

namespace Tusklet.Server.Features.Accounts
{
    internal static class Session
    {
        public const string Scheme = CookieAuthenticationDefaults.AuthenticationScheme;
        public const string AdminRole = "Admin";
        public const string SessionIdClaim = "sid";

        public static Guid? GetUserId(ClaimsPrincipal principal)
        {
            return Guid.TryParse(principal.FindFirstValue(ClaimTypes.NameIdentifier), out Guid id)
                ? id
                : null;
        }

        public static Task SignInAsync(HttpContext http, AppUser user)
        {
            List<Claim> claims =
            [
                new(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new(ClaimTypes.Name, user.Username),
                new(SessionIdClaim, Guid.NewGuid().ToString("N")),
            ];
            if (user.IsAdmin)
            {
                claims.Add(new(ClaimTypes.Role, AdminRole));
            }
            ClaimsPrincipal principal = new(new ClaimsIdentity(claims, Scheme));
            return http.SignInAsync(Scheme, principal);
        }
    }
}
