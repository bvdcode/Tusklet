// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Tusklet.Server.Realtime
{
    [Authorize]
    public class TaskWorkspaceHub : Hub<ITaskWorkspaceClient>
    {
        public const string Path = "/api/tasks/live";
    }
}
