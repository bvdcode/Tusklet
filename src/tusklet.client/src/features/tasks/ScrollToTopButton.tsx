import ArrowUpwardRounded from "@mui/icons-material/ArrowUpwardRounded";
import { Box, Fab, Slide, useMediaQuery } from "@mui/material";
import { useSyncExternalStore, type RefObject } from "react";
import { useTranslation } from "react-i18next";

function subscribeToScroll(update: () => void) {
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  return () => {
    window.removeEventListener("scroll", update);
    window.removeEventListener("resize", update);
  };
}

function canScrollToTop() {
  return window.scrollY >= window.innerHeight * 2;
}

export default function ScrollToTopButton({
  focusTarget,
}: {
  focusTarget: RefObject<HTMLHeadingElement | null>;
}) {
  const { t } = useTranslation();
  const visible = useSyncExternalStore(subscribeToScroll, canScrollToTop);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  return (
    <Box
      sx={{
        position: "fixed",
        alignSelf: "flex-end",
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
            focusTarget.current?.focus({ preventScroll: true });
            window.scrollTo({
              top: 0,
              behavior: reducedMotion ? "instant" : "smooth",
            });
          }}
          sx={{
            position: "absolute",
            bottom: 0,
            insetInlineEnd: (theme) => ({ xs: 0, md: theme.spacing(2) }),
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
