import { Drawer, useMediaQuery, useTheme } from "@mui/material";
import { useId, useState } from "react";
import TaskDetailsContent from "./TaskDetailsContent";
import type { TaskList, UpdateTaskInput } from "./tasksApi";
import type { TaskRow } from "./taskView";

const panelWidth = { md: 360, lg: 400 };

export default function TaskDetailsPanel({
  task,
  lists,
  open,
  onClose,
  onUpdate,
}: {
  task: TaskRow | undefined;
  lists: TaskList[];
  open: boolean;
  onClose: () => void;
  onUpdate: (id: string, input: UpdateTaskInput) => Promise<void>;
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
  const { duration, easing } = theme.transitions;
  const slideDuration = reducedMotion
    ? 0
    : compact
      ? duration.shortest
      : undefined;
  const transition = theme.transitions.create("width", {
    duration: open ? duration.enteringScreen : duration.leavingScreen,
    easing: open ? easing.easeOut : easing.sharp,
  });

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
            width: open ? panelWidth : 0,
            transition,
            "@media (prefers-reduced-motion: reduce)": { transition: "none" },
          },
        },
        paper: {
          role: compact ? "dialog" : "complementary",
          "aria-labelledby": visibleTask ? titleId : undefined,
          inert: !open,
          sx: compact
            ? { width: "100%" }
            : {
                width: panelWidth,
                top: "calc(var(--tusklet-account-toolbar-height) + 1px)",
                bottom: 0,
                height: "auto",
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
          compact={compact}
        />
      )}
    </Drawer>
  );
}
