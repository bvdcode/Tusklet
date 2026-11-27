import { useTranslation } from "react-i18next";
import {
  isLanguagePreference,
  languages,
  nativeLanguageName,
} from "../../shared/i18n/languagePreference";
import PreferenceSelect from "./PreferenceSelect";
import { useUserPreferences } from "./userPreferences";

const nativeOptions = languages.map((language) => ({
  value: language,
  label: nativeLanguageName(language),
  language,
}));

export default function LanguageSettings() {
  const { t } = useTranslation();
  const { preferences, changePreference } = useUserPreferences();

  return (
    <PreferenceSelect
      label={t("profile.language")}
      value={preferences.language}
      options={[
        { value: "auto", label: t("profile.autoLanguage") },
        ...nativeOptions,
      ]}
      onChange={(value) => {
        if (isLanguagePreference(value)) {
          changePreference({ key: "language", value });
        }
      }}
    />
  );
}
