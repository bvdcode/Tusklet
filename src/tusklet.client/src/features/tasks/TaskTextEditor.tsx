import { Box, InputBase, Stack, Typography } from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import SaveStatusIndicator from "../../shared/SaveStatusIndicator";

export default function TaskTextEditor({
  field,
  value,
  onSave,
}: {
  field: "title" | "note";
  value: string;
  onSave: (value: string) => Promise<void>;
}) {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const isTitle = field === "title";
  const inputId = useId();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const cancelling = useRef(false);
  const [draft, setDraft] = useState<string | null>(null);
  const save = useMutation({
    mutationFn: onSave,
    onSuccess: () => setDraft(null),
    onError: () =>
      enqueueSnackbar(t("tasks.updateError"), { variant: "error" }),
  });

  function saveOnBlur() {
    if (cancelling.current || save.isPending || draft === null) {
      return;
    }
    const next = draft.trim();
    if (next === value || (isTitle && next.length === 0)) {
      setDraft(null);
      return;
    }
    save.mutate(next);
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.nativeEvent.isComposing) {
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      if (!save.isPending) {
        setDraft(null);
        cancelling.current = true;
        inputRef.current?.blur();
        cancelling.current = false;
      }
    } else if (
      event.key === "Enter" &&
      (isTitle || event.ctrlKey || event.metaKey)
    ) {
      event.preventDefault();
      inputRef.current?.blur();
    }
  }

  const indicator = (
    <SaveStatusIndicator savedAt={save.isSuccess ? save.submittedAt : 0} />
  );
  const input = (
    <InputBase
      id={inputId}
      inputRef={inputRef}
      fullWidth
      multiline
      value={draft ?? value}
      readOnly={save.isPending}
      slotProps={{
        input: {
          "aria-label": isTitle ? t("tasks.taskTitle") : undefined,
          "aria-busy": save.isPending,
          maxLength: isTitle ? 255 : undefined,
        },
      }}
      onChange={(event) => {
        if (save.isSuccess) {
          save.reset();
        }
        const next = event.target.value;
        setDraft(isTitle ? next.replace(/[\r\n]+/g, " ") : next);
      }}
      onBlur={saveOnBlur}
      onKeyDown={handleKeyDown}
      sx={{
        p: 0,
        minWidth: 0,
        typography: isTitle ? "h6" : "body2",
        "& .MuiInputBase-input": { overflowWrap: "anywhere" },
      }}
    />
  );

  if (isTitle) {
    return (
      <Box sx={{ position: "relative" }}>
        {input}
        {indicator}
      </Box>
    );
  }

  return (
    <Stack spacing={0.5} sx={{ px: 2, mt: 2 }}>
      <Box sx={{ position: "relative" }}>
        <Typography component="label" htmlFor={inputId} variant="subtitle2">
          {t("tasks.note")}
        </Typography>
        {indicator}
      </Box>
      {input}
    </Stack>
  );
}
