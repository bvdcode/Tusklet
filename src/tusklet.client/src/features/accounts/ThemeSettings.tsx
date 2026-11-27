import {
  FormControl,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { useColorScheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { isThemeMode, rememberThemeMode } from "../../shared/themeMode";

export default function ThemeSettings() {
  const { t } = useTranslation();
  const { mode, setMode } = useColorScheme();

  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      sx={{
        alignItems: { sm: "center" },
        justifyContent: "space-between",
        gap: 1.5,
      }}
    >
      <Typography component="h2" variant="h6" id="profile-theme-label">
        {t("profile.theme")}
      </Typography>
      <FormControl size="small" sx={{ width: { xs: "100%", sm: 184 } }}>
        <Select
          labelId="profile-theme-label"
          value={mode ?? "system"}
          onChange={({ target }) => {
            if (isThemeMode(target.value)) {
              rememberThemeMode(target.value);
              setMode(target.value);
            }
          }}
        >
          <MenuItem value="system">{t("profile.systemTheme")}</MenuItem>
          <MenuItem value="light">{t("profile.lightTheme")}</MenuItem>
          <MenuItem value="dark">{t("profile.darkTheme")}</MenuItem>
        </Select>
      </FormControl>
    </Stack>
  );
}
