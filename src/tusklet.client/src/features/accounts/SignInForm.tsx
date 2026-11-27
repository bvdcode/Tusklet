import {
  Alert,
  Button,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import OpenIdButton from "./OpenIdButton";
import { changeAccount, type SessionStatus, sessionKey } from "./accountsApi";

type Props = {
  session: SessionStatus;
};

export default function SignInForm({ session }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { setupRequired, requestToken, openIdEnabled } = session;
  const [redirecting, setRedirecting] = useState(false);

  const signIn = useMutation({
    mutationFn: (form: FormData) => {
      const input = {
        username: String(form.get("username")).trim(),
        password: String(form.get("password")),
      };
      const path = setupRequired ? "/api/auth/setup" : "/api/auth/login";
      return changeAccount(path, requestToken, "POST", input);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: sessionKey }),
  });
  const busy = signIn.isPending || redirecting;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!busy) {
      signIn.mutate(new FormData(event.currentTarget));
    }
  }

  return (
    <Stack spacing={3}>
      <Typography component="h1" variant="h4">
        {t(setupRequired ? "auth.setupTitle" : "auth.loginTitle")}
      </Typography>
      {signIn.isError && (
        <Alert severity="error">
          {t(
            signIn.error.message === "429"
              ? "auth.rateLimited"
              : setupRequired
                ? "auth.setupError"
                : "auth.loginError",
          )}
        </Alert>
      )}
      <Stack
        component="form"
        aria-busy={signIn.isPending}
        onSubmit={submit}
        spacing={2}
      >
        <TextField
          name="username"
          label={t("auth.username")}
          autoComplete="username"
          disabled={busy}
          slotProps={{
            htmlInput: { maxLength: 64, minLength: setupRequired ? 3 : 1 },
          }}
          required
          fullWidth
        />
        <TextField
          name="password"
          label={t("auth.password")}
          type="password"
          autoComplete={setupRequired ? "new-password" : "current-password"}
          disabled={busy}
          slotProps={{
            htmlInput: { maxLength: 128, minLength: setupRequired ? 12 : 1 },
          }}
          helperText={setupRequired ? t("auth.passwordHint") : undefined}
          required
          fullWidth
        />
        <Button
          type="submit"
          variant="contained"
          size="large"
          loading={signIn.isPending}
          disabled={redirecting}
        >
          {t(setupRequired ? "auth.setupAction" : "auth.loginAction")}
        </Button>
      </Stack>
      {!setupRequired && openIdEnabled && (
        <Stack spacing={2}>
          <Divider />
          <OpenIdButton
            action="login"
            requestToken={requestToken}
            redirecting={redirecting}
            setRedirecting={setRedirecting}
            disabled={signIn.isPending}
          />
        </Stack>
      )}
    </Stack>
  );
}
