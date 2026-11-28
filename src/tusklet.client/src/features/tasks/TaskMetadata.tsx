import { Link, ListItem, ListItemText } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { TaskRow } from "./taskView";

const units = {
  daily: "day",
  weekly: "week",
  absoluteMonthly: "month",
  relativeMonthly: "month",
  absoluteYearly: "year",
  relativeYearly: "year",
} as const;

const weekdays = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
} as const;

export default function TaskMetadata({ task }: { task: TaskRow }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage;
  const date = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeZone: "UTC",
  });
  const dateTime = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const weekday = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    timeZone: "UTC",
  });
  const month = new Intl.DateTimeFormat(locale, {
    month: "long",
    timeZone: "UTC",
  });
  const reminderTime = task.reminderAt
    ? dateTime.format(new Date(task.reminderAt))
    : null;
  const { recurrence } = task;

  const dates =
    recurrence && recurrence.range.startDate
      ? t("tasks.recurrenceStarts", {
          date: date.format(new Date(recurrence.range.startDate)),
        })
      : null;
  const pattern = recurrence?.pattern;
  const relative =
    pattern?.type === "relativeMonthly" || pattern?.type === "relativeYearly";
  const absolute =
    pattern?.type === "absoluteMonthly" || pattern?.type === "absoluteYearly";
  const yearly =
    pattern?.type === "absoluteYearly" || pattern?.type === "relativeYearly";
  const days =
    relative || pattern?.type === "weekly"
      ? (pattern.daysOfWeek?.map((day) =>
          weekday.format(new Date(Date.UTC(2024, 0, 7 + weekdays[day]))),
        ) ?? [])
      : [];
  const ordinal =
    relative && pattern.index
      ? t(`tasks.recurrenceIndex.${pattern.index}`)
      : null;
  const onDays = days.length ? new Intl.ListFormat(locale).format(days) : null;
  const inMonth =
    yearly && pattern.month && pattern.month >= 1 && pattern.month <= 12
      ? month.format(new Date(Date.UTC(2024, pattern.month - 1, 1)))
      : null;
  const repeat = pattern
    ? [
        t(`tasks.repeat_${units[pattern.type]}`, { count: pattern.interval }),
        onDays ? [ordinal, onDays].filter(Boolean).join(" ") : null,
        absolute && pattern.dayOfMonth
          ? t("tasks.recurrenceDay", { day: pattern.dayOfMonth })
          : null,
        inMonth,
      ]
        .filter(Boolean)
        .join(" · ")
    : null;

  let rangeEnd: string | null = null;
  if (recurrence?.range.type === "endDate" && recurrence.range.endDate) {
    rangeEnd = t("tasks.recurrenceEnds", {
      date: date.format(new Date(recurrence.range.endDate)),
    });
  }
  if (
    recurrence?.range.type === "numbered" &&
    recurrence.range.numberOfOccurrences !== undefined
  ) {
    rangeEnd = t("tasks.recurrenceOccurrences", {
      count: recurrence.range.numberOfOccurrences,
    });
  }

  return (
    <>
      {task.startsAt && (
        <ListItem>
          <ListItemText
            primary={t("tasks.startDate")}
            secondary={dateTime.format(new Date(task.startsAt))}
          />
        </ListItem>
      )}
      {(task.reminderEnabled !== null || reminderTime) && (
        <ListItem>
          <ListItemText
            primary={t("tasks.reminder")}
            secondary={[
              t(
                task.reminderEnabled ? "tasks.reminderOn" : "tasks.reminderOff",
              ),
              reminderTime,
            ]
              .filter(Boolean)
              .join(" · ")}
          />
        </ListItem>
      )}
      {recurrence && (
        <ListItem>
          <ListItemText
            primary={t("tasks.repeat")}
            secondary={[repeat, dates, rangeEnd].filter(Boolean).join(" · ")}
          />
        </ListItem>
      )}
      {task.links.map((link) => (
        <ListItem key={link.id}>
          <ListItemText
            sx={{ overflowWrap: "anywhere" }}
            primary={
              /^https?:\/\//i.test(link.url) ? (
                <Link href={link.url} target="_blank" rel="noreferrer">
                  {link.displayName || link.url}
                </Link>
              ) : (
                link.url
              )
            }
            secondary={link.applicationName}
          />
        </ListItem>
      ))}
    </>
  );
}
