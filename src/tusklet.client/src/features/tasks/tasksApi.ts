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
  restoredTasks: number;
  links: number;
};

export type TaskList = { id: string; name: string; isInbox: boolean };

export type TaskProgress =
  "NotStarted" | "InProgress" | "WaitingOnOthers" | "Deferred";

export type TaskRecurrence = {
  pattern: {
    type:
      | "daily"
      | "weekly"
      | "absoluteMonthly"
      | "relativeMonthly"
      | "absoluteYearly"
      | "relativeYearly";
    interval: number;
    daysOfWeek?: (
      | "sunday"
      | "monday"
      | "tuesday"
      | "wednesday"
      | "thursday"
      | "friday"
      | "saturday"
    )[];
    dayOfMonth?: number;
    month?: number;
    index?: "first" | "second" | "third" | "fourth" | "last";
  };
  range: {
    type: "noEnd" | "endDate" | "numbered";
    startDate: string;
    endDate?: string;
    numberOfOccurrences?: number;
  };
};

export type TaskLink = {
  id: string;
  url: string;
  displayName: string | null;
  applicationName: string | null;
};

export type TaskItem = {
  id: string;
  listId: string;
  title: string;
  note: string | null;
  dueDate: string | null;
  isImportant: boolean;
  isCompleted: boolean;
  progress: TaskProgress | null;
  startsAt: string | null;
  reminderAt: string | null;
  reminderEnabled: boolean | null;
  recurrence: TaskRecurrence | null;
  links: TaskLink[];
};

export type CreateTaskInput = {
  listId: string | null;
  title: string;
  note: string | null;
  dueDate: string | null;
  isImportant: boolean;
};

export type UpdateTaskInput = Partial<Omit<CreateTaskInput, "listId">> & {
  listId?: string;
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

export async function readTaskItems(signal: AbortSignal): Promise<TaskItem[]> {
  const response = await fetch("/api/tasks", { signal });
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

export async function updateTask(
  id: string,
  input: UpdateTaskInput,
  requestToken: string,
): Promise<void> {
  const response = await fetch(`/api/tasks/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": requestToken,
    },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(String(response.status));
  }
}

export async function deleteTask(
  id: string,
  requestToken: string,
): Promise<void> {
  const response = await fetch(`/api/tasks/${id}`, {
    method: "DELETE",
    headers: { "X-CSRF-Token": requestToken },
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
