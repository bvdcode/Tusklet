import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import TaskRealtimeProvider from "./TaskRealtimeProvider";
import { taskItemsKey, taskListsKey } from "./tasksApi";

const connection = vi.hoisted(() => ({
  connectionId: "local-connection",
  start: vi.fn(async () => {}),
  stop: vi.fn(async () => {}),
  on: vi.fn<
    (
      method: string,
      listener: (listsChanged: boolean, origin: string | null) => void,
    ) => void
  >(),
  onreconnected: vi.fn<(listener: () => void) => void>(),
  onclose: vi.fn(),
}));

vi.mock("@microsoft/signalr", () => ({
  HubConnectionBuilder: class {
    withUrl() {
      return this;
    }
    withAutomaticReconnect() {
      return this;
    }
    configureLogging() {
      return this;
    }
    build() {
      return connection;
    }
  },
  HttpTransportType: { WebSockets: 1 },
  LogLevel: { None: 6 },
}));

test("refreshes the owner's caches for peer changes and reconnects", async () => {
  const queryClient = new QueryClient();
  const invalidate = vi.spyOn(queryClient, "invalidateQueries");
  const { unmount } = render(
    <QueryClientProvider client={queryClient}>
      <TaskRealtimeProvider ownerId="owner">{null}</TaskRealtimeProvider>
    </QueryClientProvider>,
  );
  const [method, workspaceChanged] = connection.on.mock.calls[0];
  const [reconnected] = connection.onreconnected.mock.calls[0];
  expect(method).toBe("WorkspaceChanged");
  expect(connection.start).toHaveBeenCalledOnce();
  act(() => workspaceChanged(true, "local-connection"));
  expect(invalidate).not.toHaveBeenCalled();

  act(() => workspaceChanged(false, "other-connection"));
  const items = { queryKey: [...taskItemsKey, "owner"] };
  const lists = { queryKey: [...taskListsKey, "owner"] };
  expect(invalidate.mock.calls).toEqual([[items]]);
  invalidate.mockClear();

  act(() => workspaceChanged(true, null));
  expect(invalidate.mock.calls).toEqual([[items], [lists]]);
  invalidate.mockClear();

  act(reconnected);
  expect(invalidate.mock.calls).toEqual([[items], [lists]]);
  invalidate.mockClear();

  unmount();
  expect(connection.stop).toHaveBeenCalledOnce();
  act(reconnected);
  expect(invalidate).not.toHaveBeenCalled();
});
