import {
  cleanup,
  fireEvent,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { renderApp } from "../../test/renderApp";
import type { TaskItem } from "./tasksApi";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test("uses workspace shortcuts, skips group headings and requires confirmation for deletion", async () => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    },
  );
  const openTask: TaskItem = {
    id: "open-task",
    listId: "inbox",
    title: "Review schedule",
    note: null,
    dueDate: null,
    isImportant: false,
    isCompleted: false,
    progress: null,
    startsAt: null,
    reminderAt: null,
    reminderEnabled: null,
    recurrence: null,
    links: [],
  };
  let tasks = [
    openTask,
    { ...openTask, id: "closed-task", title: "Book room", isCompleted: true },
  ];
  const request = vi.fn((path: string, options?: RequestInit) => {
    if (path === "/api/tasks/closed-task" && options?.method === "DELETE") {
      tasks = tasks.filter(({ id }) => id !== "closed-task");
      return Promise.resolve(new Response(null, { status: 204 }));
    }
    const responses = new Map<string, object>([
      [
        "/api/auth/session",
        {
          setupRequired: false,
          openIdEnabled: false,
          user: {
            id: "owner",
            username: "alex",
            isAdmin: false,
            openIdLinked: false,
            pictureUrl: null,
            preferences: { taskGrouping: "status" },
          },
          requestToken: "test-csrf",
        },
      ],
      ["/api/tasks/lists", [{ id: "inbox", name: "Inbox", isInbox: true }]],
      ["/api/tasks", tasks],
    ]);
    return Promise.resolve(Response.json(responses.get(path)));
  });
  vi.stubGlobal("fetch", request);
  renderApp("/tasks");

  const scroller = await screen.findByRole(
    "region",
    { name: "Tasks" },
    { timeout: 3000 },
  );
  Object.defineProperty(scroller, "scrollTo", { value: vi.fn() });
  const start = await screen.findByRole("button", { name: "Search tasks" });
  const find = { ctrlKey: true, code: "KeyF", key: "а" };
  expect(fireEvent.keyDown(start, find)).toBe(false);
  const search = screen.getByRole("searchbox");
  expect(document.activeElement).toBe(search);
  start.focus();
  fireEvent.keyDown(start, find);
  expect(document.activeElement).toBe(search);

  const down = { code: "ArrowDown", key: "ArrowDown" };
  const up = { code: "ArrowUp", key: "ArrowUp" };
  const remove = { code: "Delete", key: "Delete" };
  expect(fireEvent.keyDown(search, down)).toBe(true);
  expect(fireEvent.keyDown(search, remove)).toBe(true);
  expect(screen.queryByRole("complementary")).toBeNull();
  expect(
    fireEvent.keyDown(search, { ctrlKey: true, code: "KeyN", key: "т" }),
  ).toBe(false);
  const create = await screen.findByRole("dialog", { name: "New task" });
  expect(document.activeElement).toBe(
    within(create).getByRole("textbox", { name: "Title" }),
  );
  fireEvent.click(within(create).getByRole("button", { name: "Cancel" }));
  await waitFor(() =>
    expect(screen.queryByRole("dialog", { name: "New task" })).toBeNull(),
  );
  fireEvent.keyDown(search, { key: "Escape" });

  fireEvent.keyDown(scroller, down);
  await screen.findByRole("complementary", { name: "Review schedule" });
  fireEvent.keyDown(scroller, down);
  await screen.findByRole("complementary", { name: "Book room" });
  fireEvent.keyDown(scroller, up);
  await screen.findByRole("complementary", { name: "Review schedule" });
  fireEvent.keyDown(scroller, down);
  await screen.findByRole("complementary", { name: "Book room" });

  fireEvent.keyDown(scroller, remove);
  const dialog = await screen.findByRole("dialog", { name: "Delete task?" });
  expect(document.activeElement).toBe(dialog);
  fireEvent.keyDown(dialog, { key: "Escape" });
  await waitFor(() =>
    expect(screen.queryByRole("dialog", { name: "Delete task?" })).toBeNull(),
  );
  expect(
    request.mock.calls.some(([, options]) => options?.method === "DELETE"),
  ).toBe(false);
  expect(screen.getByRole("complementary", { name: "Book room" })).toBeTruthy();

  fireEvent.keyDown(scroller, remove);
  const reopened = await screen.findByRole("dialog", { name: "Delete task?" });
  fireEvent.keyDown(reopened, { key: "Enter" });
  await waitFor(() =>
    expect(screen.queryByRole("button", { name: "Book room" })).toBeNull(),
  );
  expect(request).toHaveBeenCalledWith("/api/tasks/closed-task", {
    method: "DELETE",
    headers: { "X-CSRF-Token": "test-csrf" },
  });
});
