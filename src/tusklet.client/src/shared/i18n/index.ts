import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import type en from "./locales/en.json";
import {
  languages,
  readLanguagePreference,
  resolveLanguage,
} from "./languagePreference";

const dictionaries = import.meta.glob<typeof en>("./locales/*.json", {
  eager: true,
  import: "default",
});
const resources = Object.fromEntries(
  languages.map((language) => [
    language,
    {
      translation: dictionaries[`./locales/${language}.json`],
    },
  ]),
);

await i18n.use(initReactI18next).init({
  lng: resolveLanguage(readLanguagePreference()),
  fallbackLng: "en",
  supportedLngs: [...languages],
  resources,
  interpolation: { escapeValue: false },
});

window.addEventListener("languagechange", () => {
  if (readLanguagePreference() === "auto") {
    void i18n.changeLanguage(resolveLanguage("auto"));
  }
});

export default i18n;
