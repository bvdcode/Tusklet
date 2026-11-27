// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using System.Text.Json.Serialization;

namespace Tusklet.Server.Database
{
    [JsonConverter(typeof(JsonStringEnumConverter<TaskProgress>))]
    public enum TaskProgress
    {
        NotStarted = 0,
        InProgress = 1,
        WaitingOnOthers = 2,
        Deferred = 3,
    }
}
