import {
  Chip,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";

export default function TaskPreview() {
  const { t } = useTranslation();

  return (
    <Stack spacing={2} sx={{ minWidth: 0, flex: 1 }}>
      <Stack
        direction="row"
        spacing={2}
        sx={{ alignItems: "center", flexWrap: "wrap" }}
      >
        <Typography component="h1" variant="h4">
          {t("tasks.today")}
        </Typography>
        <Chip label={t("tasks.preview")} variant="outlined" size="small" />
      </Stack>
      <Paper variant="outlined" sx={{ borderRadius: 3 }}>
        <List disablePadding>
          <ListItem
            divider
            sx={{ gap: 1, flexWrap: "wrap", justifyContent: "space-between" }}
          >
            <ListItemText primary={t("tasks.first")} />
            <Chip
              label={t("tasks.completed")}
              color="success"
              variant="outlined"
              size="small"
            />
          </ListItem>
          <ListItem
            divider
            sx={{ gap: 1, flexWrap: "wrap", justifyContent: "space-between" }}
          >
            <ListItemText primary={t("tasks.second")} />
            <Chip
              label={t("tasks.important")}
              color="warning"
              variant="outlined"
              size="small"
            />
          </ListItem>
          <ListItem>
            <ListItemText primary={t("tasks.third")} />
          </ListItem>
        </List>
      </Paper>
    </Stack>
  );
}
