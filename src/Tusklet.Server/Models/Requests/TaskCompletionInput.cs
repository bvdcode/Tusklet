// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using System.Text.Json.Serialization;

namespace Tusklet.Server.Models.Requests
{
    public record TaskCompletionInput([property: JsonRequired] bool IsCompleted);
}
