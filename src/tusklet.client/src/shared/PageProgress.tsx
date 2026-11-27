import { LinearProgress } from "@mui/material";
import { useTranslation } from "react-i18next";

export default function PageProgress() {
  const { t } = useTranslation();

  return (
    <LinearProgress
      aria-label={t("common.loading")}
      sx={{
        position: "fixed",
        insetInline: 0,
        top: 0,
        height: 3,
        zIndex: (theme) => theme.zIndex.appBar + 1,
        pointerEvents: "none",
      }}
    />
  );
}
