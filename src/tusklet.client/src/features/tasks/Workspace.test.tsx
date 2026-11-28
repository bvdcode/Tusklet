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
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

test("shows tasks across lists and lets users sort, group and select a list", async () => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    },
  );
  const task: TaskItem = {
    id: "first",
    listId: "inbox",
    title: "Zebra",
    note: "Reserve the meeting room",
    dueDate: null,
    isImportant: false,
    isCompleted: false,
    progress: null,
    startsAt: null,
    reminderAt: null,
    reminderEnabled: null,
    recurrence: null,
    links: [
      {
        id: "link",
        url: "https://example.com",
        displayName: "Agenda",
        applicationName: null,
      },
    ],
  };
  const personalTask: TaskItem = {
    ...task,
    id: "second",
    listId: "personal",
    title: "Apple",
    note: null,
    links: [],
    isCompleted: true,
    isImportant: true,
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
    "/api/tasks": [
      task,
      { ...task, id: "third", title: "Yak", note: null, links: [] },
      personalTask,
    ],
    "/api/tasks?listId=personal": [personalTask],
  };
  const groupingEndpoint = "/api/auth/preferences/taskGrouping";
  const sortingEndpoint = "/api/auth/preferences/taskSorting";
  const completionEndpoint = "/api/tasks/first/completion";
  const fetchTasks = vi.fn(
    (
      url:
        | keyof typeof responses
        | typeof groupingEndpoint
        | typeof sortingEndpoint
        | typeof completionEndpoint,
      options?: RequestInit,
    ) => {
      if (url === completionEndpoint) {
        task.isCompleted =
          options?.body === JSON.stringify({ isCompleted: true });
        return Promise.resolve(new Response(null, { status: 204 }));
      }
      return Promise.resolve(
        url === groupingEndpoint || url === sortingEndpoint
          ? new Response(null, { status: 204 })
          : Response.json(responses[url]),
      );
    },
  );
  vi.stubGlobal("fetch", fetchTasks);
  renderApp("/tasks/first");

  const directDetails = await screen.findByRole(
    "complementary",
    { name: "Zebra" },
    { timeout: 3000 },
  );
  expect(
    fetchTasks.mock.calls.filter(([url]) => url === "/api/tasks"),
  ).toHaveLength(1);
  const scroller = screen.getByRole("region", { name: "Tasks" });
  const scrollTo = vi.fn();
  Object.defineProperty(scroller, "scrollTo", { value: scrollTo });
  scroller.scrollTop = 75;
  fireEvent.click(within(directDetails).getByRole("button", { name: "Close" }));
  await waitFor(() => expect(screen.queryByRole("complementary")).toBeNull());
  expect(screen.getByRole("region", { name: "Tasks" })).toBe(scroller);
  expect(scroller.scrollTop).toBe(75);
  scroller.scrollTop = 0;

  const header = screen.getByRole("banner");
  expect(
    within(header).getByRole("link", { name: "Tusklet" }).getAttribute("href"),
  ).toBe("/tasks");
  const filters = within(header).getByRole("button", { name: "Filters" });
  expect(
    within(header).queryByRole("combobox", { name: "Task list" }),
  ).toBeNull();
  expect(within(header).getByRole("button", { name: "New task" })).toBeTruthy();
  expect(screen.getAllByRole("list")).toHaveLength(1);
  expect(screen.getAllByRole("listitem")[0].textContent).toContain("Zebra");

  const zebra = screen.getByRole("button", { name: "Zebra" });
  const apple = screen.getByRole("button", { name: "Apple" });
  const star = within(apple).getByRole("img", { name: "Important" });
  expect(star.parentElement?.textContent).toContain("Apple");
  const listRequests = fetchTasks.mock.calls.length;
  fireEvent.click(zebra);
  const details = await screen.findByRole("complementary", { name: "Zebra" });
  expect(within(details).getByText("To do")).toBeTruthy();
  expect(zebra.getAttribute("aria-expanded")).toBe("true");

  fireEvent.click(apple);
  await screen.findByRole("complementary", { name: "Apple" });
  expect(zebra.getAttribute("aria-expanded")).toBe("false");
  expect(apple.getAttribute("aria-expanded")).toBe("true");

  fireEvent.click(apple);
  expect(apple.getAttribute("aria-expanded")).toBe("false");
  await waitFor(() => expect(screen.queryByRole("complementary")).toBeNull());

  fireEvent.click(zebra);
  const reopened = await screen.findByRole("complementary", { name: "Zebra" });
  fireEvent.click(within(reopened).getByRole("button", { name: "Close" }));
  await waitFor(() => expect(screen.queryByRole("complementary")).toBeNull());
  expect(fetchTasks).toHaveBeenCalledTimes(listRequests);

  const search = within(header).getByRole("button", { name: "Search tasks" });
  fireEvent.click(search);
  const searchBox = within(header).getByRole("searchbox", {
    name: "Search tasks",
  });
  expect(document.activeElement).toBe(searchBox);
  for (const term of ["zeb", "MEETING", "agenda"]) {
    fireEvent.change(searchBox, { target: { value: term } });
    expect(screen.getByRole("button", { name: "Zebra" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Apple" })).toBeNull();
  }
  fireEvent.change(searchBox, { target: { value: "unmatched" } });
  expect(screen.getByText("No matching tasks.")).toBeTruthy();
  fireEvent.keyDown(searchBox, { key: "Escape" });
  expect(document.activeElement).toBe(search);
  fireEvent.click(search);
  expect(document.activeElement).toBe(within(header).getByRole("searchbox"));
  fireEvent.click(search);
  expect(screen.getByRole("button", { name: "Apple" })).toBeTruthy();
  expect(fetchTasks).toHaveBeenCalledTimes(listRequests);

  fireEvent.click(screen.getByRole("button", { name: "Zebra" }));
  const card = await screen.findByRole("complementary", { name: "Zebra" });
  fireEvent.click(within(card).getByRole("button", { name: "Complete Zebra" }));
  await within(card).findByRole("button", { name: "Reopen Zebra" });
  fireEvent.click(await screen.findByRole("button", { name: "Undo" }));
  await within(card).findByRole("button", { name: "Complete Zebra" });
  expect(task.isCompleted).toBe(false);
  fireEvent.click(within(card).getByRole("button", { name: "Close" }));
  await waitFor(() => expect(screen.queryByRole("complementary")).toBeNull());

  fireEvent.click(filters);
  const taskList = screen.getByRole("combobox", { name: "Task list" });
  expect(
    within(taskList).getByRole("option", { name: "All tasks", selected: true }),
  ).toBeTruthy();
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
    expect(screen.getByRole("heading", { name: "Personal" })).toBeTruthy(),
  );
  await waitFor(() =>
    expect(fetchTasks).toHaveBeenCalledWith(groupingEndpoint, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": "test-csrf",
      },
      body: JSON.stringify({ value: "list" }),
    }),
  );

  fireEvent.click(filters);
  fireEvent.change(screen.getByRole("combobox", { name: "Group by" }), {
    target: { value: "status" },
  });
  fireEvent.keyDown(screen.getByRole("combobox", { name: "Group by" }), {
    key: "Escape",
  });
  expect(
    await within(header).findByRole("button", { name: "To do (2)" }),
  ).toBeTruthy();
  const completedEntries = screen
    .getByRole("list", { name: "Tasks" })
    .querySelectorAll('[data-task-group="completed"]');
  vi.spyOn(scroller, "getBoundingClientRect").mockReturnValue(
    new DOMRect(0, 61, 360, 500),
  );
  vi.spyOn(scroller, "scrollHeight", "get").mockReturnValue(2000);
  vi.spyOn(scroller, "clientHeight", "get").mockReturnValue(500);
  let completedTop = 500;
  vi.spyOn(completedEntries[0], "getBoundingClientRect").mockImplementation(
    () => new DOMRect(0, completedTop, 300, 24),
  );
  vi.spyOn(completedEntries[1], "getBoundingClientRect").mockImplementation(
    () => new DOMRect(0, completedTop + 24, 300, 65),
  );
  fireEvent.scroll(scroller);
  expect(
    await within(header).findByRole("button", { name: "To do (2)" }),
  ).toBeTruthy();
  completedTop = 60;
  fireEvent.scroll(scroller);
  expect(
    await within(header).findByRole("button", { name: "Completed (1)" }),
  ).toBeTruthy();
  completedTop = 200;
  fireEvent.scroll(scroller);
  const groupButton = await within(header).findByRole("button", {
    name: "To do (2)",
  });

  scrollTo.mockImplementation(() => {
    completedTop = 37;
    fireEvent.scroll(scroller);
  });
  fireEvent.click(groupButton);
  const groupMenu = await screen.findByRole("menu", { name: "To do (2)" });
  expect(
    within(groupMenu)
      .getByRole("menuitem", { name: "To do (2)" })
      .getAttribute("aria-current"),
  ).toBe("true");
  fireEvent.click(
    within(groupMenu).getByRole("menuitem", { name: "Completed (1)" }),
  );
  expect(scrollTo).toHaveBeenCalledWith({ top: 163, behavior: "smooth" });
  expect(
    await within(header).findByRole("button", { name: "Completed (1)" }),
  ).toBeTruthy();
  await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());

  const taskReads = fetchTasks.mock.calls.filter(
    ([url]) => url === "/api/tasks",
  ).length;
  fireEvent.click(filters);
  const selector = screen.getByRole("combobox", { name: "Task list" });
  fireEvent.change(selector, { target: { value: "personal" } });
  fireEvent.keyDown(selector, { key: "Escape" });
  await waitFor(() =>
    expect(screen.queryByRole("dialog", { name: "Filters" })).toBeNull(),
  );
  expect(screen.queryByText("Zebra")).toBeNull();
  expect(within(header).queryByText("To do (2)")).toBeNull();
  expect(await within(header).findByText("Completed (1)")).toBeTruthy();
  expect(
    fetchTasks.mock.calls.filter(([url]) => url === "/api/tasks"),
  ).toHaveLength(taskReads);
  expect(
    fetchTasks.mock.calls.filter(
      ([url]) => url === "/api/tasks?listId=personal",
    ),
  ).toHaveLength(1);
});
