import { InputBase } from "@mui/material";
import { useLayoutEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

export default function TaskSearchField({
  id,
  active,
  value,
  onChange,
  onClose,
}: {
  id: string;
  active: boolean;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const input = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    if (active) {
      input.current?.focus();
    }
  }, [active]);

  return (
    <InputBase
      id={id}
      inputRef={input}
      autoComplete="off"
      type="search"
      fullWidth
      placeholder={t("tasks.search")}
      value={value}
      slotProps={{ input: { "aria-label": t("tasks.search") } }}
      sx={{
        px: 1,
        "& input::placeholder": { color: "text.secondary", opacity: 1 },
      }}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Escape" && !event.nativeEvent.isComposing) {
          event.preventDefault();
          onClose();
        }
      }}
    />
  );
}
