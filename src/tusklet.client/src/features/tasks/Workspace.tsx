import { Alert, Box, Button, Paper, Stack, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useId, useRef, useState } from "react";
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
import TaskSearchField from "./TaskSearchField";
import TaskVirtualList from "./TaskVirtualList";
import WorkspaceControls from "./WorkspaceControls";
import {
  createTask,
  readTaskLists,
  taskItemsKey,
  taskListsKey,
  updateTask,
  type CreateTaskInput,
  type UpdateTaskInput,
} from "./tasksApi";
import { taskListSurface, taskWorkspaceLayout } from "./taskWorkspaceStyles";
import useTaskCompletion from "./useTaskCompletion";
import useTaskDetailRoute from "./useTaskDetailRoute";
import useTaskWorkspaceRows from "./useTaskWorkspaceRows";

export default function Workspace(account: AccountPage) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState("");
  const { preferences, changePreference } = useUserPreferences();
  const { taskGrouping: grouping, taskSorting: sorting } = preferences;
  const titleId = useId();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const searchId = useId();
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const [search, setSearch] = useState<string | null>(null);
  const [scroller, setScroller] = useState<HTMLDivElement | null>(null);
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
    search ?? "",
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
  const completion = useTaskCompletion(ownerId, requestToken);

  function changeSearch(value: string | null) {
    scroller?.scrollTo({ top: 0, behavior: "instant" });
    setSearch(value);
    if (value === null) {
      searchButtonRef.current?.focus();
    }
  }

  function retry() {
    if (lists.isError) {
      void lists.refetch();
    }
    for (const refetch of failed) {
      void refetch();
    }
  }

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
      centerExpanded={search !== null}
      center={
        search !== null ? (
          <TaskSearchField
            id={searchId}
            value={search}
            onChange={changeSearch}
            onClose={() => changeSearch(null)}
          />
        ) : headings.length > 0 ? (
          <TaskGroupNavigation
            key={`${grouping}:${selectedId}`}
            groups={headings}
            scroller={scroller}
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
          searchOpen={search !== null}
          searchId={searchId}
          searchButtonRef={searchButtonRef}
          onSearchToggle={() => changeSearch(search === null ? "" : null)}
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
        id={titleId}
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
      <Box sx={taskWorkspaceLayout(detailsOpen)}>
        <Stack
          spacing={2}
          sx={{
            flex: 1,
            gridColumn: 2,
            gridRow: 1,
            minWidth: 0,
            minHeight: 0,
            position: "relative",
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
          {!loading && !loadFailed && entries.length === 0 && (
            <Typography color="text.secondary">
              {t(search?.trim() ? "tasks.noSearchResults" : "tasks.empty")}
            </Typography>
          )}
          {completion.isError && (
            <Alert severity="error">{t("tasks.updateError")}</Alert>
          )}
          <Paper
            ref={setScroller}
            variant="outlined"
            hidden={entries.length === 0}
            role="region"
            aria-labelledby={titleId}
            tabIndex={0}
            sx={taskListSurface}
          >
            {scroller && entries.length > 0 && (
              <TaskVirtualList
                entries={entries}
                listRef={listRef}
                scroller={scroller}
                showListName={!active && grouping !== "list"}
                changing={completion.isPending}
                selectedTaskId={taskId}
                onTaskSelect={toggleDetails}
                onCompletionChange={completion.changeCompletion}
              />
            )}
          </Paper>
          <ScrollToTopButton scroller={scroller} focusTarget={titleRef} />
        </Stack>
        <TaskDetailsPanel
          task={currentTask}
          lists={taskLists}
          open={detailsOpen}
          onClose={() => closeDetails()}
          onUpdate={saveTask}
          completionPending={completion.isPending}
          onCompletionChange={completion.changeCompletion}
        />
      </Box>
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
