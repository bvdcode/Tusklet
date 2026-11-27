// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using EasyExtensions.Mediator;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;
using Tusklet.Server.Auth;
using Tusklet.Server.Extensions;
using Tusklet.Server.Handlers.Auth;
using Tusklet.Server.Handlers.Auth.OpenId;
using Tusklet.Server.Models;
using Tusklet.Server.Models.Requests;

namespace Tusklet.Server.Controllers
{
    [ApiController]
    [Route("api/auth")]
    [AutoValidateAntiforgeryToken]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public class AuthController(IMediator mediator, IAntiforgery antiforgery,
        ILogger<AuthController> logger) : ControllerBase
    {
        [HttpGet("session")]
        public async Task<IActionResult> GetSessionAsync(CancellationToken ct)
        {
            SessionStatus session = await mediator.Send(new ReadSession(Session.GetUserId(User)), ct);
            AntiforgeryTokenSet tokens = antiforgery.GetAndStoreTokens(HttpContext);
            return Ok(new
            {
                session.SetupRequired,
                session.OpenIdEnabled,
                session.User,
                tokens.RequestToken,
            });
        }

        [HttpPost("setup")]
        [EnableRateLimiting(AccountsRegistration.AnonymousAuthRateLimit)]
        public async Task<IActionResult> SetupAsync(InitialAdminInput input, CancellationToken ct)
        {
            User? user = await mediator.Send(new CreateInitialAdmin(input), ct);
            return await SignInAsync(user);
        }

        [HttpPost("login")]
        [EnableRateLimiting(AccountsRegistration.AnonymousAuthRateLimit)]
        public async Task<IActionResult> LoginAsync(Credentials input, CancellationToken ct)
        {
            User? user = await mediator.Send(new VerifyPassword(input), ct);
            return await SignInAsync(user);
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> LogoutAsync()
        {
            await HttpContext.SignOutAsync(Session.Scheme);
            return NoContent();
        }

        [HttpPut("preferences/{key}")]
        [Authorize]
        public async Task<IActionResult> PutPreferenceAsync(string key, UserPreferenceInput input, CancellationToken ct)
        {
            if (Session.GetUserId(User) is not Guid userId)
            {
                return Unauthorized();
            }

            PreferenceUpdateResult result = await mediator.Send(new UpdateUserPreference(userId, key, input.Value), ct);
            return result switch
            {
                PreferenceUpdateResult.Updated => NoContent(),
                PreferenceUpdateResult.Invalid => BadRequest(),
                PreferenceUpdateResult.MissingUser => Unauthorized(),
                _ => throw new InvalidOperationException($"Unexpected preference update result: {result}"),
            };
        }

        [HttpPost("openid/login")]
        [EnableRateLimiting(AccountsRegistration.AnonymousAuthRateLimit)]
        public Task<IActionResult> LoginWithOpenIdAsync()
        {
            return StartOpenIdAsync(null);
        }

        [HttpPost("openid/link")]
        [Authorize]
        public Task<IActionResult> LinkOpenIdAsync()
        {
            string? session = User.FindFirstValue(Session.SessionIdClaim);
            return session is null ? Task.FromResult<IActionResult>(Unauthorized()) : StartOpenIdAsync(session);
        }

        [HttpDelete("openid/link")]
        [Authorize]
        public async Task<IActionResult> UnlinkOpenIdAsync(CancellationToken ct)
        {
            if (Session.GetUserId(User) is not Guid userId)
            {
                return Unauthorized();
            }
            await mediator.Send(new UnlinkOpenIdAccount(userId), ct);
            return NoContent();
        }

        private async Task<IActionResult> SignInAsync(User? user)
        {
            if (user is null)
            {
                return Unauthorized();
            }
            await Session.SignInAsync(HttpContext, user);
            return NoContent();
        }

        private async Task<IActionResult> StartOpenIdAsync(string? linkSession)
        {
            if (!HttpContext.RequestServices.GetRequiredService<OpenIdOptions>().Enabled)
            {
                return LocalRedirect(OpenIdEvents.FailureLocation(linkSession));
            }

            AuthenticationProperties properties = new() { RedirectUri = "/" };
            if (linkSession is not null)
            {
                properties.SetString(OpenIdOptions.LinkSessionKey, linkSession);
            }
            try
            {
                await HttpContext.ChallengeAsync(OpenIdOptions.Scheme, properties);
                return new EmptyResult();
            }
            catch (Exception exception) when (!Response.HasStarted
                && (exception is InvalidOperationException || exception is HttpRequestException))
            {
                logger.LogWarning("Could not start an OpenID Connect challenge ({ErrorType})", exception.GetType().Name);
                return LocalRedirect(OpenIdEvents.FailureLocation(linkSession));
            }
        }
    }
}
