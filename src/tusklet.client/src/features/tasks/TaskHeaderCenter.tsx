import { Box, Fade, useMediaQuery, useTheme } from "@mui/material";
import type { ReactNode } from "react";

export default function TaskHeaderCenter({
  searching,
  group,
  search,
}: {
  searching: boolean;
  group: ReactNode;
  search: ReactNode;
}) {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const duration = useTheme().transitions.duration.shorter;
  const timeout = reducedMotion ? 0 : duration;

  return (
    <Box
      sx={{
        display: "grid",
        alignItems: "center",
        "& > *": { gridArea: "1 / 1", minWidth: 0 },
      }}
    >
      <Fade in={!searching} timeout={timeout}>
        <Box inert={searching} aria-hidden={searching}>
          {group}
        </Box>
      </Fade>
      <Fade in={searching} timeout={timeout} mountOnEnter unmountOnExit>
        <Box inert={!searching} aria-hidden={!searching}>
          {search}
        </Box>
      </Fade>
    </Box>
  );
}
