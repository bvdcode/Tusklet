import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined";
import RadioButtonUnchecked from "@mui/icons-material/RadioButtonUnchecked";
import StarBorderRounded from "@mui/icons-material/StarBorderRounded";
import {
  Checkbox,
  Chip,
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
  onTaskSelect: (id: string) => void;
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
              }}
            >
              <ListItemIcon sx={{ minWidth: 0 }}>
                <Checkbox
                  color="success"
                  checked={task.isCompleted}
                  disabled={changing}
                  icon={<RadioButtonUnchecked fontSize="small" />}
                  checkedIcon={<CheckCircleOutlined fontSize="small" />}
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
                aria-expanded={selectedTaskId === task.id}
                onClick={() => onTaskSelect(task.id)}
                sx={{
                  minWidth: 0,
                  minHeight: 64,
                  gap: 1,
                  pl: 1,
                  pr: { xs: 1.5, sm: 2.5 },
                }}
              >
                <ListItemText
                  primary={task.title}
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
                <Stack
                  direction={{
                    xs: "column",
                    sm: "row",
                    md: selectedTaskId ? "column" : "row",
                  }}
                  sx={{ alignItems: "flex-end", gap: 0.75, flexShrink: 0 }}
                >
                  {task.dueDate && (
                    <Typography
                      component="time"
                      dateTime={task.dueDate}
                      variant="body2"
                      color={dueDateColor(
                        task.dueDate,
                        today,
                        task.isCompleted,
                      )}
                    >
                      {date.format(new Date(task.dueDate))}
                    </Typography>
                  )}
                  {task.isImportant && (
                    <Chip
                      icon={<StarBorderRounded />}
                      label={t("tasks.important")}
                      color="warning"
                      variant="outlined"
                      size="small"
                    />
                  )}
                </Stack>
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Paper>
    </Stack>
  );
}
