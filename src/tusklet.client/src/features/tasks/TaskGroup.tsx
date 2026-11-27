import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined";
import RadioButtonUnchecked from "@mui/icons-material/RadioButtonUnchecked";
import StarBorderRounded from "@mui/icons-material/StarBorderRounded";
import {
  Checkbox,
  Chip,
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import TaskDetailsDialog from "./TaskDetailsDialog";
import type { TaskItem } from "./tasksApi";

export default function TaskGroup({
  title,
  tasks,
  changing,
  onCompletionChange,
}: {
  title: string;
  tasks: TaskItem[];
  changing: boolean;
  onCompletionChange: (id: string, isCompleted: boolean) => void;
}) {
  const titleId = useId();
  const [details, setDetails] = useState<TaskItem | null>(null);
  const { t, i18n } = useTranslation();
  const date = new Intl.DateTimeFormat(i18n.resolvedLanguage, {
    dateStyle: "medium",
    timeZone: "UTC",
  });

  return (
    <Stack spacing={1.25}>
      <Typography component="h2" variant="subtitle1" id={titleId}>
        {title}
      </Typography>
      <Paper variant="outlined">
        <List disablePadding aria-labelledby={titleId}>
          {tasks.map((task, index) => (
            <ListItem
              key={task.id}
              divider={index < tasks.length - 1}
              sx={{ minHeight: 64, gap: 1, px: { xs: 1.5, sm: 2.5 } }}
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
              <ListItemText
                primary={
                  task.progress ||
                  task.startsAt ||
                  task.reminderEnabled !== null ||
                  task.recurrence ||
                  task.links.length > 0 ? (
                    <Link
                      component="button"
                      type="button"
                      color="inherit"
                      underline="always"
                      onClick={() => setDetails(task)}
                      sx={{ textAlign: "start", overflowWrap: "anywhere" }}
                    >
                      {task.title}
                    </Link>
                  ) : (
                    task.title
                  )
                }
                secondary={task.note}
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
                direction={{ xs: "column", sm: "row" }}
                sx={{ alignItems: "flex-end", gap: 0.75, flexShrink: 0 }}
              >
                {task.dueDate && (
                  <Typography
                    component="time"
                    dateTime={task.dueDate}
                    variant="body2"
                    color="text.secondary"
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
            </ListItem>
          ))}
        </List>
      </Paper>
      {details && (
        <TaskDetailsDialog task={details} onClose={() => setDetails(null)} />
      )}
    </Stack>
  );
}
