// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using Microsoft.AspNetCore.SignalR;

namespace Tusklet.Server.Realtime
{
    internal class TaskWorkspacePublisher(IHubContext<TaskWorkspaceHub, ITaskWorkspaceClient> hub, IHttpContextAccessor http)
    {
        private const string OriginHeader = "X-Tusklet-Connection-Id";

        public Task PublishAsync(Guid ownerId, bool listsChanged = false)
        {
            string? origin = http.HttpContext?.Request.Headers[OriginHeader].ToString();
            return hub.Clients.User(ownerId.ToString()).WorkspaceChanged(listsChanged,
                origin is { Length: > 0 and <= 128 } ? origin : null);
        }
    }
}
