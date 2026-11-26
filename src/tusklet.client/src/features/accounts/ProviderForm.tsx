import {
  Alert,
  Button,
  DialogActions,
  DialogContent,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
} from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import {
  changeAccount,
  type OpenIdSettings,
  type OpenIdSettingsInput,
  sessionKey,
} from "./accountsApi";

type Props = {
  settings: OpenIdSettings | null;
  requestToken: string;
  onClose: () => void;
};

export default function ProviderForm({
  settings,
  requestToken,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const save = useMutation({
    mutationFn: (form: FormData) => {
      const input: OpenIdSettingsInput = {
        issuer: String(form.get("issuer")).trim(),
        clientId: String(form.get("clientId")).trim(),
        clientSecret: String(form.get("clientSecret") ?? "") || null,
        callbackUrl: String(form.get("callbackUrl")).trim(),
        enabled: form.has("enabled"),
      };
      return changeAccount("/api/admin/openid", requestToken, "PUT", input);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: sessionKey });
      onClose();
    },
  });
  const callbackUrl = new URL(
    "/api/auth/openid/callback",
    window.location.origin,
  ).href;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    save.mutate(new FormData(event.currentTarget));
  }

  return (
    <form onSubmit={submit}>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {save.isError && (
            <Alert severity="error">{t("provider.saveError")}</Alert>
          )}
          <TextField
            name="issuer"
            label={t("provider.issuer")}
            type="url"
            defaultValue={settings?.issuer}
            placeholder="https://id.example.com"
            required
            fullWidth
          />
          <TextField
            name="clientId"
            label={t("provider.clientId")}
            defaultValue={settings?.clientId}
            required
            fullWidth
          />
          <TextField
            name="clientSecret"
            label={t("provider.clientSecret")}
            type="password"
            autoComplete="new-password"
            required={!settings?.hasClientSecret}
            helperText={
              settings?.hasClientSecret ? t("provider.secretStored") : undefined
            }
            fullWidth
          />
          <TextField
            name="callbackUrl"
            label={t("provider.callbackUrl")}
            type="url"
            defaultValue={settings?.callbackUrl ?? callbackUrl}
            required
            fullWidth
            helperText={t("provider.callbackHint")}
          />
          <FormControlLabel
            control={
              <Switch
                name="enabled"
                defaultChecked={settings?.enabled ?? true}
              />
            }
            label={t("provider.enabled")}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("common.close")}</Button>
        <Button type="submit" variant="contained" loading={save.isPending}>
          {t("common.save")}
        </Button>
      </DialogActions>
    </form>
  );
}
