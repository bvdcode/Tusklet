import { useColorScheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { isThemeMode, rememberThemeMode } from "../../shared/themeMode";
import PreferenceSelect from "./PreferenceSelect";

export default function ThemeSettings() {
  const { t } = useTranslation();
  const { mode, setMode } = useColorScheme();

  return (
    <PreferenceSelect
      label={t("profile.theme")}
      value={mode ?? "system"}
      options={[
        { value: "system", label: t("profile.systemTheme") },
        { value: "light", label: t("profile.lightTheme") },
        { value: "dark", label: t("profile.darkTheme") },
      ]}
      onChange={(value) => {
        if (isThemeMode(value)) {
          rememberThemeMode(value);
          setMode(value);
        }
      }}
    />
  );
}
