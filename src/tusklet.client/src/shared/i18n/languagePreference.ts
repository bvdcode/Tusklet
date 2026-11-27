export const languages = [
  "en",
  "ru",
  "es",
  "fr",
  "pt",
  "id",
  "zh-Hans",
  "hi",
  "bn",
  "ar",
  "ur",
] as const;

export type Language = (typeof languages)[number];
export type LanguagePreference = "auto" | Language;

const cookie = "tusklet-language";

export function isLanguagePreference(
  value: string,
): value is LanguagePreference {
  return value === "auto" || languages.some((language) => language === value);
}

export function readLanguagePreference(): LanguagePreference {
  const prefix = `${cookie}=`;
  const value = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length);
  return value && isLanguagePreference(value) ? value : "auto";
}

export function rememberLanguagePreference(preference: LanguagePreference) {
  document.cookie = `${cookie}=${preference}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function resolveLanguage(preference: LanguagePreference): Language {
  if (preference !== "auto") {
    return preference;
  }
  for (const preferred of navigator.languages) {
    const base = preferred.toLowerCase().split("-")[0];
    const language = languages.find(
      (candidate) => candidate.split("-")[0] === base,
    );
    if (language !== undefined) {
      return language;
    }
  }
  return "en";
}

export function nativeLanguageName(language: Language): string {
  const name =
    new Intl.DisplayNames(language, { type: "language" }).of(language) ??
    language;
  return name.charAt(0).toLocaleUpperCase(language) + name.slice(1);
}
