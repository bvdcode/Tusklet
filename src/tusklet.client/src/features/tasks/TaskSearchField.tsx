import { TextField } from "@mui/material";
import { useTranslation } from "react-i18next";

export default function TaskSearchField({
  id,
  value,
  onChange,
  onClose,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();

  return (
    <TextField
      id={id}
      autoFocus
      autoComplete="off"
      type="search"
      size="small"
      fullWidth
      placeholder={t("tasks.search")}
      value={value}
      slotProps={{ htmlInput: { "aria-label": t("tasks.search") } }}
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
