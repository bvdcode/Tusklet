import {
  Alert,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { skipToken, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import TaskGroup from "./TaskGroup";
import {
  readTaskItems,
  readTaskLists,
  taskItemsKey,
  taskListsKey,
} from "./tasksApi";

export default function Workspace({ ownerId }: { ownerId: string }) {
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = useState("");
  const lists = useQuery({
    queryKey: [...taskListsKey, ownerId],
    queryFn: ({ signal }) => readTaskLists(signal),
    retry: false,
  });
  const active =
    lists.data?.find((list) => list.id === selectedId) ?? lists.data?.[0];
  const items = useQuery({
    queryKey: [...taskItemsKey, ownerId, active?.id],
    queryFn: active
      ? ({ signal }) => readTaskItems(active.id, signal)
      : skipToken,
    retry: false,
  });
  const open = items.data?.filter((item) => !item.isCompleted) ?? [];
  const completed = items.data?.filter((item) => item.isCompleted) ?? [];

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        sx={{
          alignItems: { sm: "center" },
          justifyContent: "space-between",
          gap: 1.5,
        }}
      >
        <Typography component="h1" variant="h3">
          {t("tasks.title")}
        </Typography>
        {lists.data && active && (
          <FormControl size="small" sx={{ width: { xs: "100%", sm: 240 } }}>
            <InputLabel id="task-list-label">{t("tasks.list")}</InputLabel>
            <Select
              labelId="task-list-label"
              label={t("tasks.list")}
              value={active.id}
              onChange={(event) => setSelectedId(event.target.value)}
            >
              {lists.data.map((list) => (
                <MenuItem key={list.id} value={list.id}>
                  {list.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Stack>
      {(lists.isPending || (active && items.isPending)) && (
        <CircularProgress size={24} aria-label={t("common.loading")} />
      )}
      {(lists.isError || items.isError) && (
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              onClick={() =>
                void (lists.isError ? lists.refetch() : items.refetch())
              }
            >
              {t("common.retry")}
            </Button>
          }
        >
          {t("tasks.loadError")}
        </Alert>
      )}
      {lists.data?.length === 0 && (
        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            sx={{
              alignItems: { sm: "center" },
              justifyContent: "space-between",
              gap: 1.5,
            }}
          >
            <Typography color="text.secondary">{t("tasks.empty")}</Typography>
            <Button component={Link} to="/profile">
              {t("import.title")}
            </Button>
          </Stack>
        </Paper>
      )}
      {items.data?.length === 0 && (
        <Typography color="text.secondary">{t("tasks.emptyList")}</Typography>
      )}
      {open.length > 0 && <TaskGroup title={t("tasks.open")} tasks={open} />}
      {completed.length > 0 && (
        <TaskGroup title={t("tasks.completed")} tasks={completed} />
      )}
    </Stack>
  );
}
