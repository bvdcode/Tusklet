import { Chip, Container, Paper, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import TaskPreview from "./TaskPreview";

export default function Workspace() {
  const { t } = useTranslation();

  return (
    <Container maxWidth="lg">
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={{ xs: 3, md: 4 }}
        sx={{ alignItems: { md: "flex-start" } }}
      >
        <Paper
          variant="outlined"
          component="aside"
          sx={{ p: 2, borderRadius: 3, width: { md: 220 } }}
        >
          <Stack spacing={1.25}>
            <Typography variant="subtitle2" color="text.secondary">
              {t("tasks.lists")}
            </Typography>
            <Chip
              label={t("tasks.today")}
              sx={{
                alignSelf: "flex-start",
                color: "primary.main",
                bgcolor: "action.selected",
              }}
            />
          </Stack>
        </Paper>
        <TaskPreview />
      </Stack>
    </Container>
  );
}
