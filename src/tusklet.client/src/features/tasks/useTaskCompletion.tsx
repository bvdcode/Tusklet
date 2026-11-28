import { Button } from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSnackbar, type SnackbarKey } from "notistack";
import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import TaskCompletionSound from "./TaskCompletionSound";
import { setTaskCompletion, taskItemsKey } from "./tasksApi";
import type { TaskRow } from "./taskView";

export type ChangeTaskCompletion = (
  task: TaskRow,
  isCompleted: boolean,
) => void;

export default function useTaskCompletion(
  ownerId: string,
  requestToken: string,
) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const notices = useRef(new Map<string, SnackbarKey>());
  const sound = useRef(new TaskCompletionSound());
  const mounted = useRef(false);

  useEffect(() => {
    const current = notices.current;
    const completionSound = sound.current;
    mounted.current = true;
    return () => {
      mounted.current = false;
      completionSound.close();
      for (const key of current.values()) {
        closeSnackbar(key);
      }
      current.clear();
    };
  }, [closeSnackbar]);

  const { mutate, isPending, isError } = useMutation({
    scope: { id: `task-completion:${ownerId}` },
    mutationFn: ({
      task,
      isCompleted,
    }: {
      task: TaskRow;
      isCompleted: boolean;
      undo: boolean;
    }) => setTaskCompletion(task.id, isCompleted, requestToken),
    onSuccess: (_, { task, isCompleted, undo }) => {
      const itemsKey = [...taskItemsKey, ownerId];
      if (mounted.current && !undo) {
        if (isCompleted) {
          void sound.current.play();
        }
        const key = enqueueSnackbar(
          t(isCompleted ? "tasks.markedComplete" : "tasks.markedReopened", {
            title: task.title,
          }),
          {
            autoHideDuration: 8000,
            preventDuplicate: false,
            action: (key) => (
              <Button
                onClick={() => {
                  if (notices.current.get(task.id) === key) {
                    notices.current.delete(task.id);
                    closeSnackbar(key);
                    mutate({ task, isCompleted: !isCompleted, undo: true });
                  }
                }}
              >
                {t("tasks.undo")}
              </Button>
            ),
            onExited: (_, key) => {
              if (notices.current.get(task.id) === key) {
                notices.current.delete(task.id);
              }
            },
          },
        );
        notices.current.set(task.id, key);
      }
      return queryClient.invalidateQueries({ queryKey: itemsKey });
    },
  });

  const changeCompletion: ChangeTaskCompletion = useCallback(
    (task, isCompleted) => {
      if (isCompleted) {
        sound.current.prepare();
      }
      const previous = notices.current.get(task.id);
      if (previous !== undefined) {
        notices.current.delete(task.id);
        closeSnackbar(previous);
      }
      mutate({ task, isCompleted, undo: false });
    },
    [closeSnackbar, mutate],
  );

  return { changeCompletion, isPending, isError };
}
