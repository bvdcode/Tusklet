import CloseRounded from "@mui/icons-material/CloseRounded";
import { Button, IconButton, Stack } from "@mui/material";
import { useSnackbar } from "notistack";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRegisterSW } from "virtual:pwa-register/react";

function UpdateMessage() {
  const { t } = useTranslation();
  return t("pwa.updateAvailable");
}

function UpdateActions({
  onUpdate,
  onClose,
}: {
  onUpdate: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Stack direction="row" sx={{ alignItems: "center", ml: "auto" }}>
      <Button color="primary" onClick={onUpdate}>
        {t("pwa.update")}
      </Button>
      <IconButton size="small" aria-label={t("common.close")} onClick={onClose}>
        <CloseRounded fontSize="small" />
      </IconButton>
    </Stack>
  );
}

export default function AppUpdatePrompt() {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({ immediate: true });

  useEffect(() => {
    if (!needRefresh) {
      return;
    }
    const close = () => setNeedRefresh(false);
    const id = enqueueSnackbar(<UpdateMessage />, {
      persist: true,
      action: (
        <UpdateActions
          onUpdate={() => void updateServiceWorker()}
          onClose={close}
        />
      ),
    });
    function dismissOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !event.defaultPrevented) {
        close();
      }
    }
    window.addEventListener("keydown", dismissOnEscape);
    return () => {
      window.removeEventListener("keydown", dismissOnEscape);
      closeSnackbar(id);
    };
  }, [
    closeSnackbar,
    enqueueSnackbar,
    needRefresh,
    setNeedRefresh,
    updateServiceWorker,
  ]);

  return null;
}
