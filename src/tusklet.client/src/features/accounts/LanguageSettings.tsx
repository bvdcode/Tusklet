import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  isLanguagePreference,
  languages,
  nativeLanguageName,
  readLanguagePreference,
  rememberLanguagePreference,
  resolveLanguage,
} from "../../shared/i18n/languagePreference";
import PreferenceSelect from "./PreferenceSelect";

const nativeOptions = languages.map((language) => ({
  value: language,
  label: nativeLanguageName(language),
  language,
}));

export default function LanguageSettings() {
  const { t, i18n } = useTranslation();
  const [preference, setPreference] = useState(readLanguagePreference);

  return (
    <PreferenceSelect
      label={t("profile.language")}
      value={preference}
      options={[
        { value: "auto", label: t("profile.autoLanguage") },
        ...nativeOptions,
      ]}
      onChange={(value) => {
        if (isLanguagePreference(value)) {
          setPreference(value);
          rememberLanguagePreference(value);
          void i18n.changeLanguage(resolveLanguage(value));
        }
      }}
    />
  );
}
