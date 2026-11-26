import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import ProviderForm from "./ProviderForm";
import { readOpenIdSettings } from "./accountsApi";

type Props = {
  requestToken: string;
  onClose: () => void;
};

export default function ProviderDialog({ requestToken, onClose }: Props) {
  const { t } = useTranslation();
  const settings = useQuery({
    queryKey: ["openid-settings"],
    queryFn: ({ signal }) => readOpenIdSettings(signal),
    gcTime: 0,
  });

  return (
    <Dialog
      open
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="provider-title"
    >
      <DialogTitle id="provider-title">{t("provider.title")}</DialogTitle>
      {settings.isSuccess ? (
        <ProviderForm
          settings={settings.data}
          requestToken={requestToken}
          onClose={onClose}
        />
      ) : (
        <>
          <DialogContent>
            {settings.isPending ? (
              <CircularProgress size={24} aria-label={t("common.loading")} />
            ) : (
              <Alert
                severity="error"
                action={
                  <Button
                    color="inherit"
                    onClick={() => void settings.refetch()}
                  >
                    {t("common.retry")}
                  </Button>
                }
              >
                {t("provider.loadError")}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose}>{t("common.close")}</Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
