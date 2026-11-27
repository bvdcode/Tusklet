import AddRounded from "@mui/icons-material/AddRounded";
import {
  Alert,
  Button,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import {
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import CreateTaskDialog from "./CreateTaskDialog";
import TaskGroup from "./TaskGroup";
import {
  createTask,
  readTaskItems,
  readTaskLists,
  setTaskCompletion,
  taskItemsKey,
  taskListsKey,
  type CreateTaskInput,
} from "./tasksApi";

export default function Workspace({
  ownerId,
  requestToken,
}: {
  ownerId: string;
  requestToken: string;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState("");
  const [creating, setCreating] = useState(false);
  const listsKey = [...taskListsKey, ownerId];
  const itemsKey = [...taskItemsKey, ownerId];
  const lists = useQuery({
    queryKey: listsKey,
    queryFn: ({ signal }) => readTaskLists(signal),
    retry: false,
  });
  const active =
    lists.data?.find((list) => list.id === selectedId) ?? lists.data?.[0];
  const items = useQuery({
    queryKey: [...itemsKey, active?.id],
    queryFn: active
      ? ({ signal }) => readTaskItems(active.id, signal)
      : skipToken,
    retry: false,
  });
  const open = items.data?.filter((item) => !item.isCompleted) ?? [];
  const completed = items.data?.filter((item) => item.isCompleted) ?? [];
  const create = useMutation({
    mutationFn: (input: CreateTaskInput) => createTask(input, requestToken),
    onSuccess: async ({ listId }) => {
      setSelectedId(listId);
      setCreating(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: listsKey }),
        queryClient.invalidateQueries({ queryKey: [...itemsKey, listId] }),
      ]);
    },
  });
  const completion = useMutation({
    mutationFn: ({ id, isCompleted }: { id: string; isCompleted: boolean }) =>
      setTaskCompletion(id, isCompleted, requestToken),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: itemsKey }),
  });

  function changeCompletion(id: string, isCompleted: boolean) {
    completion.mutate({ id, isCompleted });
  }

  return (
    <Stack spacing={3}>
      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1.5,
        }}
      >
        <Typography component="h1" variant="h3" sx={{ flexGrow: 1 }}>
          {t("tasks.title")}
        </Typography>
        {lists.data && active && (
          <FormControl
            size="small"
            sx={{ width: { xs: "100%", sm: 240 }, order: { xs: 1, sm: 0 } }}
          >
            <InputLabel id="task-list-label">{t("tasks.list")}</InputLabel>
            <Select
              labelId="task-list-label"
              label={t("tasks.list")}
              value={active.id}
              onChange={(event) => setSelectedId(event.target.value)}
            >
              {lists.data.map((list) => (
                <MenuItem key={list.id} value={list.id}>
                  {list.isInbox ? t("tasks.inbox") : list.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        <IconButton
          aria-label={t("tasks.create")}
          title={t("tasks.create")}
          color="primary"
          disabled={!lists.isSuccess || create.isPending}
          onClick={() => {
            create.reset();
            setCreating(true);
          }}
        >
          <AddRounded />
        </IconButton>
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
      {(lists.data?.length === 0 || items.data?.length === 0) && (
        <Typography color="text.secondary">{t("tasks.empty")}</Typography>
      )}
      {completion.isError && (
        <Alert severity="error">{t("tasks.completionError")}</Alert>
      )}
      {open.length > 0 && (
        <TaskGroup
          title={t("tasks.open")}
          tasks={open}
          changing={completion.isPending}
          onCompletionChange={changeCompletion}
        />
      )}
      {completed.length > 0 && (
        <TaskGroup
          title={t("tasks.completed")}
          tasks={completed}
          changing={completion.isPending}
          onCompletionChange={changeCompletion}
        />
      )}
      {creating && (
        <CreateTaskDialog
          listId={active?.id ?? null}
          saving={create.isPending}
          failed={create.isError}
          onSave={create.mutate}
          onClose={() => setCreating(false)}
        />
      )}
    </Stack>
  );
}
