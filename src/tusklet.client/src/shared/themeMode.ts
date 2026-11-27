export type ThemeMode = "system" | "light" | "dark";

export function isThemeMode(value: string | undefined): value is ThemeMode {
  return value === "system" || value === "light" || value === "dark";
}

export function readThemeMode(): ThemeMode {
  const mode = document.documentElement.dataset.themeMode;
  return isThemeMode(mode) ? mode : "system";
}

export function rememberThemeMode(mode: ThemeMode) {
  document.cookie = `tusklet-theme=${mode}; Path=/; Max-Age=31536000; SameSite=Lax`;
  document.documentElement.dataset.themeMode = mode;
}
