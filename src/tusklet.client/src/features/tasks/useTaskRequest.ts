import type { HubConnection } from "@microsoft/signalr";
import { createContext, useContext, type RefObject } from "react";
import type { TaskRequest } from "./tasksApi";

export const TaskConnectionContext =
  createContext<RefObject<HubConnection | null> | null>(null);

export default function useTaskRequest(requestToken: string) {
  const connection = useContext(TaskConnectionContext);

  return (): TaskRequest => ({
    requestToken,
    connectionId: connection?.current?.connectionId ?? null,
  });
}
