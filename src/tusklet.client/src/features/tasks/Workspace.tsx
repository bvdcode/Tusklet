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
import DeleteTaskDialog from "./DeleteTaskDialog";
import ScrollToTopButton from "./ScrollToTopButton";
import TaskDetailsPanel from "./TaskDetailsPanel";
import TaskGroupNavigation from "./TaskGroupNavigation";
import TaskHeaderCenter from "./TaskHeaderCenter";
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
import {
  taskListColumn,
  taskListSurface,
  taskWorkspaceHeading,
  taskWorkspaceLayout,
} from "./taskWorkspaceStyles";
import useTaskCompletion from "./useTaskCompletion";
import useTaskDeletion from "./useTaskDeletion";
import useTaskDetailRoute from "./useTaskDetailRoute";
import useTaskWorkspaceRows from "./useTaskWorkspaceRows";
import useTaskWorkspaceShortcuts from "./useTaskWorkspaceShortcuts";

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
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [scroller, setScroller] = useState<HTMLDivElement | null>(null);
  const listRef = useRef<VirtuosoHandle>(null);
  const [creating, setCreating] = useState(false);
  const { taskId, getSelectedTaskId, closeDetails, toggleDetails } =
    useTaskDetailRoute();
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
    searchOpen ? search : "",
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
  const deletion = useTaskDeletion(ownerId, requestToken, closeDetails);
  const canCreate = lists.isSuccess && !create.isPending;

  function changeSearch(value: string) {
    scroller?.scrollTo({ top: 0, behavior: "instant" });
    setSearch(value);
  }

  function closeSearch() {
    scroller?.scrollTo({ top: 0, behavior: "instant" });
    setSearchOpen(false);
    searchButtonRef.current?.focus();
  }

  function openSearch() {
    if (searchOpen) {
      searchInputRef.current?.focus();
      return;
    }
    changeSearch("");
    setSearchOpen(true);
  }

  function openCreateTask() {
    create.reset();
    setCreating(true);
  }

  useTaskWorkspaceShortcuts({
    entries,
    rows,
    getSelectedTaskId,
    scroller,
    listRef,
    dialogOpen: creating || deletion.task !== null,
    onOpenSearch: openSearch,
    onCreate: canCreate ? openCreateTask : undefined,
    onSelect: toggleDetails,
    onDelete: deletion.open,
  });

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
      center={
        <TaskHeaderCenter
          searching={searchOpen}
          group={
            headings.length > 0 && (
              <TaskGroupNavigation
                key={`${grouping}:${selectedId}`}
                groups={headings}
                scroller={scroller}
                listRef={listRef}
              />
            )
          }
          search={
            <TaskSearchField
              id={searchId}
              active={searchOpen}
              inputRef={searchInputRef}
              value={search}
              onChange={changeSearch}
              onClose={closeSearch}
            />
          }
        />
      }
      actions={
        <WorkspaceControls
          lists={taskLists}
          activeId={active?.id ?? ""}
          grouping={grouping}
          sorting={sorting}
          canCreate={canCreate}
          searchOpen={searchOpen}
          searchId={searchId}
          searchButtonRef={searchButtonRef}
          onSearchToggle={searchOpen ? closeSearch : openSearch}
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
          onCreate={openCreateTask}
        />
      }
    >
      {loading && <PageProgress />}
      <Typography
        component="h1"
        id={titleId}
        ref={titleRef}
        tabIndex={-1}
        sx={taskWorkspaceHeading}
      >
        {t("tasks.title")}
      </Typography>
      <Box sx={taskWorkspaceLayout(detailsOpen)}>
        <Stack spacing={2} sx={taskListColumn}>
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
              {t(
                searchOpen && search.trim()
                  ? "tasks.noSearchResults"
                  : "tasks.empty",
              )}
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
            aria-keyshortcuts="ArrowUp ArrowDown Delete"
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
      {deletion.task && (
        <DeleteTaskDialog
          title={deletion.task.title}
          saving={deletion.saving}
          failed={deletion.failed}
          onCancel={deletion.close}
          onConfirm={deletion.confirm}
        />
      )}
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
