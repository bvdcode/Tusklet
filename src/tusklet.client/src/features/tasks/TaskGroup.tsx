import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined";
import RadioButtonUnchecked from "@mui/icons-material/RadioButtonUnchecked";
import StarRounded from "@mui/icons-material/StarRounded";
import {
  Checkbox,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useId } from "react";
import { useTranslation } from "react-i18next";
import { dueDateColor, getLocalToday } from "./taskDueDate";
import type { TaskRow } from "./taskView";

export default function TaskGroup({
  title,
  tasks,
  showListName,
  changing,
  selectedTaskId,
  onTaskSelect,
  onCompletionChange,
}: {
  title?: string;
  tasks: TaskRow[];
  showListName: boolean;
  changing: boolean;
  selectedTaskId: string | null;
  onTaskSelect: (task: TaskRow) => void;
  onCompletionChange: (id: string, isCompleted: boolean) => void;
}) {
  const titleId = useId();
  const { t, i18n } = useTranslation();
  const date = new Intl.DateTimeFormat(i18n.resolvedLanguage, {
    dateStyle: "medium",
    timeZone: "UTC",
  });
  const today = getLocalToday();

  return (
    <Stack spacing={1.25}>
      {title && (
        <Typography component="h2" variant="subtitle1" id={titleId}>
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
            <ListItem
              key={task.id}
              divider={index < tasks.length - 1}
              disablePadding
              sx={{
                pl: { xs: 1.5, sm: 2.5 },
                bgcolor:
                  selectedTaskId === task.id ? "action.selected" : undefined,
                "@container (max-width: 280px)": {
                  alignItems: "flex-start",
                  pl: 0.5,
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 0 }}>
                <Checkbox
                  color="success"
                  checked={task.isCompleted}
                  disabled={changing}
                  icon={<RadioButtonUnchecked fontSize="small" />}
                  checkedIcon={<CheckCircleOutlined fontSize="small" />}
                  sx={{ "@container (max-width: 280px)": { p: 0.75 } }}
                  onChange={(_, checked) =>
                    onCompletionChange(task.id, checked)
                  }
                  slotProps={{
                    input: {
                      "aria-label": t(
                        task.isCompleted ? "tasks.reopen" : "tasks.complete",
                        { title: task.title },
                      ),
                    },
                  }}
                />
              </ListItemIcon>
              <ListItemButton
                aria-label={task.title}
                aria-describedby={
                  task.isImportant
                    ? `${titleId}-important-${task.id}`
                    : undefined
                }
                aria-expanded={selectedTaskId === task.id}
                onClick={() => onTaskSelect(task)}
                sx={{
                  minWidth: 0,
                  minHeight: 64,
                  gap: 1,
                  pl: 1,
                  pr: { xs: 1.5, sm: 2.5 },
                  "@container (max-width: 280px)": {
                    flexDirection: "column",
                    alignItems: "stretch",
                    gap: 0,
                    pl: 0.5,
                    pr: 1,
                  },
                }}
              >
                <ListItemText
                  primary={
                    <>
                      {task.title}
                      {task.isImportant && (
                        <StarRounded
                          id={`${titleId}-important-${task.id}`}
                          titleAccess={t("tasks.important")}
                          color="action"
                          fontSize="inherit"
                          sx={{ ml: 0.5, verticalAlign: "text-bottom" }}
                        />
                      )}
                    </>
                  }
                  secondary={
                    showListName
                      ? [task.listName, task.note].filter(Boolean).join(" · ")
                      : task.note
                  }
                  sx={{ minWidth: 0, overflowWrap: "anywhere" }}
                  slotProps={{
                    primary: {
                      sx: {
                        textDecoration: task.isCompleted
                          ? "line-through"
                          : undefined,
                      },
                    },
                    secondary: {
                      sx: {
                        display: "-webkit-box",
                        WebkitBoxOrient: "vertical",
                        WebkitLineClamp: 2,
                        overflow: "hidden",
                      },
                    },
                  }}
                />
                {task.dueDate && (
                  <Typography
                    component="time"
                    dateTime={task.dueDate}
                    variant="body2"
                    color={dueDateColor(task.dueDate, today, task.isCompleted)}
                    sx={{
                      flexShrink: 0,
                      textAlign: "end",
                      "@container (max-width: 280px)": {
                        textAlign: "start",
                        overflowWrap: "anywhere",
                      },
                    }}
                  >
                    {date.format(new Date(task.dueDate))}
                  </Typography>
                )}
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Paper>
    </Stack>
  );
}
