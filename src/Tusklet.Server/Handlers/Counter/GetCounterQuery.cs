// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using EasyExtensions.Mediator;
using EasyExtensions.Mediator.Contracts;
using Tusklet.Server.Models.Dto;
using Tusklet.Server.Services;

namespace Tusklet.Server.Handlers.Counter
{
    public record GetCounterQuery : IRequest<CounterResponse>;

    public class GetCounterQueryHandler(CounterState state) : IRequestHandler<GetCounterQuery, CounterResponse>
    {
        public Task<CounterResponse> Handle(GetCounterQuery request, CancellationToken cancellationToken)
        {
            return Task.FromResult(new CounterResponse(state.Count));
        }
    }
}
