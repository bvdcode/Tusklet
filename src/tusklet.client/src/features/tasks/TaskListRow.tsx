import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined";
import RadioButtonUnchecked from "@mui/icons-material/RadioButtonUnchecked";
import StarRounded from "@mui/icons-material/StarRounded";
import {
  Checkbox,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import type { TFunction } from "i18next";
import { memo } from "react";
import { dueDateColor } from "./taskDueDate";
import type { TaskRow } from "./taskView";
import type { ChangeTaskCompletion } from "./useTaskCompletion";

export default memo(function TaskListRow({
  task,
  divider,
  selected,
  changing,
  showListName,
  titleId,
  date,
  today,
  t,
  onTaskSelect,
  onCompletionChange,
}: {
  task: TaskRow;
  divider: boolean;
  selected: boolean;
  changing: boolean;
  showListName: boolean;
  titleId: string;
  date: Intl.DateTimeFormat;
  today: number;
  t: TFunction;
  onTaskSelect: (id: string) => void;
  onCompletionChange: ChangeTaskCompletion;
}) {
  return (
    <ListItem
      component="div"
      disablePadding
      divider={divider}
      sx={{
        bgcolor: selected ? "action.selected" : undefined,
        overflow: "hidden",
      }}
    >
      <ListItemIcon
        sx={(theme) => ({
          minWidth: { xs: theme.spacing(7), sm: theme.spacing(8) },
          flexShrink: 0,
          justifyContent: "center",
        })}
      >
        <Checkbox
          color="success"
          sx={{ p: 1.5 }}
          checked={task.isCompleted}
          disabled={changing}
          icon={<RadioButtonUnchecked fontSize="small" />}
          checkedIcon={<CheckCircleOutlined fontSize="small" />}
          onChange={(_, checked) => onCompletionChange(task, checked)}
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
          task.isImportant ? `${titleId}-important-${task.id}` : undefined
        }
        aria-expanded={selected}
        onClick={() => onTaskSelect(task.id)}
        sx={{
          minWidth: 0,
          minHeight: 64,
          gap: 1,
          pl: 0,
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
                textDecoration: task.isCompleted ? "line-through" : undefined,
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
  );
});
