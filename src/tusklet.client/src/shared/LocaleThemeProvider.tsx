import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import rtlPlugin from "@mui/stylis-plugin-rtl";
import { useLayoutEffect, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { prefixer } from "stylis";
import theme, { rtlTheme } from "./theme";
import { readThemeMode } from "./themeMode";

const ltrCache = createCache({ key: "mui" });
const rtlCache = createCache({
  key: "muirtl",
  stylisPlugins: [prefixer, rtlPlugin],
});

export default function LocaleThemeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? i18n.language;
  const direction = i18n.dir(language);

  useLayoutEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
  }, [direction, language]);

  return (
    <CacheProvider value={direction === "rtl" ? rtlCache : ltrCache}>
      <ThemeProvider
        theme={direction === "rtl" ? rtlTheme : theme}
        defaultMode={readThemeMode()}
        storageManager={null}
        disableTransitionOnChange
      >
        <CssBaseline />
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
}
