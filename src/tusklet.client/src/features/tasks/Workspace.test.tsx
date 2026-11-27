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
    "/api/tasks/lists/inbox": [task, { ...task, id: "third", title: "Yak" }],
    "/api/tasks/lists/personal": [
      {
        ...task,
        id: "second",
        title: "Apple",
        isCompleted: true,
        isImportant: true,
      },
    ],
  };
  const groupingEndpoint = "/api/auth/preferences/taskGrouping";
  const sortingEndpoint = "/api/auth/preferences/taskSorting";
  const fetchTasks = vi.fn(
    (
      url:
        | keyof typeof responses
        | typeof groupingEndpoint
        | typeof sortingEndpoint,
    ) =>
      Promise.resolve(
        url === groupingEndpoint || url === sortingEndpoint
          ? new Response(null, { status: 204 })
          : Response.json(responses[url]),
      ),
  );
  vi.stubGlobal("fetch", fetchTasks);
  renderApp();

  await screen.findByText("Apple", {}, { timeout: 3000 });
  const header = screen.getByRole("banner");
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
  vi.spyOn(header, "getBoundingClientRect").mockReturnValue(
    new DOMRect(0, 0, 360, 61),
  );
  vi.spyOn(document.documentElement, "scrollHeight", "get").mockReturnValue(
    2000,
  );
  let completedTop = 500;
  vi.spyOn(completedEntries[0], "getBoundingClientRect").mockImplementation(
    () => new DOMRect(0, completedTop, 300, 24),
  );
  vi.spyOn(completedEntries[1], "getBoundingClientRect").mockImplementation(
    () => new DOMRect(0, completedTop + 24, 300, 65),
  );
  fireEvent.scroll(window);
  expect(
    await within(header).findByRole("button", { name: "To do (2)" }),
  ).toBeTruthy();
  completedTop = 60;
  fireEvent.scroll(window);
  expect(
    await within(header).findByRole("button", { name: "Completed (1)" }),
  ).toBeTruthy();
  completedTop = 200;
  fireEvent.scroll(window);
  const groupButton = await within(header).findByRole("button", {
    name: "To do (2)",
  });

  const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {
    completedTop = 37;
    fireEvent.scroll(window);
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

  fireEvent.click(filters);
  const selector = screen.getByRole("combobox", { name: "Task list" });
  fireEvent.change(selector, { target: { value: "personal" } });
  fireEvent.keyDown(selector, { key: "Escape" });
  await waitFor(() =>
    expect(screen.queryByRole("dialog", { name: "Filters" })).toBeNull(),
  );
  expect(screen.queryByText("Zebra")).toBeNull();
  expect(within(header).queryByText("To do (2)")).toBeNull();
  expect(within(header).getByText("Completed (1)")).toBeTruthy();
});
