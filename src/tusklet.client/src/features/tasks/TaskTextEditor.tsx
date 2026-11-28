import { Alert, Button, Stack, TextField } from "@mui/material";
import type { FormEvent, KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";

export default function TaskTextEditor({
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

  function cancelOnEscape(event: KeyboardEvent) {
    if (event.key === "Escape" && !event.nativeEvent.isComposing) {
      event.stopPropagation();
      if (!saving) {
        onClose();
      }
    }
  }

  return (
    <Stack
      component="form"
      spacing={1}
      onSubmit={submit}
      onKeyDown={cancelOnEscape}
      aria-busy={saving}
    >
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
        size="small"
        slotProps={{
          htmlInput: isTitle
            ? { maxLength: 255, pattern: ".*\\S.*" }
            : undefined,
        }}
      />
      <Stack
        direction="row"
        useFlexGap
        sx={{ justifyContent: "flex-end", gap: 1, flexWrap: "wrap" }}
      >
        <Button size="small" disabled={saving} onClick={onClose}>
          {t("common.cancel")}
        </Button>
        <Button size="small" type="submit" loading={saving} variant="contained">
          {t("common.save")}
        </Button>
      </Stack>
    </Stack>
  );
}
