// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using System.ComponentModel.DataAnnotations;

namespace Tusklet.Server.Models.Requests
{
    public record UpdateTaskInput
    {
        private string? _note;
        private DateOnly? _dueDate;

        [StringLength(255, MinimumLength = 1), RegularExpression(@"(?=[^\x00]*[^\x00\s])[^\x00]+")]
        public string? Title { get; init; }

        [RegularExpression(@"[^\x00]*")]
        public string? Note
        {
            get => _note;
            init
            {
                _note = value;
                HasNote = true;
            }
        }

        public DateOnly? DueDate
        {
            get => _dueDate;
            init
            {
                _dueDate = value;
                HasDueDate = true;
            }
        }

        public Guid? ListId { get; init; }
        public bool? IsImportant { get; init; }
        internal bool HasNote { get; private set; }
        internal bool HasDueDate { get; private set; }
    }
}
