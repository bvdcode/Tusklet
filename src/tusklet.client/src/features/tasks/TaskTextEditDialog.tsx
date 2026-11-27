import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";
import { useId, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

export default function TaskTextEditDialog({
  field,
  value,
  saving,
  failed,
  onSave,
  onClose,
}: {
  field: "title" | "note";
  value: string;
  saving: boolean;
  failed: boolean;
  onSave: (value: string) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const title = useId();
  const isTitle = field === "title";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = String(
      new FormData(event.currentTarget).get("value") ?? "",
    ).trim();
    if (!saving && (!isTitle || next.length > 0)) {
      onSave(next);
    }
  }

  return (
    <Dialog
      open
      onClose={saving ? undefined : onClose}
      aria-labelledby={title}
      fullWidth
      maxWidth="xs"
      slotProps={{ paper: { sx: { backgroundImage: "none" } } }}
    >
      <Stack component="form" onSubmit={submit} aria-busy={saving}>
        <DialogTitle id={title}>
          {t(isTitle ? "tasks.editTitle" : "tasks.editNote")}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {failed && <Alert severity="error">{t("tasks.updateError")}</Alert>}
            <TextField
              name="value"
              label={t(isTitle ? "tasks.taskTitle" : "tasks.note")}
              defaultValue={value}
              autoFocus
              required={isTitle}
              disabled={saving}
              multiline={!isTitle}
              minRows={isTitle ? undefined : 3}
              maxRows={isTitle ? undefined : 8}
              slotProps={{
                htmlInput: isTitle
                  ? { maxLength: 255, pattern: ".*\\S.*" }
                  : undefined,
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={saving} onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" loading={saving} variant="contained">
            {t("common.save")}
          </Button>
        </DialogActions>
      </Stack>
    </Dialog>
  );
}
