import { useCallback, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { taskPath, tasksPath } from "./taskRoutes";

const fromList = "task-list";

export default function useTaskDetailRoute() {
  const location = useLocation();
  const { taskId } = useParams();
  const navigate = useNavigate();
  const selection = useRef({ taskId, state: location.state });
  const returning = useRef(false);

  useLayoutEffect(() => {
    selection.current = { taskId, state: location.state };
    returning.current = false;
  }, [location, taskId]);

  useLayoutEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => {
      window.history.scrollRestoration = previous;
    };
  }, []);

  const closeDetails = useCallback(
    (expectedId?: string) => {
      if (returning.current) {
        return;
      }
      const { taskId, state } = selection.current;
      if (
        taskId === undefined ||
        (expectedId !== undefined && taskId !== expectedId)
      ) {
        return;
      }
      if (state === fromList) {
        returning.current = true;
        void navigate(-1);
        return;
      }
      void navigate(tasksPath, { replace: true });
    },
    [navigate],
  );

  const toggleDetails = useCallback(
    (taskId: string) => {
      if (returning.current) {
        return;
      }
      const { taskId: previousId, state } = selection.current;
      if (previousId === taskId) {
        closeDetails();
        return;
      }
      const nextState =
        previousId === undefined || state === fromList ? fromList : null;
      selection.current = { taskId, state: nextState };
      void navigate(taskPath(taskId), {
        replace: previousId !== undefined,
        state: nextState,
      });
    },
    [closeDetails, navigate],
  );

  return {
    taskId: taskId ?? null,
    getSelectedTaskId: () => selection.current.taskId,
    closeDetails,
    toggleDetails,
  };
}
