import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { deleteTask, taskItemsKey, type TaskItem } from "./tasksApi";
import type { TaskRow } from "./taskView";

export default function useTaskDeletion(
  ownerId: string,
  requestToken: string,
  onDeleted: (id: string) => void,
) {
  const queryClient = useQueryClient();
  const [task, setTask] = useState<TaskRow | null>(null);
  const deletion = useMutation({
    mutationFn: (target: TaskRow) => deleteTask(target.id, requestToken),
    onSuccess: async (_, target) => {
      const queryKey = [...taskItemsKey, ownerId];
      await queryClient.cancelQueries({ queryKey });
      queryClient.setQueryData<TaskItem[]>(queryKey, (items) =>
        items?.filter(({ id }) => id !== target.id),
      );
      setTask(null);
      onDeleted(target.id);
      await queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    task,
    saving: deletion.isPending,
    failed: deletion.isError,
    open: (target: TaskRow) => {
      deletion.reset();
      setTask(target);
    },
    close: () => {
      if (!deletion.isPending) {
        setTask(null);
      }
    },
    confirm: () => {
      if (task && !deletion.isPending) {
        deletion.mutate(task);
      }
    },
  };
}
