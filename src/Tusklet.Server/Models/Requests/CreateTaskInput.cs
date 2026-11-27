// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using System.ComponentModel.DataAnnotations;

namespace Tusklet.Server.Models.Requests
{
    public record CreateTaskInput(
        Guid? ListId,
        [Required, StringLength(255), RegularExpression(@"[^\x00]+")] string Title,
        [RegularExpression(@"[^\x00]*")] string? Note,
        DateOnly? DueDate,
        bool IsImportant);
}
