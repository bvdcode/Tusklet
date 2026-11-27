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
    <Stack spacing={1.25} useFlexGap>
      {title && (
        <Typography
          component="h2"
          variant="subtitle1"
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
                }}
              >
                <ListItemText
                  primary={
                    <Stack
                      component="span"
                      direction="row"
                      sx={{ alignItems: "center" }}
                    >
                      <Typography component="span" variant="inherit" noWrap>
                        {task.title}
                      </Typography>
                      {task.isImportant && (
                        <StarRounded
                          id={`${titleId}-important-${task.id}`}
                          titleAccess={t("tasks.important")}
                          color="action"
                          fontSize="inherit"
                          sx={{ ml: 0.5, flexShrink: 0 }}
                        />
                      )}
                    </Stack>
                  }
                  secondary={
                    showListName
                      ? [task.listName, task.note].filter(Boolean).join(" · ")
                      : task.note
                  }
                  sx={{ minWidth: 0, my: 0 }}
                  slotProps={{
                    primary: {
                      sx: {
                        textDecoration: task.isCompleted
                          ? "line-through"
                          : undefined,
                      },
                    },
                    secondary: { noWrap: true },
                  }}
                />
                {task.dueDate && (
                  <Typography
                    component="time"
                    dateTime={task.dueDate}
                    variant="body2"
                    color={dueDateColor(task.dueDate, today, task.isCompleted)}
                    noWrap
                    sx={{
                      maxWidth: "60%",
                      flexShrink: 0,
                      textAlign: "end",
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
