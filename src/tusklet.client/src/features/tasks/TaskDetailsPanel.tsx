import { Drawer, useMediaQuery, useTheme } from "@mui/material";
import { useId, useState } from "react";
import TaskDetailsContent from "./TaskDetailsContent";
import type { TaskList, UpdateTaskInput } from "./tasksApi";
import type { TaskRow } from "./taskView";
import type { ChangeTaskCompletion } from "./useTaskCompletion";

export default function TaskDetailsPanel({
  task,
  lists,
  open,
  onClose,
  onUpdate,
  completionPending,
  onCompletionChange,
}: {
  task: TaskRow | undefined;
  lists: TaskList[];
  open: boolean;
  onClose: () => void;
  onUpdate: (id: string, input: UpdateTaskInput) => Promise<void>;
  completionPending: boolean;
  onCompletionChange: ChangeTaskCompletion;
}) {
  const titleId = useId();
  const [lastTask, setLastTask] = useState(task);
  if (task && task !== lastTask) {
    setLastTask(task);
  }
  const visibleTask = task ?? lastTask;
  const theme = useTheme();
  const compact = useMediaQuery(theme.breakpoints.down("md"));
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const slideDuration = reducedMotion
    ? 0
    : compact
      ? theme.transitions.duration.shortest
      : undefined;

  return (
    <Drawer
      open={open}
      anchor="right"
      elevation={0}
      variant={compact ? "temporary" : "persistent"}
      onClose={onClose}
      hideBackdrop={compact}
      transitionDuration={slideDuration}
      slotProps={{
        transition: { unmountOnExit: true },
        docked: {
          sx: {
            gridColumn: 3,
            gridRow: 1,
            minWidth: 0,
            minHeight: 0,
            paddingInlineStart: "var(--tusklet-details-gap)",
            overflow: "hidden",
            display: "flex",
          },
        },
        paper: {
          id: "task-details-panel",
          role: compact ? "dialog" : "complementary",
          "aria-labelledby": visibleTask ? titleId : undefined,
          inert: !open,
          sx: compact
            ? { width: "100%" }
            : {
                position: "relative",
                width: "100%",
                border: 0,
                borderRadius: 1,
              },
        },
      }}
    >
      {visibleTask && (
        <TaskDetailsContent
          key={visibleTask.id}
          task={visibleTask}
          lists={lists}
          titleId={titleId}
          onClose={onClose}
          onUpdate={onUpdate}
          completionPending={completionPending}
          onCompletionChange={onCompletionChange}
          compact={compact}
        />
      )}
    </Drawer>
  );
}
