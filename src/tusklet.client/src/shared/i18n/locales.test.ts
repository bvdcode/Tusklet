import { expect, test } from "vitest";
import { languages } from "./languagePreference";
import en from "./locales/en.json";

type Dictionary = { [key: string]: string | Dictionary };

const dictionaries = import.meta.glob<Dictionary>("./locales/*.json", {
  eager: true,
  import: "default",
});

function flatten(dictionary: Dictionary, prefix = ""): [string, string][] {
  return Object.entries(dictionary).flatMap(([key, value]) => {
    const path = prefix + key;
    return typeof value === "string"
      ? [[path, value]]
      : flatten(value, `${path}.`);
  });
}

test.each(languages)(
  "%s includes the interface strings, placeholders and plural forms",
  (language) => {
    const source = new Map(flatten(en));
    const translated = new Map(
      flatten(dictionaries[`./locales/${language}.json`]),
    );
    const category = new Intl.PluralRules(language).resolvedOptions()
      .pluralCategories;
    for (const [key, text] of source) {
      const entry = translated.get(key);
      expect(entry, key).toBeTruthy();
      const placeholders = [...text.matchAll(/{{([^}]+)}}/g)].map(
        (match) => match[0],
      );
      for (const placeholder of placeholders) {
        expect(entry, key).toContain(placeholder);
      }
      if (key.endsWith("_other")) {
        for (const plural of category) {
          const pluralKey = `${key.slice(0, -"other".length)}${plural}`;
          expect(translated.get(pluralKey), pluralKey).toBeTruthy();
        }
      }
    }
  },
);
