import type { TaskItem } from "./tasksApi";

export const groupingOptions = ["none", "list", "status"] as const;
export const sortingOptions = [
  "listOrder",
  "title",
  "dueDate",
  "importance",
] as const;

export type TaskGrouping = (typeof groupingOptions)[number];
export type TaskSorting = (typeof sortingOptions)[number];

export type TaskRow = TaskItem & { listId: string; listName: string };

export type TaskListEntry =
  | { kind: "heading"; groupId: string; title: string }
  | {
      kind: "task";
      groupId: string;
      task: TaskRow;
      last: boolean;
    };

export type TaskGroupHeading = { id: string; title: string; index: number };

export function searchTasks(
  rows: TaskRow[],
  query: string,
  language: string | undefined,
) {
  const term = query.trim().toLocaleLowerCase(language);
  if (!term) {
    return rows;
  }
  return rows.filter((task) =>
    [
      task.title,
      task.note,
      ...task.links.flatMap(({ url, displayName }) => [url, displayName]),
    ].some((text) => text?.toLocaleLowerCase(language).includes(term)),
  );
}

export function flattenTaskGroups(
  groups: { id: string; title?: string; tasks: TaskRow[] }[],
) {
  const entries: TaskListEntry[] = [];
  const headings: TaskGroupHeading[] = [];
  groups.forEach(({ id, title, tasks }, groupIndex) => {
    if (title) {
      if (groupIndex > 0) {
        entries.push({ kind: "heading", groupId: id, title });
      }
      headings.push({ id, title, index: entries.length });
    }
    tasks.forEach((task, index) => {
      entries.push({
        kind: "task",
        groupId: id,
        task,
        last: index === tasks.length - 1,
      });
    });
  });
  return { entries, headings };
}

export function arrangeTasks(
  rows: TaskRow[],
  grouping: TaskGrouping,
  sorting: TaskSorting,
  language: string | undefined,
  statusLabels: { open: string; completed: string },
) {
  const tasks = sortTasks(rows, sorting, language);
  switch (grouping) {
    case "none":
      return [{ id: "all", title: undefined, tasks }];
    case "status":
      return [
        {
          id: "open",
          title: statusLabels.open,
          tasks: tasks.filter((task) => !task.isCompleted),
        },
        {
          id: "completed",
          title: statusLabels.completed,
          tasks: tasks.filter((task) => task.isCompleted),
        },
      ];
    case "list": {
      const lists = new Map<
        string,
        { id: string; title: string; tasks: TaskRow[] }
      >();
      for (const task of rows) {
        if (!lists.has(task.listId)) {
          lists.set(task.listId, {
            id: task.listId,
            title: task.listName,
            tasks: [],
          });
        }
      }
      for (const task of tasks) {
        lists.get(task.listId)?.tasks.push(task);
      }
      return [...lists.values()];
    }
  }
}

function sortTasks(
  tasks: TaskRow[],
  sorting: TaskSorting,
  language: string | undefined,
) {
  switch (sorting) {
    case "listOrder":
      return tasks;
    case "title":
      return [...tasks].sort((first, second) =>
        first.title.localeCompare(second.title, language),
      );
    case "dueDate":
      return [...tasks].sort((first, second) => {
        if (first.dueDate === second.dueDate) {
          return 0;
        }
        if (first.dueDate === null) {
          return 1;
        }
        if (second.dueDate === null) {
          return -1;
        }
        return first.dueDate.localeCompare(second.dueDate);
      });
    case "importance":
      return [...tasks].sort(
        (first, second) =>
          Number(second.isImportant) - Number(first.isImportant),
      );
  }
}
