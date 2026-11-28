// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

namespace Tusklet.Server.Realtime
{
    public interface ITaskWorkspaceClient
    {
        Task WorkspaceChanged(bool listsChanged, string? originConnectionId);
    }
}
