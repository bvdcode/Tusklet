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

test("shows tasks across lists and lets users sort, group and select a list", async () => {
  const task: TaskItem = {
    id: "first",
    title: "Zebra",
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
  const responses = {
    "/api/auth/session": {
      setupRequired: false,
      openIdEnabled: false,
      user: {
        id: "owner",
        username: "alex",
        isAdmin: false,
        openIdLinked: false,
        pictureUrl: null,
      },
      requestToken: "test-csrf",
    },
    "/api/tasks/lists": [
      { id: "inbox", name: "Inbox", isInbox: true },
      { id: "personal", name: "Personal", isInbox: false },
    ],
    "/api/tasks/lists/inbox": [task],
    "/api/tasks/lists/personal": [
      { ...task, id: "second", title: "Apple", isCompleted: true },
    ],
  };
  const fetchTasks = vi.fn((url: keyof typeof responses) =>
    Promise.resolve(Response.json(responses[url])),
  );
  vi.stubGlobal("fetch", fetchTasks);
  renderApp();

  await screen.findByText("Apple");
  const header = screen.getByRole("banner");
  const selector = within(header).getByRole("combobox", { name: "Task list" });
  const filters = within(header).getByRole("button", { name: "Filters" });
  expect(selector.textContent).toBe("All tasks");
  expect(within(header).getByRole("button", { name: "New task" })).toBeTruthy();
  expect(screen.getAllByRole("list")).toHaveLength(1);
  expect(screen.getAllByRole("listitem")[0].textContent).toContain("Zebra");

  fireEvent.click(screen.getByRole("button", { name: "Zebra" }));
  const details = await screen.findByRole("dialog", { name: "Zebra" });
  expect(within(details).getByText("To do")).toBeTruthy();
  fireEvent.click(within(details).getByRole("button", { name: "Close" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

  fireEvent.click(filters);
  fireEvent.change(screen.getByRole("combobox", { name: "Sort by" }), {
    target: { value: "title" },
  });
  fireEvent.keyDown(screen.getByRole("combobox", { name: "Sort by" }), {
    key: "Escape",
  });
  await waitFor(() =>
    expect(screen.getAllByRole("listitem")[0].textContent).toContain("Apple"),
  );

  fireEvent.click(filters);
  fireEvent.change(screen.getByRole("combobox", { name: "Group by" }), {
    target: { value: "list" },
  });
  fireEvent.keyDown(screen.getByRole("combobox", { name: "Group by" }), {
    key: "Escape",
  });
  await waitFor(() =>
    expect(screen.getByRole("list", { name: "Personal" })).toBeTruthy(),
  );

  fireEvent.mouseDown(selector);
  fireEvent.click(await screen.findByRole("option", { name: "Personal" }));
  expect(screen.queryByText("Zebra")).toBeNull();
  expect(screen.getByText("Apple")).toBeTruthy();
});
