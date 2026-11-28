import { InputBase } from "@mui/material";
import { useLayoutEffect, type RefObject } from "react";
import { useTranslation } from "react-i18next";

export default function TaskSearchField({
  id,
  active,
  inputRef,
  value,
  onChange,
  onClose,
}: {
  id: string;
  active: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  useLayoutEffect(() => {
    if (active) {
      inputRef.current?.focus();
    }
  }, [active, inputRef]);

  return (
    <InputBase
      id={id}
      inputRef={inputRef}
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
