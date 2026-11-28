import type { Theme } from "@mui/material/styles";
import { pageContentWidth } from "../../shared/pageLayout";

export const taskWorkspaceHeading = {
  position: "absolute",
  width: "1px",
  height: "1px",
  clipPath: "inset(50%)",
  overflow: "hidden",
} as const;

export function taskWorkspaceLayout(detailsOpen: boolean) {
  return (theme: Theme) => {
    const maxListWidth = pageContentWidth(theme);
    const detailsWidth = detailsOpen
      ? "min(50%, calc(448px + var(--tusklet-details-gap)))"
      : "0px";

    return {
      display: "flex",
      flex: 1,
      minHeight: 0,
      "--tusklet-details-gap": theme.spacing(2),
      [theme.breakpoints.up("md")]: {
        display: "grid",
        gridTemplateColumns: `minmax(0, 1fr) minmax(0, ${maxListWidth}) minmax(${detailsWidth}, 1fr)`,
        gridTemplateRows: "minmax(0, 1fr)",
        transition: theme.transitions.create("grid-template-columns", {
          duration: detailsOpen
            ? theme.transitions.duration.enteringScreen
            : theme.transitions.duration.leavingScreen,
          easing: detailsOpen
            ? theme.transitions.easing.easeOut
            : theme.transitions.easing.sharp,
        }),
        "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      },
    };
  };
}

export const taskListColumn = {
  flex: 1,
  gridColumn: 2,
  gridRow: 1,
  minWidth: 0,
  minHeight: 0,
  position: "relative",
} as const;
