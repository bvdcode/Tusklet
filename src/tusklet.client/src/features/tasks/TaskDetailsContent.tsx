import CalendarTodayOutlined from "@mui/icons-material/CalendarTodayOutlined";
import KeyboardArrowDownRounded from "@mui/icons-material/KeyboardArrowDownRounded";
import StarBorderRounded from "@mui/icons-material/StarBorderRounded";
import StarRounded from "@mui/icons-material/StarRounded";
import {
  Alert,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import TaskDetailsHeader from "./TaskDetailsHeader";
import TaskDueDateDialog from "./TaskDueDateDialog";
import TaskMetadata from "./TaskMetadata";
import TaskStatus from "./TaskStatus";
import TaskTextEditor from "./TaskTextEditor";
import { dueDateColor, getLocalToday } from "./taskDueDate";
import type { TaskList, UpdateTaskInput } from "./tasksApi";
import type { TaskRow } from "./taskView";
import type { ChangeTaskCompletion } from "./useTaskCompletion";

export default function TaskDetailsContent({
  task,
  lists,
  titleId,
  onClose,
  onUpdate,
  completionPending,
  onCompletionChange,
  compact,
}: {
  task: TaskRow;
  lists: TaskList[];
  titleId: string;
  onClose: () => void;
  onUpdate: (id: string, input: UpdateTaskInput) => Promise<void>;
  completionPending: boolean;
  onCompletionChange: ChangeTaskCompletion;
  compact: boolean;
}) {
  const { t, i18n } = useTranslation();
  const edge = useTheme().direction === "rtl" ? "left" : "right";
  const menuId = useId();
  const listButtonId = useId();
  const [editingDueDate, setEditingDueDate] = useState(false);
  const [listAnchor, setListAnchor] = useState<HTMLElement | null>(null);
  const edit = useMutation({
    mutationFn: (input: UpdateTaskInput) => onUpdate(task.id, input),
    onSuccess: () => setEditingDueDate(false),
  });
  const date = new Intl.DateTimeFormat(i18n.resolvedLanguage, {
    dateStyle: "medium",
    timeZone: "UTC",
  });

  function editDueDate(open: boolean) {
    edit.reset();
    setEditingDueDate(open);
  }

  function toggleImportance() {
    edit.reset();
    edit.mutate({ isImportant: !task.isImportant });
  }

  return (
    <>
      <TaskDetailsHeader
        title={task.title}
        titleId={titleId}
        compact={compact}
        onClose={onClose}
        onSave={(title) => onUpdate(task.id, { title })}
      />
      <Box
        sx={{
          px: 1,
          pb: 2,
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          scrollbarWidth: "thin",
        }}
      >
        {edit.isError && !editingDueDate && (
          <Alert severity="error" onClose={() => edit.reset()} sx={{ mb: 1 }}>
            {t("tasks.updateError")}
          </Alert>
        )}
        <List
          disablePadding
          dense
          sx={{
            "& .MuiListItemText-root": {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 1,
              overflowWrap: "anywhere",
            },
            "& .MuiListItemText-primary": { maxWidth: "45%", flexShrink: 0 },
            "& .MuiListItemText-secondary": { minWidth: 0, textAlign: "end" },
          }}
        >
          <TaskStatus
            task={task}
            pending={completionPending}
            onChange={onCompletionChange}
          />
          <ListItem disablePadding>
            <ListItemButton
              id={listButtonId}
              disabled={edit.isPending}
              aria-haspopup="menu"
              aria-expanded={listAnchor !== null}
              aria-controls={listAnchor ? menuId : undefined}
              onClick={(event) => setListAnchor(event.currentTarget)}
            >
              <ListItemText
                primary={t("tasks.list")}
                secondary={
                  <Stack
                    component="span"
                    direction="row"
                    sx={{ alignItems: "center", gap: 0.5 }}
                  >
                    <span>{task.listName}</span>
                    <KeyboardArrowDownRounded
                      fontSize="small"
                      color="action"
                      sx={{ flexShrink: 0 }}
                    />
                  </Stack>
                }
              />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              disabled={edit.isPending}
              onClick={() => editDueDate(true)}
            >
              <ListItemText
                primary={t("tasks.dueDate")}
                secondary={
                  <Stack
                    component="span"
                    direction="row"
                    sx={{ alignItems: "center", gap: 0.75 }}
                  >
                    {task.dueDate && (
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
                    )}
                    <CalendarTodayOutlined
                      fontSize="small"
                      color="action"
                      sx={{ flexShrink: 0 }}
                    />
                  </Stack>
                }
              />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              disabled={edit.isPending}
              aria-pressed={task.isImportant}
              onClick={toggleImportance}
            >
              <ListItemText
                primary={t("tasks.important")}
                secondary={
                  task.isImportant ? (
                    <StarRounded color="primary" fontSize="small" />
                  ) : (
                    <StarBorderRounded color="action" fontSize="small" />
                  )
                }
              />
            </ListItemButton>
          </ListItem>
          <TaskMetadata task={task} />
        </List>
        <TaskTextEditor
          field="note"
          value={task.note ?? ""}
          onSave={(note) => onUpdate(task.id, { note: note || null })}
        />
      </Box>
      <Menu
        anchorEl={listAnchor}
        open={listAnchor !== null}
        onClose={() => setListAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: edge }}
        transformOrigin={{ vertical: "top", horizontal: edge }}
        slotProps={{ list: { id: menuId, "aria-labelledby": listButtonId } }}
      >
        {lists.map((list) => (
          <MenuItem
            key={list.id}
            selected={list.id === task.listId}
            onClick={() => {
              setListAnchor(null);
              if (list.id !== task.listId) {
                edit.reset();
                edit.mutate({ listId: list.id });
              }
            }}
          >
            {list.isInbox ? t("tasks.inbox") : list.name}
          </MenuItem>
        ))}
      </Menu>
      {editingDueDate && (
        <TaskDueDateDialog
          value={task.dueDate}
          saving={edit.isPending}
          failed={edit.isError}
          onSave={(dueDate) => edit.mutate({ dueDate })}
          onClose={() => editDueDate(false)}
        />
      )}
    </>
  );
}
