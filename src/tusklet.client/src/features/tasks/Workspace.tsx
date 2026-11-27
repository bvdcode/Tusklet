import {
  Alert,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import AccountPageLayout, {
  type AccountPage,
} from "../accounts/AccountPageLayout";
import { useUserPreferences } from "../accounts/userPreferences";
import CreateTaskDialog from "./CreateTaskDialog";
import TaskDetailsPanel from "./TaskDetailsPanel";
import TaskGroup from "./TaskGroup";
import WorkspaceControls from "./WorkspaceControls";
import {
  createTask,
  readTaskItems,
  readTaskLists,
  setTaskCompletion,
  taskItemsKey,
  taskListsKey,
  type CreateTaskInput,
} from "./tasksApi";
import { arrangeTasks } from "./taskView";

export default function Workspace(account: AccountPage) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState("");
  const { preferences, changePreference } = useUserPreferences();
  const { taskGrouping: grouping, taskSorting: sorting } = preferences;
  const [creating, setCreating] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const ownerId = account.user.id;
  const requestToken = account.session.requestToken;
  const listsKey = [...taskListsKey, ownerId];
  const itemsKey = [...taskItemsKey, ownerId];
  const lists = useQuery({
    queryKey: listsKey,
    queryFn: ({ signal }) => readTaskLists(signal),
    retry: false,
  });
  const taskLists = lists.data ?? [];
  const active = taskLists.find((list) => list.id === selectedId);
  const visibleLists = active ? [active] : taskLists;
  const items = useQueries({
    queries: visibleLists.map((list) => ({
      queryKey: [...itemsKey, list.id],
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        readTaskItems(list.id, signal),
      retry: false,
    })),
  });
  const rows = visibleLists.flatMap((list, index) =>
    (items[index]?.data ?? []).map((task) => ({
      ...task,
      listId: list.id,
      listName: list.isInbox ? t("tasks.inbox") : list.name,
    })),
  );
  const groups = arrangeTasks(rows, grouping, sorting, i18n.resolvedLanguage, {
    open: t("tasks.open"),
    completed: t("tasks.completed"),
  });
  const selectedTask = rows.find((task) => task.id === selectedTaskId);
  const loading = lists.isPending || items.some((query) => query.isPending);
  const loadFailed = lists.isError || items.some((query) => query.isError);

  const create = useMutation({
    mutationFn: (input: CreateTaskInput) => createTask(input, requestToken),
    onSuccess: async ({ listId }) => {
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

  function retry() {
    if (lists.isError) {
      void lists.refetch();
    }
    for (const query of items) {
      if (query.isError) {
        void query.refetch();
      }
    }
  }

  return (
    <AccountPageLayout
      {...account}
      expanded={selectedTask !== undefined}
      actions={
        <WorkspaceControls
          lists={taskLists}
          activeId={active?.id ?? ""}
          grouping={grouping}
          sorting={sorting}
          canCreate={lists.isSuccess && !create.isPending}
          onListChange={(id) => {
            setSelectedId(id);
            setSelectedTaskId(null);
          }}
          onGroupingChange={(value) =>
            changePreference({ key: "taskGrouping", value })
          }
          onSortingChange={(value) =>
            changePreference({ key: "taskSorting", value })
          }
          onCreate={() => {
            create.reset();
            setCreating(true);
          }}
        />
      }
    >
      <Typography
        component="h1"
        sx={{
          position: "absolute",
          width: "1px",
          height: "1px",
          clipPath: "inset(50%)",
          overflow: "hidden",
        }}
      >
        {t("tasks.title")}
      </Typography>
      <Stack direction="row" sx={{ gap: 2 }}>
        <Stack spacing={2} sx={{ flex: 1, minWidth: 0 }}>
          {loading && (
            <CircularProgress size={24} aria-label={t("common.loading")} />
          )}
          {loadFailed && (
            <Alert
              severity="error"
              action={
                <Button color="inherit" onClick={retry}>
                  {t("common.retry")}
                </Button>
              }
            >
              {t("tasks.loadError")}
            </Alert>
          )}
          {!loading && !loadFailed && rows.length === 0 && (
            <Typography color="text.secondary">{t("tasks.empty")}</Typography>
          )}
          {completion.isError && (
            <Alert severity="error">{t("tasks.completionError")}</Alert>
          )}
          {groups
            .filter((group) => group.tasks.length > 0)
            .map((group) => (
              <TaskGroup
                key={group.id}
                title={group.title}
                tasks={group.tasks}
                showListName={!active && grouping !== "list"}
                changing={completion.isPending}
                selectedTaskId={selectedTaskId}
                onTaskSelect={setSelectedTaskId}
                onCompletionChange={(id, isCompleted) =>
                  completion.mutate({ id, isCompleted })
                }
              />
            ))}
        </Stack>
        {selectedTask && (
          <TaskDetailsPanel
            task={selectedTask}
            onClose={() => setSelectedTaskId(null)}
          />
        )}
      </Stack>
      {creating && (
        <CreateTaskDialog
          listId={
            active?.id ??
            taskLists.find((list) => list.isInbox)?.id ??
            taskLists[0]?.id ??
            null
          }
          lists={active ? [] : taskLists}
          saving={create.isPending}
          failed={create.isError}
          onSave={create.mutate}
          onClose={() => setCreating(false)}
        />
      )}
    </AccountPageLayout>
  );
}
