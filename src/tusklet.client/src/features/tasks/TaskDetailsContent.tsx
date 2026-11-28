import CalendarTodayOutlined from "@mui/icons-material/CalendarTodayOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import KeyboardArrowDownRounded from "@mui/icons-material/KeyboardArrowDownRounded";
import StarBorderRounded from "@mui/icons-material/StarBorderRounded";
import StarRounded from "@mui/icons-material/StarRounded";
import {
  Alert,
  Box,
  ButtonBase,
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
import { lazy, Suspense, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import PageProgress from "../../shared/PageProgress";
import TaskDetailsHeader from "./TaskDetailsHeader";
import TaskMetadata from "./TaskMetadata";
import TaskTextEditDialog from "./TaskTextEditDialog";
import { dueDateColor, getLocalToday } from "./taskDueDate";
import type { TaskList, UpdateTaskInput } from "./tasksApi";
import type { TaskRow } from "./taskView";

type EditField = "title" | "note" | "dueDate";
const TaskDueDateDialog = lazy(() => import("./TaskDueDateDialog"));

export default function TaskDetailsContent({
  task,
  lists,
  titleId,
  onClose,
  onUpdate,
  compact,
}: {
  task: TaskRow;
  lists: TaskList[];
  titleId: string;
  onClose: () => void;
  onUpdate: (id: string, input: UpdateTaskInput) => Promise<void>;
  compact: boolean;
}) {
  const { t, i18n } = useTranslation();
  const edge = useTheme().direction === "rtl" ? "left" : "right";
  const menuId = useId();
  const listButtonId = useId();
  const [field, setField] = useState<EditField | null>(null);
  const [listAnchor, setListAnchor] = useState<HTMLElement | null>(null);
  const edit = useMutation({
    mutationFn: (input: UpdateTaskInput) => onUpdate(task.id, input),
    onSuccess: () => setField(null),
  });
  const date = new Intl.DateTimeFormat(i18n.resolvedLanguage, {
    dateStyle: "medium",
    timeZone: "UTC",
  });
  const status = task.isCompleted
    ? "Completed"
    : (task.progress ?? "NotStarted");

  function editField(next: EditField | null) {
    edit.reset();
    setField(next);
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
        saving={edit.isPending}
        onClose={onClose}
        onEdit={() => editField("title")}
      />
      <Box
        sx={{
          px: 2,
          pb: 2,
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          scrollbarWidth: "thin",
        }}
      >
        {edit.isError && field === null && (
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
            "& .MuiListItemText-primary": { maxWidth: "45%" },
            "& .MuiListItemText-secondary": { minWidth: 0, textAlign: "end" },
          }}
        >
          <ListItem disableGutters>
            <ListItemText
              primary={t("tasks.status")}
              secondary={t(`tasks.progress.${status}`)}
            />
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton
              id={listButtonId}
              disableGutters
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
              disableGutters
              disabled={edit.isPending}
              onClick={() => editField("dueDate")}
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
              disableGutters
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
        <ButtonBase
          disabled={edit.isPending}
          onClick={() => editField("note")}
          title={t("tasks.editNote")}
          sx={{
            display: "block",
            width: "100%",
            mt: 2,
            borderRadius: 1,
            textAlign: "start",
          }}
        >
          <Stack
            component="span"
            direction="row"
            sx={{ justifyContent: "space-between", alignItems: "center" }}
          >
            <Typography component="span" variant="subtitle2">
              {t("tasks.note")}
            </Typography>
            <EditOutlined fontSize="small" color="action" />
          </Stack>
          {task.note && (
            <Typography
              component="span"
              variant="body2"
              sx={{
                display: "block",
                mt: 0.5,
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
              }}
            >
              {task.note}
            </Typography>
          )}
        </ButtonBase>
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
      {field === "dueDate" && (
        <Suspense fallback={<PageProgress />}>
          <TaskDueDateDialog
            value={task.dueDate}
            saving={edit.isPending}
            failed={edit.isError}
            onSave={(dueDate) => edit.mutate({ dueDate })}
            onClose={() => editField(null)}
          />
        </Suspense>
      )}
      {(field === "title" || field === "note") && (
        <TaskTextEditDialog
          field={field}
          value={field === "title" ? task.title : (task.note ?? "")}
          saving={edit.isPending}
          failed={edit.isError}
          onSave={(value) =>
            edit.mutate(
              field === "title" ? { title: value } : { note: value || null },
            )
          }
          onClose={() => editField(null)}
        />
      )}
    </>
  );
}
