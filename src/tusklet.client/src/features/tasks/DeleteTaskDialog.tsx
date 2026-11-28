import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  buttonClasses,
} from "@mui/material";
import { useId, type KeyboardEvent } from "react";
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

  return (
    <Dialog
      open
      fullWidth
      maxWidth="xs"
      onClose={onCancel}
      aria-labelledby={headingId}
      aria-describedby={messageId}
      slotProps={{
        paper: {
          onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
            if (
              event.key === "Enter" &&
              event.target === event.currentTarget &&
              !event.repeat &&
              !saving
            ) {
              event.preventDefault();
              onConfirm();
            }
          },
        },
      }}
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
      <DialogActions
        sx={{
          [`& .${buttonClasses.focusVisible}`]: {
            textDecoration: "underline",
          },
        }}
      >
        <Button
          color="inherit"
          disabled={saving}
          disableFocusRipple
          onClick={onCancel}
        >
          {t("common.cancel")}
        </Button>
        <Button
          color="error"
          variant="contained"
          disableFocusRipple
          loading={saving}
          onClick={onConfirm}
        >
          {t("tasks.deleteAction")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
