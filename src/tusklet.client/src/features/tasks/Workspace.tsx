import { Alert, Button, Stack, Typography } from "@mui/material";
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import PageProgress from "../../shared/PageProgress";
import AccountPageLayout, {
  type AccountPage,
} from "../accounts/AccountPageLayout";
import { useUserPreferences } from "../accounts/userPreferences";
import CreateTaskDialog from "./CreateTaskDialog";
import ScrollToTopButton from "./ScrollToTopButton";
import TaskDetailsPanel from "./TaskDetailsPanel";
import TaskGroup from "./TaskGroup";
import TaskGroupNavigation from "./TaskGroupNavigation";
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
import { arrangeTasks, type TaskRow } from "./taskView";

export default function Workspace(account: AccountPage) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState("");
  const { preferences, changePreference } = useUserPreferences();
  const { taskGrouping: grouping, taskSorting: sorting } = preferences;
  const headerRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const groupsRef = useRef<HTMLDivElement>(null);
  const [creating, setCreating] = useState(false);
  const [details, setDetails] = useState<{ task: TaskRow; open: boolean }>();
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
  const loading = lists.isPending || items.some((query) => query.isPending);
  const loadFailed = lists.isError || items.some((query) => query.isError);
  const rows = loading
    ? []
    : visibleLists.flatMap((list, index) =>
        (items[index]?.data ?? []).map((task) => ({
          ...task,
          listId: list.id,
          listName: list.isInbox ? t("tasks.inbox") : list.name,
        })),
      );
  const groups = arrangeTasks(rows, grouping, sorting, i18n.resolvedLanguage, {
    open: t("tasks.open"),
    completed: t("tasks.completed"),
  })
    .filter((group) => group.tasks.length > 0)
    .map((group) => ({
      ...group,
      title:
        grouping === "status"
          ? t("tasks.statusGroupTitle", {
              status: group.title,
              taskCount: group.tasks.length,
            })
          : group.title,
    }));
  const groupHeadings = groups.flatMap(({ id, title }) =>
    title ? [{ id, title }] : [],
  );
  const currentTask = rows.find((task) => task.id === details?.task.id);
  const detailsOpen = details?.open === true && currentTask !== undefined;

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

  function closeDetails() {
    setDetails((current) => current && { ...current, open: false });
  }

  function toggleDetails(task: TaskRow) {
    setDetails((current) => ({
      task,
      open: !(current?.open && current.task.id === task.id),
    }));
  }

  return (
    <AccountPageLayout
      {...account}
      expanded
      headerRef={headerRef}
      center={
        groupHeadings.length > 0 ? (
          <TaskGroupNavigation
            key={`${grouping}:${selectedId}`}
            groups={groupHeadings}
            headerRef={headerRef}
            groupsRef={groupsRef}
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
            <Alert severity="error">{t("tasks.completionError")}</Alert>
          )}
          {groups.map((group, index) => (
            <TaskGroup
              key={group.id}
              groupId={group.id}
              title={group.title}
              hideHeading={index === 0}
              tasks={group.tasks}
              showListName={!active && grouping !== "list"}
              changing={completion.isPending}
              selectedTaskId={detailsOpen ? currentTask.id : null}
              onTaskSelect={toggleDetails}
              onCompletionChange={(id, isCompleted) =>
                completion.mutate({ id, isCompleted })
              }
            />
          ))}
          <ScrollToTopButton focusTarget={titleRef} />
        </Stack>
        <TaskDetailsPanel
          task={currentTask ?? details?.task}
          open={detailsOpen}
          onClose={closeDetails}
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
