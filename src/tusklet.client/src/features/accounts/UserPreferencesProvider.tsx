import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLayoutEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  readLanguagePreference,
  rememberLanguagePreference,
  resolveLanguage,
} from "../../shared/i18n/languagePreference";
import {
  changeAccount,
  sessionKey,
  type SessionStatus,
  type SessionUser,
} from "./accountsApi";
import {
  UserPreferencesContext,
  type PreferenceChange,
  type UserPreferences,
} from "./userPreferences";

type PendingPreference = { change: PreferenceChange; failed: boolean };
type PendingPreferences = Partial<
  Record<PreferenceChange["key"], PendingPreference>
>;

export default function UserPreferencesProvider({
  user,
  children,
}: {
  user: SessionUser;
  children: ReactNode;
}) {
  const { i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [deviceLanguage] = useState(readLanguagePreference);
  const [pending, setPending] = useState<PendingPreferences>({});
  const session = queryClient.getQueryData<SessionStatus>(sessionKey);
  const preferences: UserPreferences = {
    language: deviceLanguage,
    taskGrouping: "none",
    taskSorting: "listOrder",
    taskDueDateShortcut: "none",
    ...(session?.user?.id === user.id ? session.user.preferences : undefined),
  };
  const updates = Object.values(pending);
  for (const { change } of updates) {
    Object.assign(preferences, { [change.key]: change.value });
  }
  const language = preferences.language;

  useLayoutEffect(() => {
    rememberLanguagePreference(language);
    void i18n.changeLanguage(resolveLanguage(language));
  }, [i18n, language]);

  const save = useMutation({
    scope: { id: `preferences-${user.id}` },
    retry: (failureCount, error) =>
      failureCount < 2 &&
      (error instanceof TypeError || /^5\d\d$/.test(error.message)),
    mutationFn: async (change: PreferenceChange) => {
      const session = queryClient.getQueryData<SessionStatus>(sessionKey);
      if (session?.user?.id === user.id) {
        await changeAccount(
          `/api/auth/preferences/${change.key}`,
          session.requestToken,
          "PUT",
          { value: change.value },
        );
      }
    },
    onSuccess: async (_, change) => {
      await queryClient.cancelQueries({ queryKey: sessionKey, exact: true });
      queryClient.setQueryData<SessionStatus>(sessionKey, (current) => {
        if (current?.user?.id !== user.id) {
          return current;
        }
        return {
          ...current,
          user: {
            ...current.user,
            preferences: {
              ...current.user.preferences,
              [change.key]: change.value,
            },
          },
        };
      });
      setPending((current) => {
        if (current[change.key]?.change !== change) {
          return current;
        }
        const next = { ...current };
        delete next[change.key];
        return next;
      });
    },
    onError: (_, change) => {
      setPending((current) =>
        current[change.key]?.change === change
          ? { ...current, [change.key]: { change, failed: true } }
          : current,
      );
    },
  });

  function changePreference(change: PreferenceChange) {
    setPending((current) => ({
      ...current,
      [change.key]: { change, failed: false },
    }));
    save.mutate(change);
  }

  const failed = updates.filter((update) => update.failed);

  return (
    <UserPreferencesContext
      value={{
        preferences,
        changePreference,
        saveFailed: failed.length > 0,
        retry: () => {
          for (const { change } of failed) {
            changePreference(change);
          }
        },
      }}
    >
      {children}
    </UserPreferencesContext>
  );
}
