import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
} from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs from "dayjs";
import "dayjs/locale/ar";
import "dayjs/locale/bn";
import "dayjs/locale/es";
import "dayjs/locale/fr";
import "dayjs/locale/hi";
import "dayjs/locale/id";
import "dayjs/locale/pt";
import "dayjs/locale/ru";
import "dayjs/locale/ur";
import "dayjs/locale/zh-cn";
import { useId } from "react";
import { useTranslation } from "react-i18next";
import DueDateShortcutButtons from "./DueDateShortcutButtons";
import { getShortcutDate } from "./taskDueDate";

export default function TaskDueDateDialog({
  value,
  saving,
  failed,
  onSave,
  onClose,
}: {
  value: string | null;
  saving: boolean;
  failed: boolean;
  onSave: (date: string | null) => void;
  onClose: () => void;
}) {
  const { t, i18n } = useTranslation();
  const title = useId();
  const language =
    i18n.resolvedLanguage === "zh-Hans" ? "zh-cn" : i18n.resolvedLanguage;

  return (
    <Dialog
      open
      onClose={saving ? undefined : onClose}
      aria-labelledby={title}
      fullWidth
      maxWidth="xs"
      slotProps={{
        paper: {
          sx: {
            backgroundImage: "none",
            mx: { xs: 1, sm: 4 },
            width: { xs: "calc(100% - 16px)", sm: "100%" },
          },
        },
      }}
    >
      <DialogTitle id={title}>{t("tasks.dueDate")}</DialogTitle>
      <DialogContent sx={{ px: { xs: 1.5, sm: 3 } }}>
        <Stack spacing={1} useFlexGap>
          {failed && <Alert severity="error">{t("tasks.updateError")}</Alert>}
          <LocalizationProvider
            dateAdapter={AdapterDayjs}
            adapterLocale={language}
            localeText={{
              previousMonth: t("tasks.calendar.previousMonth"),
              nextMonth: t("tasks.calendar.nextMonth"),
              calendarViewSwitchingButtonAriaLabel: (view) => {
                switch (view) {
                  case "day":
                    return t("tasks.calendar.chooseYear");
                  case "month":
                  case "year":
                    return t("tasks.calendar.chooseDay");
                }
              },
            }}
          >
            <DateCalendar
              value={value ? dayjs(value) : null}
              views={["year", "day"]}
              openTo="day"
              disabled={saving}
              onChange={(date, selection) => {
                if (date && selection === "finish") {
                  onSave(date.format("YYYY-MM-DD"));
                }
              }}
              sx={{ maxWidth: "100%" }}
            />
          </LocalizationProvider>
          <DueDateShortcutButtons
            disabled={saving}
            onSelect={(shortcut) => onSave(getShortcutDate(shortcut))}
          />
        </Stack>
      </DialogContent>
      <DialogActions
        sx={{ justifyContent: value ? "space-between" : undefined }}
      >
        {value && (
          <Button disabled={saving} onClick={() => onSave(null)}>
            {t("tasks.clearDueDate")}
          </Button>
        )}
        <Button disabled={saving} onClick={onClose}>
          {t("common.cancel")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
