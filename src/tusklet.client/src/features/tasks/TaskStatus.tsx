import DoneRounded from "@mui/icons-material/DoneRounded";
import UndoRounded from "@mui/icons-material/UndoRounded";
import { IconButton, ListItem, ListItemText, Stack } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { TaskRow } from "./taskView";
import type { ChangeTaskCompletion } from "./useTaskCompletion";

export default function TaskStatus({
  task,
  pending,
  onChange,
}: {
  task: TaskRow;
  pending: boolean;
  onChange: ChangeTaskCompletion;
}) {
  const { t } = useTranslation();
  const status = task.isCompleted
    ? "Completed"
    : (task.progress ?? "NotStarted");
  const action = t(task.isCompleted ? "tasks.reopen" : "tasks.complete", {
    title: task.title,
  });
  const Icon = task.isCompleted ? UndoRounded : DoneRounded;

  return (
    <ListItem>
      <ListItemText
        primary={t("tasks.status")}
        secondary={
          <Stack
            component="span"
            direction="row"
            sx={{ alignItems: "center", gap: 0.5 }}
          >
            <span>{t(`tasks.progress.${status}`)}</span>
            <IconButton
              size="small"
              aria-label={action}
              title={action}
              disabled={pending}
              onClick={() => onChange(task, !task.isCompleted)}
            >
              <Icon fontSize="small" />
            </IconButton>
          </Stack>
        }
      />
    </ListItem>
  );
}
