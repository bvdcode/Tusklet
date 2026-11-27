import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import {
  Box,
  IconButton,
  Link,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { dueDateColor, getLocalToday } from "./taskDueDate";
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

export default function TaskDetailsContent({
  task,
  titleId,
  onClose,
  compact,
}: {
  task: TaskRow;
  titleId: string;
  onClose: () => void;
  compact: boolean;
}) {
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
  const status = task.isCompleted
    ? "Completed"
    : (task.progress ?? "NotStarted");
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
      <Stack
        direction="row"
        sx={{
          justifyContent: "space-between",
          alignItems: "flex-start",
          p: 2,
          gap: 1,
          flexShrink: 0,
        }}
      >
        {compact && (
          <IconButton
            onClick={onClose}
            aria-label={t("common.back")}
            sx={{ flexShrink: 0 }}
          >
            <ArrowBackRounded
              sx={{
                transform: (theme) =>
                  theme.direction === "rtl" ? "scaleX(-1)" : undefined,
              }}
            />
          </IconButton>
        )}
        <Typography
          id={titleId}
          component="h2"
          variant="h6"
          sx={{
            overflowWrap: "anywhere",
            minWidth: 0,
            flex: 1,
            alignSelf: "center",
          }}
        >
          {task.title}
        </Typography>
        {!compact && (
          <IconButton
            onClick={onClose}
            aria-label={t("common.close")}
            size="small"
            sx={{ flexShrink: 0 }}
          >
            <CloseRounded />
          </IconButton>
        )}
      </Stack>
      <Box sx={{ px: 2, pb: 2, flex: 1, minHeight: 0, overflowY: "auto" }}>
        <List
          disablePadding
          dense
          sx={{
            "& .MuiListItemText-root": {
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "space-between",
              alignItems: { sm: "baseline" },
              gap: { sm: 2 },
              overflowWrap: "anywhere",
            },
            "& .MuiListItemText-primary": {
              flexShrink: 0,
              maxWidth: { sm: "45%" },
            },
            "& .MuiListItemText-secondary": {
              minWidth: 0,
              textAlign: { sm: "right" },
            },
          }}
        >
          <ListItem disableGutters>
            <ListItemText
              primary={t("tasks.status")}
              secondary={t(`tasks.progress.${status}`)}
            />
          </ListItem>
          <ListItem disableGutters>
            <ListItemText primary={t("tasks.list")} secondary={task.listName} />
          </ListItem>
          {task.dueDate && (
            <ListItem disableGutters>
              <ListItemText
                primary={t("tasks.dueDate")}
                secondary={
                  <Typography
                    component="time"
                    dateTime={task.dueDate}
                    variant="body2"
                    color={dueDateColor(
                      task.dueDate,
                      getLocalToday(),
                      task.isCompleted,
                    )}
                  >
                    {date.format(new Date(task.dueDate))}
                  </Typography>
                }
              />
            </ListItem>
          )}
          {task.isImportant && (
            <ListItem disableGutters>
              <ListItemText primary={t("tasks.important")} />
            </ListItem>
          )}
          {task.startsAt && (
            <ListItem disableGutters>
              <ListItemText
                primary={t("tasks.startDate")}
                secondary={dateTime.format(new Date(task.startsAt))}
              />
            </ListItem>
          )}
          {(task.reminderEnabled !== null || reminderTime) && (
            <ListItem disableGutters>
              <ListItemText
                primary={t("tasks.reminder")}
                secondary={[
                  t(
                    task.reminderEnabled
                      ? "tasks.reminderOn"
                      : "tasks.reminderOff",
                  ),
                  reminderTime,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              />
            </ListItem>
          )}
          {recurrence && (
            <ListItem disableGutters>
              <ListItemText
                primary={t("tasks.repeat")}
                secondary={[repeat, dates, rangeEnd]
                  .filter(Boolean)
                  .join(" · ")}
              />
            </ListItem>
          )}
          {task.links.map((link) => (
            <ListItem key={link.id} disableGutters>
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
        </List>
        {task.note && (
          <Stack spacing={0.5} sx={{ mt: 2 }}>
            <Typography variant="subtitle2">{t("tasks.note")}</Typography>
            <Typography
              variant="body2"
              sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
            >
              {task.note}
            </Typography>
          </Stack>
        )}
      </Box>
    </>
  );
}
