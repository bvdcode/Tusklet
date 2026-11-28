import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { readTaskItems, taskItemsKey, type TaskList } from "./tasksApi";
import {
  arrangeTasks,
  flattenTaskGroups,
  searchTasks,
  type TaskGrouping,
  type TaskRow,
  type TaskSorting,
} from "./taskView";

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
  const listId = active?.id;
  const items = useQuery({
    queryKey: [...taskItemsKey, ownerId, listId ?? null],
    queryFn: ({ signal }) => readTaskItems(signal, listId),
    retry: false,
  });
  const loading = listsPending || items.isPending;
  const rows = useMemo(() => {
    if (loading || !items.data) {
      return [];
    }
    const names = new Map(
      lists.map((list) => [
        list.id,
        list.isInbox ? t("tasks.inbox") : list.name,
      ]),
    );
    const visibleRows: TaskRow[] = [];
    for (const item of items.data) {
      const listName = names.get(item.listId);
      if (listName !== undefined) {
        visibleRows.push({ ...item, listName });
      }
    }
    return visibleRows;
  }, [items.data, lists, loading, t]);
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

  return {
    rows,
    entries,
    headings,
    loading,
    retryItems: items.isError ? items.refetch : undefined,
  };
}
