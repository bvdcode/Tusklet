import type { UserPreferences } from "./userPreferences";

export type SessionUser = {
  id: string;
  username: string;
  isAdmin: boolean;
  openIdLinked: boolean;
  pictureUrl: string | null;
  preferences?: Partial<UserPreferences>;
};

export type SessionStatus = {
  setupRequired: boolean;
  openIdEnabled: boolean;
  user: SessionUser | null;
  requestToken: string;
};

export type OpenIdSettings = {
  issuer: string;
  clientId: string;
  callbackUrl: string;
  hasClientSecret: boolean;
  enabled: boolean;
};

export type OpenIdSettingsInput = Omit<OpenIdSettings, "hasClientSecret"> & {
  clientSecret: string | null;
};

export const sessionKey = ["session"];

export async function readSession(signal: AbortSignal): Promise<SessionStatus> {
  const response = await fetch("/api/auth/session", { signal });
  if (!response.ok) {
    throw new Error("session");
  }
  return response.json();
}

export async function readOpenIdSettings(
  signal: AbortSignal,
): Promise<OpenIdSettings | null> {
  const response = await fetch("/api/admin/openid", { signal });
  if (!response.ok) {
    throw new Error("openid");
  }
  return response.status === 204 ? null : response.json();
}

export async function changeAccount(
  path: string,
  requestToken: string,
  method: "POST" | "PUT" | "DELETE",
  input?: object,
): Promise<void> {
  const response = await fetch(path, {
    method,
    headers: {
      "X-CSRF-Token": requestToken,
      "Content-Type": "application/json",
    },
    body: input === undefined ? undefined : JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(String(response.status));
  }
}
