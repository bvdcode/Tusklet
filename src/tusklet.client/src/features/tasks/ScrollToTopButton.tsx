import ArrowUpwardRounded from "@mui/icons-material/ArrowUpwardRounded";
import { Box, Fab, Slide, useMediaQuery } from "@mui/material";
import { useCallback, useSyncExternalStore, type RefObject } from "react";
import { useTranslation } from "react-i18next";
import { scrollTasks } from "./taskScroll";

export default function ScrollToTopButton({
  scroller,
  focusTarget,
}: {
  scroller: HTMLElement | null;
  focusTarget: RefObject<HTMLHeadingElement | null>;
}) {
  const { t } = useTranslation();
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const subscribe = useCallback(
    (update: () => void) => {
      scroller?.addEventListener("scroll", update, { passive: true });
      window.addEventListener("resize", update);
      return () => {
        scroller?.removeEventListener("scroll", update);
        window.removeEventListener("resize", update);
      };
    },
    [scroller],
  );
  const visible = useSyncExternalStore(
    subscribe,
    () =>
      scroller !== null &&
      scroller.clientHeight > 0 &&
      scroller.scrollTop >= scroller.clientHeight * 2,
  );

  return (
    <Box
      sx={{
        position: "absolute",
        insetInlineEnd: (theme) => theme.spacing(2.5),
        bottom: (theme) =>
          `calc(${theme.spacing(2)} + env(safe-area-inset-bottom, 0px))`,
        zIndex: "fab",
      }}
    >
      <Slide
        direction="up"
        in={visible}
        mountOnEnter
        unmountOnExit
        timeout={reducedMotion ? 0 : undefined}
      >
        <Fab
          size="small"
          aria-label={t("common.backToTop")}
          tabIndex={visible ? 0 : -1}
          onClick={() => {
            if (scroller) {
              focusTarget.current?.focus({ preventScroll: true });
              scrollTasks(scroller, 0, reducedMotion);
            }
          }}
          sx={{
            bgcolor: "background.paper",
            color: "text.secondary",
            border: 1,
            borderColor: "divider",
            boxShadow: 1,
            "&:hover": { bgcolor: "background.default", color: "primary.main" },
          }}
        >
          <ArrowUpwardRounded />
        </Fab>
      </Slide>
    </Box>
  );
}
