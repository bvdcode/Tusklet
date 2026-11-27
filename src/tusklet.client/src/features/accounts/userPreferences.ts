import { createContext, useContext } from "react";
import type { LanguagePreference } from "../../shared/i18n/languagePreference";
import type { TaskGrouping, TaskSorting } from "../tasks/taskView";

export type UserPreferences = {
  language: LanguagePreference;
  taskGrouping: TaskGrouping;
  taskSorting: TaskSorting;
};

type PreferenceKey = keyof UserPreferences;

export type PreferenceChange = {
  [Key in PreferenceKey]: { key: Key; value: UserPreferences[Key] };
}[PreferenceKey];

export const UserPreferencesContext = createContext<{
  preferences: UserPreferences;
  changePreference: (change: PreferenceChange) => void;
  saveFailed: boolean;
  retry: () => void;
} | null>(null);

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (context === null) {
    throw new Error("User preferences require an authenticated session.");
  }
  return context;
}
