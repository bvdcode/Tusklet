// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Vadim Belov <https://belov.us>

using System.Globalization;
using System.IO.Compression;
using System.Security.Cryptography;
using System.Text.Json;
using Tusklet.Server.Models;

namespace Tusklet.Server.Services
{
    internal static class MicrosoftTodoArchive
    {
        public const int MaxUploadBytes = 25 * 1024 * 1024;
        private const int MaxExpandedBytes = 64 * 1024 * 1024;
        private const int MaxJsonBytes = 16 * 1024 * 1024;
        private const int MaxEntries = 10000;
        private const string Format = "microsoft-todo-export";

        public static async Task<TaskImportBatch> ReadAsync(Stream stream, Guid ownerId, CancellationToken ct)
        {
            using ZipArchive zip = new(stream, ZipArchiveMode.Read, leaveOpen: true);
            if (zip.Entries.Count > MaxEntries || zip.Entries.Any(entry => entry.Length > MaxExpandedBytes)
                || zip.Entries.Sum(entry => entry.Length) > MaxExpandedBytes)
            {
                throw new InvalidDataException("The archive exceeds import limits.");
            }

            Dictionary<string, ZipArchiveEntry> entries = new(StringComparer.Ordinal);
            foreach (ZipArchiveEntry entry in zip.Entries)
            {
                if (!entries.TryAdd(entry.FullName, entry))
                {
                    throw new InvalidDataException("The archive contains duplicate paths.");
                }
            }
            if (!entries.TryGetValue("tasks.json", out ZipArchiveEntry? tasksFile) || tasksFile.Length > MaxJsonBytes)
            {
                throw new InvalidDataException("The archive must contain a supported tasks.json file.");
            }

            using JsonDocument document = JsonDocument.Parse(await ReadEntryAsync(tasksFile, ct));
            JsonElement root = document.RootElement;
            if (ReadString(root, "format") != Format || ReadInt(root, "formatVersion") != 1)
            {
                throw new InvalidDataException("The backup format is not supported.");
            }

            string account = ReadString(Property(root, "source"), "accountId", 512);
            Guid importId = CreateId(Format, ownerId.ToString("N"), account);
            TaskImportBatch batch = new();
            HashSet<Guid> identities = [];
            HashSet<string> filePaths = new(StringComparer.Ordinal);
            foreach (JsonElement sourceList in ReadArray(root, "lists", required: true))
            {
                TaskList list = new(RegisterId(identities, importId, "list", sourceList))
                {
                    OwnerId = ownerId,
                    Name = ReadString(sourceList, "displayName", 255),
                    Position = batch.Lists.Count,
                };
                batch.Lists.Add(list);
                if (IsFlagSet(sourceList, "isShared"))
                {
                    batch.SharedLists++;
                }

                int position = 0;
                foreach (JsonElement sourceTask in ReadArray(sourceList, "tasks", required: true))
                {
                    ct.ThrowIfCancellationRequested();
                    TaskItem task = ReadTask(sourceTask, list.Id, importId, identities, position++, batch);
                    batch.Tasks.Add(task);
                    ReadSteps(sourceTask, task.Id, identities, batch);
                    ReadLinks(sourceTask, task.Id, identities, batch);
                    foreach (JsonElement file in ReadArray(sourceTask, "attachments"))
                    {
                        batch.Attachments.Add(await ReadAttachmentAsync(file, task.Id, identities, entries, filePaths, ct));
                    }
                }
            }
            return batch;
        }

        private static TaskItem ReadTask(JsonElement source, Guid listId, Guid importId, HashSet<Guid> identities,
            int position, TaskImportBatch batch)
        {
            string status = ReadString(source, "status");
            TaskProgress? progress = status switch
            {
                "completed" or "notStarted" => null,
                "inProgress" => TaskProgress.InProgress,
                "waitingOnOthers" => TaskProgress.WaitingOnOthers,
                "deferred" => TaskProgress.Deferred,
                _ => throw new InvalidDataException("Unrecognized Microsoft To Do task status."),
            };
            TaskPriority priority = ReadString(source, "importance") switch
            {
                "low" => TaskPriority.Low,
                "normal" => TaskPriority.Normal,
                "high" => TaskPriority.High,
                _ => throw new InvalidDataException("Unrecognized Microsoft To Do task priority."),
            };
            string? note = null;
            JsonElement body = Property(source, "body");
            bool unsupportedNote = false;
            if (body.ValueKind == JsonValueKind.Object)
            {
                JsonElement bodyContent = Property(body, "content");
                string? content = bodyContent.ValueKind == JsonValueKind.String ? bodyContent.GetString() : null;
                if (!string.IsNullOrWhiteSpace(content))
                {
                    if (content.Contains('\0'))
                    {
                        throw new InvalidDataException("A task note contains an invalid character.");
                    }
                    unsupportedNote = ReadString(body, "contentType") != "text";
                    if (!unsupportedNote)
                    {
                        note = content;
                    }
                }
            }

            if (unsupportedNote || ReadArray(source, "categories").Any())
            {
                batch.UnsupportedTasks++;
            }

            JsonElement due = Property(source, "dueDateTime");
            (DateTime? startsAt, string? startTimeZone) = ReadOptionalZonedDateTime(source, "startDateTime");
            (DateTime? reminderAt, string? reminderTimeZone) = ReadOptionalZonedDateTime(source, "reminderDateTime");
            bool isReminderOn = IsFlagSet(source, "isReminderOn");
            TaskItem task = new(RegisterId(identities, importId, "task", source))
            {
                TaskListId = listId,
                Title = ReadString(source, "title", 255),
                Note = note,
                Priority = priority,
                Position = position,
                DueDate = due.ValueKind == JsonValueKind.Object ? DateOnly.FromDateTime(ReadLocalDateTime(due)) : null,
                CompletedAt = status == "completed" ? ReadZonedDateTime(Property(source, "completedDateTime")).Time : null,
                Progress = progress,
                StartsAt = startsAt,
                StartTimeZone = startTimeZone,
                ReminderAt = reminderAt,
                ReminderTimeZone = reminderTimeZone,
                ReminderEnabled = isReminderOn || reminderAt.HasValue ? isReminderOn : null,
                Recurrence = ReadRecurrence(source),
            };
            batch.CreationTimes.Add(task.Id, ReadTimestamp(source, "createdDateTime"));
            return task;
        }

        private static JsonElement? ReadRecurrence(JsonElement source)
        {
            JsonElement recurrence = Property(source, "recurrence");
            if (recurrence.ValueKind is JsonValueKind.Undefined or JsonValueKind.Null)
            {
                return null;
            }
            JsonElement pattern = Property(recurrence, "pattern");
            JsonElement range = Property(recurrence, "range");
            string rangeType = ReadString(range, "type");
            if (ReadString(pattern, "type") is not ("daily" or "weekly" or "absoluteMonthly" or "relativeMonthly"
                    or "absoluteYearly" or "relativeYearly")
                || ReadInt(pattern, "interval") < 1
                || rangeType is not ("noEnd" or "endDate" or "numbered")
                || !IsCalendarDate(ReadString(range, "startDate"))
                || (rangeType == "endDate" && !IsCalendarDate(ReadString(range, "endDate")))
                || (rangeType == "numbered" && ReadInt(range, "numberOfOccurrences") < 1))
            {
                throw new InvalidDataException("A task contains an invalid recurrence rule.");
            }
            foreach (JsonElement day in ReadArray(pattern, "daysOfWeek"))
            {
                if (day.ValueKind != JsonValueKind.String || day.GetString() is not ("sunday" or "monday" or "tuesday"
                    or "wednesday" or "thursday" or "friday" or "saturday"))
                {
                    throw new InvalidDataException("A task contains an invalid recurrence weekday.");
                }
            }
            return recurrence.Clone();
        }

        private static bool IsCalendarDate(string value) =>
            DateOnly.TryParseExact(value, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out _);

        private static void ReadLinks(JsonElement source, Guid taskId, HashSet<Guid> identities, TaskImportBatch batch)
        {
            foreach (JsonElement link in ReadArray(source, "linkedResources"))
            {
                batch.Links.Add(new TaskLink(RegisterId(identities, taskId, "link", link))
                {
                    TaskItemId = taskId,
                    Url = ReadString(link, "webUrl", 8192),
                    DisplayName = ReadOptionalString(link, "displayName", 255),
                    ApplicationName = ReadOptionalString(link, "applicationName", 255),
                    ExternalId = ReadOptionalString(link, "externalId", 512),
                });
            }
        }

        private static void ReadSteps(JsonElement source, Guid taskId, HashSet<Guid> identities, TaskImportBatch batch)
        {
            int position = 0;
            foreach (JsonElement item in ReadArray(source, "checklistItems"))
            {
                TaskStep step = new(RegisterId(identities, taskId, "step", item))
                {
                    TaskItemId = taskId,
                    Title = ReadString(item, "displayName", 255),
                    Position = position++,
                    CompletedAt = IsFlagSet(item, "isChecked") ? ReadTimestamp(item, "checkedDateTime") : null,
                };
                batch.CreationTimes.Add(step.Id, ReadTimestamp(item, "createdDateTime"));
                batch.Steps.Add(step);
            }
        }

        private static async Task<TaskAttachment> ReadAttachmentAsync(JsonElement file, Guid taskId,
            HashSet<Guid> identities, Dictionary<string, ZipArchiveEntry> entries, HashSet<string> filePaths,
            CancellationToken ct)
        {
            JsonElement exportedFile = Property(file, "exportedFile");
            string path = ReadString(exportedFile, "path", 1024);
            if (!path.StartsWith("attachments/", StringComparison.Ordinal) || !filePaths.Add(path)
                || !entries.TryGetValue(path, out ZipArchiveEntry? entry) || entry.Name.Length == 0
                || entry.Length != ReadInt(exportedFile, "bytes"))
            {
                throw new InvalidDataException("An attachment does not match the archive.");
            }

            byte[] content = await ReadEntryAsync(entry, ct);
            string hash = Convert.ToHexString(SHA256.HashData(content));
            if (!hash.Equals(ReadString(exportedFile, "sha256", 64), StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidDataException("An attachment checksum does not match.");
            }

            return new TaskAttachment(RegisterId(identities, taskId, "attachment", file))
            {
                TaskItemId = taskId,
                FileName = ReadString(file, "name", 255),
                ContentType = ReadString(file, "contentType", 255),
                Content = content,
            };
        }

        private static async Task<byte[]> ReadEntryAsync(ZipArchiveEntry entry, CancellationToken ct)
        {
            await using Stream data = await entry.OpenAsync(ct);
            byte[] content = new byte[entry.Length];
            await data.ReadExactlyAsync(content, ct);
            if (await data.ReadAsync(new byte[1], ct) != 0)
            {
                throw new InvalidDataException("An archive entry has an unexpected length.");
            }
            return content;
        }

        private static Guid RegisterId(HashSet<Guid> identities, Guid scope, string type, JsonElement row)
        {
            Guid id = CreateId(scope.ToString("N"), type, ReadString(row, "id", 512));
            if (!identities.Add(id))
            {
                throw new InvalidDataException("The backup contains duplicate source identities.");
            }
            return id;
        }

        private static Guid CreateId(params string[] parts)
        {
            byte[] hash = SHA256.HashData(JsonSerializer.SerializeToUtf8Bytes(parts));
            hash[6] = (byte)((hash[6] & 0x0F) | 0x80);
            hash[8] = (byte)((hash[8] & 0x3F) | 0x80);
            return new Guid(hash.AsSpan(0, 16), bigEndian: true);
        }

        private static (DateTime? Time, string? Zone) ReadOptionalZonedDateTime(JsonElement source, string name)
        {
            JsonElement value = Property(source, name);
            if (value.ValueKind is JsonValueKind.Undefined or JsonValueKind.Null)
            {
                return (null, null);
            }
            (DateTime time, string zone) = ReadZonedDateTime(value);
            return (time, zone);
        }

        private static (DateTime Time, string Zone) ReadZonedDateTime(JsonElement value)
        {
            DateTime local = ReadLocalDateTime(value);
            string zoneId = ReadString(value, "timeZone");
            if (!TimeZoneInfo.TryFindSystemTimeZoneById(zoneId, out TimeZoneInfo? zone)
                || zone.IsInvalidTime(local))
            {
                throw new InvalidDataException("A task contains an invalid time zone.");
            }
            return (TimeZoneInfo.ConvertTimeToUtc(local, zone), zoneId);
        }

        private static DateTime ReadLocalDateTime(JsonElement value)
        {
            if (!DateTime.TryParseExact(ReadString(value, "dateTime"), "yyyy-MM-dd'T'HH:mm:ss.FFFFFFF",
                CultureInfo.InvariantCulture, DateTimeStyles.None, out DateTime dateTime))
            {
                throw new InvalidDataException("A task contains an invalid date.");
            }
            return dateTime;
        }

        private static DateTime ReadTimestamp(JsonElement value, string name)
        {
            JsonElement property = Property(value, name);
            if (property.ValueKind != JsonValueKind.String || !property.TryGetDateTimeOffset(out DateTimeOffset dateTime))
            {
                throw new InvalidDataException("The backup contains an invalid timestamp.");
            }
            return dateTime.UtcDateTime;
        }

        private static bool IsFlagSet(JsonElement value, string name) => Property(value, name).ValueKind == JsonValueKind.True;

        private static JsonElement Property(JsonElement value, string name) =>
            value.ValueKind == JsonValueKind.Object && value.TryGetProperty(name, out JsonElement property) ? property : default;

        private static IEnumerable<JsonElement> ReadArray(JsonElement value, string name, bool required = false)
        {
            JsonElement property = Property(value, name);
            return property.ValueKind switch
            {
                JsonValueKind.Array => property.EnumerateArray(),
                JsonValueKind.Undefined or JsonValueKind.Null when !required => [],
                _ => throw new InvalidDataException("The backup contains an invalid collection."),
            };
        }

        private static int ReadInt(JsonElement value, string name)
        {
            JsonElement property = Property(value, name);
            return property.ValueKind == JsonValueKind.Number && property.TryGetInt32(out int result)
                ? result : throw new InvalidDataException("The backup contains an invalid number.");
        }

        private static string ReadString(JsonElement value, string name, int maxLength = 255)
        {
            JsonElement property = Property(value, name);
            string? text = property.ValueKind == JsonValueKind.String ? property.GetString() : null;
            return !string.IsNullOrWhiteSpace(text) && text.Length <= maxLength && !text.Contains('\0')
                ? text : throw new InvalidDataException("The backup contains an invalid text field.");
        }

        private static string? ReadOptionalString(JsonElement value, string name, int maxLength)
        {
            JsonElement property = Property(value, name);
            if (property.ValueKind is JsonValueKind.Null or JsonValueKind.Undefined)
            {
                return null;
            }
            string? text = property.ValueKind == JsonValueKind.String ? property.GetString() : null;
            return text is not null && text.Length <= maxLength && !text.Contains('\0')
                ? text : throw new InvalidDataException("The backup contains an invalid text field.");
        }
    }
}
