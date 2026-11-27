// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

namespace Tusklet.Server.Models
{
    internal static class UserPreferences
    {
        public static bool IsValid(string key, string value)
        {
            return key switch
            {
                "taskGrouping" => value is "none" or "list" or "status",
                "taskSorting" => value is "listOrder" or "title" or "dueDate" or "importance",
                "taskDueDateShortcut" => value is "none" or "today" or "tomorrow" or "week" or "month"
                    or "twoMonths" or "halfYear" or "year",
                "language" => value is "auto" or "en" or "ru" or "es" or "fr" or "pt"
                    or "id" or "zh-Hans" or "hi" or "bn" or "ar" or "ur",
                _ => false,
            };
        }
    }
}
