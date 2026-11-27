import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  TextField,
} from "@mui/material";
import { useId, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import type { CreateTaskInput, TaskList } from "./tasksApi";

type Props = {
  listId: string | null;
  lists: TaskList[];
  saving: boolean;
  failed: boolean;
  onSave: (input: CreateTaskInput) => void;
  onClose: () => void;
};

export default function CreateTaskDialog({
  listId,
  lists,
  saving,
  failed,
  onSave,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const titleId = useId();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") ?? "").trim();
    if (!title || saving) {
      return;
    }
    onSave({
      listId: String(form.get("listId") ?? "").trim() || listId,
      title,
      note: String(form.get("note") ?? "").trim() || null,
      dueDate: String(form.get("dueDate") ?? "").trim() || null,
      isImportant: form.has("important"),
    });
  }

  return (
    <Dialog
      open
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="xs"
      aria-labelledby={titleId}
    >
      <Stack component="form" onSubmit={submit} aria-busy={saving}>
        <DialogTitle id={titleId}>{t("tasks.create")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {failed && <Alert severity="error">{t("tasks.createError")}</Alert>}
            <TextField
              name="title"
              label={t("tasks.taskTitle")}
              required
              autoFocus
              disabled={saving}
              slotProps={{ htmlInput: { maxLength: 255, pattern: ".*\\S.*" } }}
            />
            {lists.length > 0 && (
              <TextField
                select
                name="listId"
                label={t("tasks.list")}
                defaultValue={listId ?? ""}
                disabled={saving}
                slotProps={{
                  select: { native: true },
                  inputLabel: { shrink: true },
                }}
              >
                {lists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.isInbox ? t("tasks.inbox") : list.name}
                  </option>
                ))}
              </TextField>
            )}
            <TextField
              name="note"
              label={t("tasks.note")}
              multiline
              minRows={2}
              maxRows={6}
              disabled={saving}
            />
            <TextField
              name="dueDate"
              label={t("tasks.dueDate")}
              type="date"
              disabled={saving}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <FormControlLabel
              control={<Checkbox name="important" />}
              label={t("tasks.important")}
              disabled={saving}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={saving}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" variant="contained" loading={saving}>
            {t("common.save")}
          </Button>
        </DialogActions>
      </Stack>
    </Dialog>
  );
}
