import { useQueries, type UseQueryResult } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  readTaskItems,
  taskItemsKey,
  type TaskItem,
  type TaskList,
} from "./tasksApi";
import {
  arrangeTasks,
  flattenTaskGroups,
  searchTasks,
  type TaskGrouping,
  type TaskSorting,
} from "./taskView";

function combineItems(results: UseQueryResult<TaskItem[]>[]) {
  return {
    data: results.map((result) => result.data),
    pending: results.some((result) => result.isPending),
    failed: results
      .filter((result) => result.isError)
      .map((result) => result.refetch),
  };
}

export default function useTaskWorkspaceRows(
  ownerId: string,
  lists: TaskList[],
  active: TaskList | undefined,
  grouping: TaskGrouping,
  sorting: TaskSorting,
  search: string,
  listsPending: boolean,
) {
  const { t, i18n } = useTranslation();
  const visibleLists = useMemo(
    () => (active ? [active] : lists),
    [active, lists],
  );
  const { data, pending, failed } = useQueries({
    queries: visibleLists.map((list) => ({
      queryKey: [...taskItemsKey, ownerId, list.id],
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        readTaskItems(list.id, signal),
      retry: false,
    })),
    combine: combineItems,
  });
  const loading = listsPending || pending;
  const rows = useMemo(
    () =>
      loading
        ? []
        : visibleLists.flatMap((list, index) =>
            (data[index] ?? []).map((task) => ({
              ...task,
              listId: list.id,
              listName: list.isInbox ? t("tasks.inbox") : list.name,
            })),
          ),
    [data, loading, t, visibleLists],
  );
  const language = i18n.resolvedLanguage;
  const groups = useMemo(
    () =>
      arrangeTasks(
        searchTasks(rows, search, language),
        grouping,
        sorting,
        language,
        {
          open: t("tasks.open"),
          completed: t("tasks.completed"),
        },
      )
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
        })),
    [grouping, language, rows, search, sorting, t],
  );
  const { entries, headings } = useMemo(
    () => flattenTaskGroups(groups),
    [groups],
  );

  return { rows, entries, headings, loading, failed };
}
