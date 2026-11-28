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

export type TaskRequest = {
  requestToken: string;
  connectionId: string | null;
};

export const taskListsKey = ["task-lists"];
export const taskItemsKey = ["task-items"];

function mutationHeaders(request: TaskRequest, json = false) {
  return {
    "X-CSRF-Token": request.requestToken,
    ...(request.connectionId && {
      "X-Tusklet-Connection-Id": request.connectionId,
    }),
    ...(json && { "Content-Type": "application/json" }),
  };
}

export async function readTaskLists(signal: AbortSignal): Promise<TaskList[]> {
  const response = await fetch("/api/tasks/lists", { signal });
  if (!response.ok) {
    throw new Error(String(response.status));
  }
  return response.json();
}

export async function readTaskItems(
  signal: AbortSignal,
  listId?: string,
): Promise<TaskItem[]> {
  const path = listId
    ? `/api/tasks?${new URLSearchParams({ listId })}`
    : "/api/tasks";
  const response = await fetch(path, { signal });
  if (!response.ok) {
    throw new Error(String(response.status));
  }
  return response.json();
}

export async function createTask(
  input: CreateTaskInput,
  request: TaskRequest,
): Promise<{ listId: string }> {
  const response = await fetch("/api/tasks", {
    method: "POST",
    headers: mutationHeaders(request, true),
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
  request: TaskRequest,
): Promise<void> {
  const response = await fetch(`/api/tasks/${id}/completion`, {
    method: "PUT",
    headers: mutationHeaders(request, true),
    body: JSON.stringify({ isCompleted }),
  });
  if (!response.ok) {
    throw new Error(String(response.status));
  }
}

export async function updateTask(
  id: string,
  input: UpdateTaskInput,
  request: TaskRequest,
): Promise<void> {
  const response = await fetch(`/api/tasks/${id}`, {
    method: "PATCH",
    headers: mutationHeaders(request, true),
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(String(response.status));
  }
}

export async function deleteTask(
  id: string,
  request: TaskRequest,
): Promise<void> {
  const response = await fetch(`/api/tasks/${id}`, {
    method: "DELETE",
    headers: mutationHeaders(request),
  });
  if (!response.ok) {
    throw new Error(String(response.status));
  }
}

export async function importTasks(
  file: File,
  request: TaskRequest,
  preview: boolean,
): Promise<TaskImportReport> {
  const body = new FormData();
  body.set("file", file);
  const response = await fetch(`/api/tasks/import?preview=${preview}`, {
    method: "POST",
    headers: mutationHeaders(request),
    body,
  });
  if (!response.ok) {
    throw new Error(String(response.status));
  }
  return response.json();
}
