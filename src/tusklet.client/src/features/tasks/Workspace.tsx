import { Alert, Button, Stack, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { VirtuosoHandle } from "react-virtuoso";
import PageProgress from "../../shared/PageProgress";
import AccountPageLayout, {
  type AccountPage,
} from "../accounts/AccountPageLayout";
import { useUserPreferences } from "../accounts/userPreferences";
import CreateTaskDialog from "./CreateTaskDialog";
import ScrollToTopButton from "./ScrollToTopButton";
import TaskDetailsPanel from "./TaskDetailsPanel";
import TaskGroupNavigation from "./TaskGroupNavigation";
import TaskVirtualList from "./TaskVirtualList";
import WorkspaceControls from "./WorkspaceControls";
import {
  createTask,
  readTaskLists,
  setTaskCompletion,
  taskItemsKey,
  taskListsKey,
  updateTask,
  type CreateTaskInput,
  type UpdateTaskInput,
} from "./tasksApi";
import useTaskDetailRoute from "./useTaskDetailRoute";
import useTaskWorkspaceRows from "./useTaskWorkspaceRows";

export default function Workspace(account: AccountPage) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState("");
  const { preferences, changePreference } = useUserPreferences();
  const { taskGrouping: grouping, taskSorting: sorting } = preferences;
  const headerRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const groupsRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<VirtuosoHandle>(null);
  const [creating, setCreating] = useState(false);
  const { taskId, closeDetails, toggleDetails } = useTaskDetailRoute();
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
  const { rows, entries, headings, loading, failed } = useTaskWorkspaceRows(
    ownerId,
    taskLists,
    active,
    grouping,
    sorting,
    lists.isPending,
  );
  const loadFailed = lists.isError || failed.length > 0;
  const currentTask = rows.find((task) => task.id === taskId);
  const detailsOpen = currentTask !== undefined;

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
    for (const refetch of failed) {
      void refetch();
    }
  }

  const { mutate: setCompletion } = completion;
  const changeCompletion = useCallback(
    (id: string, isCompleted: boolean) => {
      setCompletion({ id, isCompleted });
    },
    [setCompletion],
  );

  async function saveTask(id: string, input: UpdateTaskInput) {
    await updateTask(id, input, requestToken);
    if (active && input.listId && input.listId !== active.id) {
      closeDetails(id);
    }
    await queryClient.invalidateQueries({ queryKey: itemsKey });
  }

  return (
    <AccountPageLayout
      {...account}
      expanded
      headerRef={headerRef}
      center={
        headings.length > 0 ? (
          <TaskGroupNavigation
            key={`${grouping}:${selectedId}`}
            groups={headings}
            headerRef={headerRef}
            groupsRef={groupsRef}
            listRef={listRef}
          />
        ) : (
          loading && grouping !== "none" && <span aria-hidden="true" />
        )
      }
      actions={
        <WorkspaceControls
          lists={taskLists}
          activeId={active?.id ?? ""}
          grouping={grouping}
          sorting={sorting}
          canCreate={lists.isSuccess && !create.isPending}
          onListChange={(id) => {
            setSelectedId(id);
            closeDetails();
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
      {loading && <PageProgress />}
      <Typography
        component="h1"
        ref={titleRef}
        tabIndex={-1}
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
      <Stack direction="row" sx={{ mx: { md: -3 } }}>
        <Stack
          ref={groupsRef}
          spacing={2}
          sx={{
            flex: 1,
            minWidth: 0,
            mx: "auto",
            maxWidth: (theme) => ({
              xs: `calc(${theme.breakpoints.values.md}px - ${theme.spacing(6)})`,
              md: detailsOpen
                ? "100%"
                : `calc(${theme.breakpoints.values.md}px - ${theme.spacing(6)})`,
            }),
            transition: (theme) =>
              theme.transitions.create("max-width", {
                duration: detailsOpen
                  ? theme.transitions.duration.enteringScreen
                  : theme.transitions.duration.leavingScreen,
                easing: detailsOpen
                  ? theme.transitions.easing.easeOut
                  : theme.transitions.easing.sharp,
              }),
            "@media (prefers-reduced-motion: reduce)": { transition: "none" },
          }}
        >
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
            <Alert severity="error">{t("tasks.updateError")}</Alert>
          )}
          {entries.length > 0 && (
            <TaskVirtualList
              entries={entries}
              listRef={listRef}
              showListName={!active && grouping !== "list"}
              changing={completion.isPending}
              selectedTaskId={taskId}
              onTaskSelect={toggleDetails}
              onCompletionChange={changeCompletion}
            />
          )}
          <ScrollToTopButton focusTarget={titleRef} />
        </Stack>
        <TaskDetailsPanel
          task={currentTask}
          lists={taskLists}
          open={detailsOpen}
          onClose={() => closeDetails()}
          onUpdate={saveTask}
        />
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
