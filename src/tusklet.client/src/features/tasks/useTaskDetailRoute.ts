import { useCallback, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const taskParameter = "task";
const fromList = "task-list";

export default function useTaskDetailRoute() {
  const location = useLocation();
  const navigate = useNavigate();
  const latestLocation = useRef(location);
  const returning = useRef(false);

  useLayoutEffect(() => {
    latestLocation.current = location;
    returning.current = false;
  }, [location]);

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
      const { search, hash, state } = latestLocation.current;
      const params = new URLSearchParams(search);
      const taskId = params.get(taskParameter);
      if (
        taskId === null ||
        (expectedId !== undefined && taskId !== expectedId)
      ) {
        return;
      }
      if (state === fromList) {
        returning.current = true;
        void navigate(-1);
        return;
      }
      params.delete(taskParameter);
      void navigate(
        { search: params.toString(), hash },
        { replace: true, preventScrollReset: true },
      );
    },
    [navigate],
  );

  const toggleDetails = useCallback(
    (taskId: string) => {
      if (returning.current) {
        return;
      }
      const current = latestLocation.current;
      const { search, hash, state } = current;
      const params = new URLSearchParams(search);
      const previousId = params.get(taskParameter);
      if (previousId === taskId) {
        closeDetails();
        return;
      }
      params.set(taskParameter, taskId);
      const nextSearch = params.toString();
      const nextState =
        previousId === null || state === fromList ? fromList : null;
      latestLocation.current = {
        ...current,
        search: nextSearch,
        state: nextState,
      };
      void navigate(
        { search: nextSearch, hash },
        {
          replace: previousId !== null,
          state: nextState,
          preventScrollReset: true,
        },
      );
    },
    [closeDetails, navigate],
  );

  return {
    taskId: new URLSearchParams(location.search).get(taskParameter),
    closeDetails,
    toggleDetails,
  };
}
