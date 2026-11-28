import {
  HubConnectionBuilder,
  HttpTransportType,
  LogLevel,
  type HubConnection,
} from "@microsoft/signalr";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, type ReactNode } from "react";
import { taskItemsKey, taskListsKey } from "./tasksApi";
import { TaskConnectionContext } from "./useTaskRequest";

const restartDelay = 30_000;

export default function TaskRealtimeProvider({
  ownerId,
  children,
}: {
  ownerId: string;
  children: ReactNode;
}) {
  const queryClient = useQueryClient();
  const current = useRef<HubConnection | null>(null);

  useEffect(() => {
    const connection = new HubConnectionBuilder()
      .withUrl(
        new URL("/api/tasks/live", window.location.origin).href,
        HttpTransportType.WebSockets,
      )
      .withAutomaticReconnect()
      .configureLogging(LogLevel.None)
      .build();
    current.current = connection;
    let disposed = false;
    let restartTimer: number | undefined;

    function refresh(listsChanged: boolean) {
      if (disposed) {
        return;
      }
      void queryClient.invalidateQueries({
        queryKey: [...taskItemsKey, ownerId],
      });
      if (listsChanged) {
        void queryClient.invalidateQueries({
          queryKey: [...taskListsKey, ownerId],
        });
      }
    }

    function restart() {
      window.clearTimeout(restartTimer);
      restartTimer = window.setTimeout(restartNow, restartDelay);
    }

    function restartNow() {
      if (restartTimer !== undefined) {
        window.clearTimeout(restartTimer);
        restartTimer = undefined;
        void start(true);
      }
    }

    async function start(refreshAfterStart: boolean) {
      try {
        await connection.start();
      } catch {
        if (!disposed) {
          restart();
        }
        return;
      }
      if (refreshAfterStart) {
        refresh(true);
      }
    }

    connection.on(
      "WorkspaceChanged",
      (listsChanged: boolean, origin: string | null) => {
        if (origin === null || origin !== connection.connectionId) {
          refresh(listsChanged);
        }
      },
    );
    connection.onreconnected(() => refresh(true));
    connection.onclose(() => {
      if (!disposed) {
        restart();
      }
    });
    window.addEventListener("online", restartNow);
    void start(false);

    return () => {
      disposed = true;
      current.current = null;
      window.clearTimeout(restartTimer);
      window.removeEventListener("online", restartNow);
      void connection.stop();
    };
  }, [ownerId, queryClient]);

  return (
    <TaskConnectionContext value={current}>{children}</TaskConnectionContext>
  );
}
