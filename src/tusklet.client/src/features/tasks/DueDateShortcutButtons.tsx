import { Chip, Stack } from "@mui/material";
import { useTranslation } from "react-i18next";
import {
  dueDateShortcuts,
  longDueDateShortcuts,
  type TaskDueDateShortcut,
} from "./taskDueDate";

export default function DueDateShortcutButtons({
  selected,
  disabled,
  onSelect,
}: {
  selected?: TaskDueDateShortcut;
  disabled: boolean;
  onSelect: (shortcut: TaskDueDateShortcut) => void;
}) {
  const { t } = useTranslation();

  return (
    <Stack spacing={0.5} useFlexGap sx={{ containerType: "inline-size" }}>
      {[dueDateShortcuts, longDueDateShortcuts].map((shortcuts) => (
        <Stack
          key={shortcuts[0]}
          direction="row"
          sx={{
            flexWrap: "wrap",
            gap: 0.5,
            "& .MuiChip-root": { flexGrow: 1 },
            "& .MuiChip-label": { px: { xs: 0.5, sm: 0.75 } },
            ...(shortcuts === dueDateShortcuts && {
              "@container (max-width: 247px)": {
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              },
            }),
          }}
        >
          {shortcuts.map((shortcut) => (
            <Chip
              key={shortcut}
              label={t(`tasks.dueDateShortcuts.${shortcut}`)}
              size="small"
              variant="outlined"
              aria-pressed={
                selected === undefined ? undefined : selected === shortcut
              }
              color={selected === shortcut ? "primary" : "default"}
              disabled={disabled}
              onClick={() => onSelect(shortcut)}
            />
          ))}
        </Stack>
      ))}
    </Stack>
  );
}
