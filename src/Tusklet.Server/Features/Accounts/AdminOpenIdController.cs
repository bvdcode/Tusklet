// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using EasyExtensions.Mediator;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Tusklet.Server.Features.Accounts
{
    [ApiController]
    [Route("api/admin/openid")]
    [Authorize(Roles = Session.AdminRole)]
    [AutoValidateAntiforgeryToken]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public class AdminOpenIdController(IMediator mediator) : ControllerBase
    {
        [HttpGet]
        public async Task<IActionResult> GetAsync(CancellationToken ct)
        {
            OpenIdSettingsDto? settings = await mediator.Send(new ReadOpenIdSettings(), ct);
            return settings is null ? NoContent() : Ok(settings);
        }

        [HttpPut]
        public async Task<IActionResult> PutAsync(OpenIdSettingsInput settings, CancellationToken ct)
        {
            return await mediator.Send(new SaveOpenIdSettings(settings), ct) ? NoContent() : BadRequest();
        }
    }
}
