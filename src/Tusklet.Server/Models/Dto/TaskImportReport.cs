// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

namespace Tusklet.Server.Models.Dto
{
    public record TaskImportReport(int Lists, int Tasks, int Completed, int Steps, int Attachments,
        int NewLists, int NewTasks, int UnsupportedTasks, int SharedLists, int RestoredTasks, int Links);
}
