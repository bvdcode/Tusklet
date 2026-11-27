import { Drawer, useMediaQuery, useTheme } from "@mui/material";
import { useId } from "react";
import TaskDetailsContent from "./TaskDetailsContent";
import type { TaskRow } from "./taskView";

const panelWidth = { md: 360, lg: 400 };

export default function TaskDetailsPanel({
  task,
  open,
  onClose,
}: {
  task: TaskRow | undefined;
  open: boolean;
  onClose: () => void;
}) {
  const titleId = useId();
  const theme = useTheme();
  const compact = useMediaQuery(theme.breakpoints.down("md"));
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const { duration, easing } = theme.transitions;
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
      transitionDuration={reducedMotion ? 0 : undefined}
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
          "aria-labelledby": task ? titleId : undefined,
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
      {task && (
        <TaskDetailsContent
          key={task.id}
          task={task}
          titleId={titleId}
          onClose={onClose}
          compact={compact}
        />
      )}
    </Drawer>
  );
}
