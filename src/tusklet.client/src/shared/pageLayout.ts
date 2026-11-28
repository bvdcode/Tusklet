import type { Theme } from "@mui/material/styles";

export const pageMaxWidth = "md";
export const pagePadding = { xs: 2, sm: 3 } as const;

export function pageContentWidth(theme: Theme) {
  return `calc(${theme.breakpoints.values[pageMaxWidth]}px - ${theme.spacing(pagePadding.sm * 2)})`;
}

export function pageScrollSurface(theme: Theme) {
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

export function settingsPageSurface(theme: Theme) {
  return { ...pageScrollSurface(theme), p: { xs: 2.5, sm: 3.5 } };
}
