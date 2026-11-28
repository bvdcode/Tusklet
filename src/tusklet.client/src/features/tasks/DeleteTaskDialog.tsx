import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { useId, useRef } from "react";
import { useTranslation } from "react-i18next";

export default function DeleteTaskDialog({
  title,
  saving,
  failed,
  onCancel,
  onConfirm,
}: {
  title: string;
  saving: boolean;
  failed: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  const headingId = useId();
  const messageId = useId();
  const confirmButton = useRef<HTMLButtonElement>(null);

  return (
    <Dialog
      open
      fullWidth
      maxWidth="xs"
      onClose={onCancel}
      onTransitionEnter={() => {
        window.requestAnimationFrame(() => confirmButton.current?.focus());
      }}
      aria-labelledby={headingId}
      aria-describedby={messageId}
    >
      <DialogTitle id={headingId}>{t("tasks.deleteTitle")}</DialogTitle>
      <DialogContent>
        <DialogContentText id={messageId} sx={{ overflowWrap: "anywhere" }}>
          {t("tasks.deleteConfirm", { title })}
        </DialogContentText>
        {failed && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {t("tasks.deleteError")}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button disabled={saving} onClick={onCancel}>
          {t("common.cancel")}
        </Button>
        <Button
          ref={confirmButton}
          color="error"
          variant="contained"
          loading={saving}
          onClick={onConfirm}
        >
          {t("tasks.deleteAction")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
