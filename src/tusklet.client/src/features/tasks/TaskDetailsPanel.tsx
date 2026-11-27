import { Drawer, useMediaQuery, useTheme } from "@mui/material";
import { useId } from "react";
import TaskDetailsContent from "./TaskDetailsContent";
import type { TaskRow } from "./taskView";

const compactPanelRatio = 0.52;
const compactPanelMaxWidth = 224;
const panelWidth = {
  xs: `min(${compactPanelRatio * 100}%, ${compactPanelMaxWidth}px)`,
  sm: 288,
  md: 360,
  lg: 400,
};

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
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const { duration, easing } = theme.transitions;
  const transition = theme.transitions.create(
    ["width", "margin-inline-start"],
    {
      duration: open ? duration.enteringScreen : duration.leavingScreen,
      easing: open ? easing.easeOut : easing.sharp,
    },
  );

  return (
    <Drawer
      open={open}
      anchor="right"
      variant="persistent"
      transitionDuration={reducedMotion ? 0 : undefined}
      slotProps={{
        transition: { unmountOnExit: true },
        docked: {
          sx: {
            width: open ? panelWidth : 0,
            marginInlineStart: open ? { xs: 1, sm: 2 } : 0,
            transition,
            "@media (prefers-reduced-motion: reduce)": { transition: "none" },
          },
        },
        paper: {
          role: "complementary",
          "aria-labelledby": task ? titleId : undefined,
          inert: !open,
          sx: {
            width: {
              ...panelWidth,
              xs: `min(calc((100% - ${theme.spacing(4)}) * ${compactPanelRatio}), ${compactPanelMaxWidth}px)`,
            },
            top: "calc(var(--tusklet-account-toolbar-height) + 1px)",
            bottom: 0,
            height: "auto",
            right: {
              xs: theme.spacing(2),
              sm: `max(${theme.spacing(3)}, (100% - ${theme.breakpoints.values.lg}px) / 2 + ${theme.spacing(3)})`,
            },
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
        />
      )}
    </Drawer>
  );
}
