// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

namespace Tusklet.Server.Services
{
    public class CounterState
    {
        private long _count;

        public long Count => Interlocked.Read(ref _count);

        public long Increment() => Interlocked.Increment(ref _count);
    }
}
