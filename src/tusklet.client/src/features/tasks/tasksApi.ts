export type TaskImportReport = {
  lists: number;
  tasks: number;
  completed: number;
  steps: number;
  attachments: number;
  newLists: number;
  newTasks: number;
  unsupportedTasks: number;
  sharedLists: number;
};

export type TaskList = { id: string; name: string };

export type TaskItem = {
  id: string;
  title: string;
  note: string | null;
  dueDate: string | null;
  isImportant: boolean;
  isCompleted: boolean;
};

export type CreateTaskInput = {
  listId: string | null;
  title: string;
  note: string | null;
  dueDate: string | null;
  isImportant: boolean;
};

export const taskListsKey = ["task-lists"];
export const taskItemsKey = ["task-items"];

export async function readTaskLists(signal: AbortSignal): Promise<TaskList[]> {
  const response = await fetch("/api/tasks/lists", { signal });
  if (!response.ok) {
    throw new Error(String(response.status));
  }
  return response.json();
}

export async function readTaskItems(
  listId: string,
  signal: AbortSignal,
): Promise<TaskItem[]> {
  const response = await fetch(`/api/tasks/lists/${listId}`, { signal });
  if (!response.ok) {
    throw new Error(String(response.status));
  }
  return response.json();
}

export async function createTask(
  input: CreateTaskInput,
  requestToken: string,
): Promise<{ listId: string }> {
  const response = await fetch("/api/tasks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": requestToken,
    },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(String(response.status));
  }
  return response.json();
}

export async function setTaskCompletion(
  id: string,
  isCompleted: boolean,
  requestToken: string,
): Promise<void> {
  const response = await fetch(`/api/tasks/${id}/completion`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": requestToken,
    },
    body: JSON.stringify({ isCompleted }),
  });
  if (!response.ok) {
    throw new Error(String(response.status));
  }
}

export async function importTasks(
  file: File,
  requestToken: string,
  preview: boolean,
): Promise<TaskImportReport> {
  const body = new FormData();
  body.set("file", file);
  const response = await fetch(`/api/tasks/import?preview=${preview}`, {
    method: "POST",
    headers: { "X-CSRF-Token": requestToken },
    body,
  });
  if (!response.ok) {
    throw new Error(String(response.status));
  }
  return response.json();
}
