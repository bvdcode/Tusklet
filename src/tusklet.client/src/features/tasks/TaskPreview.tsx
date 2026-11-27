import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined";
import RadioButtonUnchecked from "@mui/icons-material/RadioButtonUnchecked";
import StarBorderRounded from "@mui/icons-material/StarBorderRounded";
import {
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";

export default function TaskPreview() {
  const { t } = useTranslation();

  return (
    <Stack spacing={3}>
      <Stack spacing={1.25}>
        <Typography component="h2" variant="subtitle1" id="open-tasks-title">
          {t("tasks.open")}
        </Typography>
        <Paper variant="outlined">
          <List disablePadding aria-labelledby="open-tasks-title">
            <ListItem
              divider
              sx={{ minHeight: 64, gap: 1, px: { xs: 1.5, sm: 2.5 } }}
            >
              <ListItemIcon sx={{ minWidth: 24, color: "text.secondary" }}>
                <RadioButtonUnchecked fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={t("tasks.second")} />
              <Chip
                icon={<StarBorderRounded />}
                label={t("tasks.important")}
                color="warning"
                variant="outlined"
                size="small"
              />
            </ListItem>
            <ListItem sx={{ minHeight: 64, gap: 1, px: { xs: 1.5, sm: 2.5 } }}>
              <ListItemIcon sx={{ minWidth: 24, color: "text.secondary" }}>
                <RadioButtonUnchecked fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={t("tasks.third")} />
            </ListItem>
          </List>
        </Paper>
      </Stack>
      <Stack spacing={1.25}>
        <Typography
          component="h2"
          variant="subtitle1"
          id="completed-tasks-title"
        >
          {t("tasks.completed")}
        </Typography>
        <Paper variant="outlined">
          <List disablePadding aria-labelledby="completed-tasks-title">
            <ListItem sx={{ minHeight: 64, gap: 1, px: { xs: 1.5, sm: 2.5 } }}>
              <ListItemIcon sx={{ minWidth: 24, color: "success.main" }}>
                <CheckCircleOutlined fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={t("tasks.first")}
                slotProps={{
                  primary: {
                    color: "text.secondary",
                    sx: { textDecoration: "line-through" },
                  },
                }}
              />
            </ListItem>
          </List>
        </Paper>
      </Stack>
    </Stack>
  );
}
