import type { Theme } from "@mui/material/styles";

export function taskWorkspaceLayout(detailsOpen: boolean) {
  return (theme: Theme) => {
    const maxListWidth = `calc(${theme.breakpoints.values.md}px - ${theme.spacing(6)})`;
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

export function taskListSurface(theme: Theme) {
  const { text, background } = (theme.vars ?? theme).palette;
  const thumb = `color-mix(in srgb, ${text.secondary} 75%, ${background.paper})`;
  return {
    minHeight: 0,
    overflowY: "auto",
    overscrollBehaviorY: "contain",
    scrollbarWidth: "thin",
    scrollbarColor: `${thumb} transparent`,
    "@supports selector(::-webkit-scrollbar)": {
      "@media (pointer: fine)": {
        scrollbarWidth: "auto",
        scrollbarColor: "auto",
        "&::-webkit-scrollbar": { width: theme.spacing(1) },
        "&::-webkit-scrollbar-thumb": {
          bgcolor: thumb,
          border: "2px solid transparent",
          borderRadius: 1,
          backgroundClip: "content-box",
          "&:hover": { bgcolor: "text.secondary" },
        },
        "&::-webkit-scrollbar-button": { display: "none" },
      },
    },
  };
}
