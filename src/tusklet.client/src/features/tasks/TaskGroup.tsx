import { List, Paper, Stack, Typography } from "@mui/material";
import { memo, useId, useMemo } from "react";
import { useTranslation } from "react-i18next";
import TaskListRow from "./TaskListRow";
import { getLocalToday } from "./taskDueDate";
import type { TaskRow } from "./taskView";

export default memo(function TaskGroup({
  groupId,
  title,
  hideHeading,
  tasks,
  showListName,
  changing,
  selectedTaskId,
  onTaskSelect,
  onCompletionChange,
}: {
  groupId: string;
  title?: string;
  hideHeading: boolean;
  tasks: TaskRow[];
  showListName: boolean;
  changing: boolean;
  selectedTaskId: string | null;
  onTaskSelect: (id: string) => void;
  onCompletionChange: (id: string, isCompleted: boolean) => void;
}) {
  const titleId = useId();
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage;
  const date = useMemo(
    () =>
      new Intl.DateTimeFormat(language, {
        dateStyle: "medium",
        timeZone: "UTC",
      }),
    [language],
  );
  const today = getLocalToday();

  return (
    <Stack spacing={1.25} useFlexGap>
      {title && (
        <Typography
          component="h2"
          variant="subtitle1"
          align="center"
          id={titleId}
          data-task-group={groupId}
          sx={
            hideHeading
              ? {
                  position: "absolute",
                  width: "1px",
                  height: "1px",
                  clipPath: "inset(50%)",
                  overflow: "hidden",
                }
              : undefined
          }
        >
          {title}
        </Typography>
      )}
      <Paper variant="outlined">
        <List
          disablePadding
          aria-labelledby={title ? titleId : undefined}
          aria-label={title ? undefined : t("tasks.title")}
        >
          {tasks.map((task, index) => (
            <TaskListRow
              key={task.id}
              task={task}
              divider={index < tasks.length - 1}
              selected={selectedTaskId === task.id}
              changing={changing}
              showListName={showListName}
              titleId={titleId}
              date={date}
              today={today}
              t={t}
              onTaskSelect={onTaskSelect}
              onCompletionChange={onCompletionChange}
            />
          ))}
        </List>
      </Paper>
    </Stack>
  );
});
