// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using EasyExtensions.Mediator;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using System.Security.Claims;
using Tusklet.Server.Handlers.Auth.OpenId;
using Tusklet.Server.Models;

namespace Tusklet.Server.Auth
{
    internal static class OpenIdEvents
    {
        public static string FailureLocation(string? linkSession)
        {
            return linkSession is null ? "/?openid=failed" : "/profile?openid=failed";
        }

        public static Task RedirectAsync(RedirectContext context, OpenIdConfiguration? configuration)
        {
            if (configuration is null)
            {
                context.Response.Redirect(FailureLocation(context.Properties.GetString(OpenIdOptions.LinkSessionKey)));
                context.HandleResponse();
                return Task.CompletedTask;
            }

            context.ProtocolMessage.RedirectUri = configuration.CallbackUrl;
            context.Properties.Items[OpenIdOptions.RevisionKey] = configuration.Revision.ToString();
            return Task.CompletedTask;
        }

        public static async Task CompleteAsync(TicketReceivedContext context)
        {
            context.HandleResponse();
            ClaimsPrincipal? identity = context.Principal;
            string? issuer = identity?.FindFirstValue("iss");
            string? subject = identity?.FindFirstValue("sub");
            string? linkSession = context.Properties?.GetString(OpenIdOptions.LinkSessionKey);
            string failureLocation = FailureLocation(linkSession);
            if (string.IsNullOrEmpty(issuer) || string.IsNullOrEmpty(subject)
                || issuer.Length > 512 || subject.Length > 255
                || !Guid.TryParse(context.Properties?.GetString(OpenIdOptions.RevisionKey), out Guid revision))
            {
                context.Response.Redirect(failureLocation);
                return;
            }

            HttpContext http = context.HttpContext;
            Guid? linkUserId = null;
            if (linkSession is not null)
            {
                AuthenticateResult current = await http.AuthenticateAsync(Session.Scheme);
                if (current.Principal?.FindFirstValue(Session.SessionIdClaim) != linkSession
                    || Session.GetUserId(current.Principal) is not Guid userId)
                {
                    context.Response.Redirect(failureLocation);
                    return;
                }
                linkUserId = userId;
            }

            IMediator mediator = http.RequestServices.GetRequiredService<IMediator>();
            User? user = await mediator.Send(new ResolveOpenIdAccount(revision, issuer, subject, linkUserId),
                http.RequestAborted);
            if (user is null)
            {
                context.Response.Redirect(failureLocation);
                return;
            }

            if (linkUserId is null)
            {
                await Session.SignInAsync(http, user);
            }
            context.Response.Redirect(linkUserId is null ? "/" : "/profile?openid=linked");
        }

        public static Task FailAsync(RemoteFailureContext context)
        {
            context.HandleResponse();
            context.Response.Redirect(FailureLocation(context.Properties?.GetString(OpenIdOptions.LinkSessionKey)));
            return Task.CompletedTask;
        }
    }
}
