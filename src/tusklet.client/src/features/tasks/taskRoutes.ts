export const tasksPath = "/tasks";

export function taskPath(taskId: string) {
  return `${tasksPath}/${encodeURIComponent(taskId)}`;
}
