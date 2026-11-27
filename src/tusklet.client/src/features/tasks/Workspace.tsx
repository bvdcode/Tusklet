import { Chip, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import TaskPreview from "./TaskPreview";

export default function Workspace() {
  const { t, i18n } = useTranslation();
  const today = new Intl.DateTimeFormat(i18n.resolvedLanguage, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <Stack spacing={3}>
      <Stack
        direction="row"
        sx={{
          alignItems: "flex-end",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1.5,
        }}
      >
        <Stack spacing={0.25}>
          <Typography variant="subtitle2" color="text.secondary">
            {today}
          </Typography>
          <Typography component="h1" variant="h3">
            {t("tasks.today")}
          </Typography>
        </Stack>
        <Chip label={t("tasks.preview")} variant="outlined" size="small" />
      </Stack>
      <TaskPreview />
    </Stack>
  );
}
