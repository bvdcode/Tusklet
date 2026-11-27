// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using EasyExtensions.Mediator;
using Microsoft.AspNetCore.Mvc;
using Tusklet.Server.Handlers.Counter;
using Tusklet.Server.Models.Dto;

namespace Tusklet.Server.Controllers
{
    [ApiController]
    [Route("api/counter")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public class CounterController(IMediator mediator) : ControllerBase
    {
        [HttpGet]
        public Task<CounterResponse> Get(CancellationToken cancellationToken)
        {
            return mediator.Send(new GetCounterQuery(), cancellationToken);
        }

        [HttpPost]
        public Task<CounterResponse> Increment(CancellationToken cancellationToken)
        {
            return mediator.Send(new IncrementCounterCommand(), cancellationToken);
        }
    }
}
