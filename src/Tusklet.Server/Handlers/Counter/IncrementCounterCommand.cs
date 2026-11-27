// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using EasyExtensions.Mediator;
using EasyExtensions.Mediator.Contracts;
using Tusklet.Server.Models.Dto;
using Tusklet.Server.Services;

namespace Tusklet.Server.Handlers.Counter
{
    public record IncrementCounterCommand : IRequest<CounterResponse>;

    public class IncrementCounterCommandHandler(CounterState state) : IRequestHandler<IncrementCounterCommand, CounterResponse>
    {
        public Task<CounterResponse> Handle(IncrementCounterCommand request, CancellationToken cancellationToken)
        {
            return Task.FromResult(new CounterResponse(state.Increment()));
        }
    }
}
