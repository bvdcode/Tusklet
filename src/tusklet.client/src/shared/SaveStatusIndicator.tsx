import CheckCircle from "@mui/icons-material/CheckCircle";
import { Box, Fade } from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const savedIndicatorDuration = 2000;

export default function SaveStatusIndicator({ savedAt }: { savedAt: number }) {
  const { t } = useTranslation();
  const [dismissedAt, setDismissedAt] = useState(0);
  const visible = savedAt !== 0 && savedAt !== dismissedAt;

  useEffect(() => {
    if (savedAt === 0) {
      return;
    }
    const timer = window.setTimeout(
      () => setDismissedAt(savedAt),
      savedIndicatorDuration,
    );
    return () => window.clearTimeout(timer);
  }, [savedAt]);

  return (
    <Box
      role="status"
      sx={{
        position: "absolute",
        insetInlineStart: "100%",
        marginInlineStart: (theme) => theme.spacing(0.5),
        insetBlockStart: "50%",
        transform: "translateY(-50%)",
        display: "flex",
        pointerEvents: "none",
      }}
    >
      <Fade in={visible}>
        <CheckCircle
          color="success"
          sx={{ fontSize: "1rem" }}
          titleAccess={visible ? t("common.saved") : undefined}
        />
      </Fade>
    </Box>
  );
}
