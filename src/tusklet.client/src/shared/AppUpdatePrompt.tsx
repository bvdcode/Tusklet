import CloseRounded from "@mui/icons-material/CloseRounded";
import { Button, IconButton, Snackbar } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useRegisterSW } from "virtual:pwa-register/react";

export default function AppUpdatePrompt() {
  const { t } = useTranslation();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({ immediate: true });

  return (
    <Snackbar
      open={needRefresh}
      message={t("pwa.updateAvailable")}
      onClose={(_, reason) => {
        if (reason === "escapeKeyDown") {
          setNeedRefresh(false);
        }
      }}
      action={
        <>
          <Button color="inherit" onClick={() => void updateServiceWorker()}>
            {t("pwa.update")}
          </Button>
          <IconButton
            color="inherit"
            size="small"
            aria-label={t("common.close")}
            onClick={() => setNeedRefresh(false)}
          >
            <CloseRounded fontSize="small" />
          </IconButton>
        </>
      }
    />
  );
}
