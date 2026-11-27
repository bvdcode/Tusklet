export const dueDateShortcuts = ["today", "tomorrow", "week", "month"] as const;
export const longDueDateShortcuts = ["twoMonths", "halfYear", "year"] as const;
export type TaskDueDateShortcut =
  | (typeof dueDateShortcuts)[number]
  | (typeof longDueDateShortcuts)[number]
  | "none";

export function getLocalToday() {
  const now = new Date();
  return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
}

export function getShortcutDate(shortcut: TaskDueDateShortcut) {
  const date = new Date(getLocalToday());
  switch (shortcut) {
    case "none":
      return "";
    case "today":
      break;
    case "tomorrow":
      date.setUTCDate(date.getUTCDate() + 1);
      break;
    case "week":
      date.setUTCDate(date.getUTCDate() + 7);
      break;
    case "month":
      addCalendarMonths(date, 1);
      break;
    case "twoMonths":
      addCalendarMonths(date, 2);
      break;
    case "halfYear":
      addCalendarMonths(date, 6);
      break;
    case "year":
      addCalendarMonths(date, 12);
      break;
  }
  return date.toISOString().slice(0, 10);
}

function addCalendarMonths(date: Date, months: number) {
  const day = date.getUTCDate();
  date.setUTCMonth(date.getUTCMonth() + months + 1, 0);
  date.setUTCDate(Math.min(day, date.getUTCDate()));
}

export function dueDateColor(
  dueDate: string,
  today: number,
  isCompleted: boolean,
) {
  if (isCompleted) {
    return "textSecondary";
  }
  const deadline = Date.parse(dueDate);
  if (deadline < today) {
    return "error";
  }
  if (deadline === today) {
    return "warning";
  }
  return "textSecondary";
}
