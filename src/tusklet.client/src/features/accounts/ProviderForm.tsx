import ContentCopyOutlined from "@mui/icons-material/ContentCopyOutlined";
import {
  Alert,
  Button,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Stack,
  Switch,
  TextField,
} from "@mui/material";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import type { OpenIdSettings, OpenIdSettingsInput } from "./accountsApi";

type Props = {
  settings: OpenIdSettings | null;
  isSaving: boolean;
  saveFailed: boolean;
  onSave: (input: OpenIdSettingsInput) => void;
  saveSucceeded: boolean;
  onEdit: () => void;
};

export default function ProviderForm({
  settings,
  isSaving,
  saveFailed,
  onSave,
  saveSucceeded,
  onEdit,
}: Props) {
  const { t } = useTranslation();
  const clientSecretInput = useRef<HTMLInputElement>(null);
  const callbackInput = useRef<HTMLInputElement>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );
  const callbackUrl = new URL(
    "/api/auth/openid/callback",
    window.location.origin,
  ).href;

  useEffect(() => {
    if (saveSucceeded && clientSecretInput.current) {
      clientSecretInput.current.value = "";
    }
  }, [saveSucceeded]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) {
      return;
    }
    const form = new FormData(event.currentTarget);
    onSave({
      issuer: String(form.get("issuer")).trim(),
      clientId: String(form.get("clientId")).trim(),
      clientSecret: String(form.get("clientSecret") ?? "") || null,
      callbackUrl: String(form.get("callbackUrl")).trim(),
      enabled: form.has("enabled"),
    });
  }

  async function copyCallback() {
    if (!callbackInput.current) {
      return;
    }
    try {
      await navigator.clipboard.writeText(callbackInput.current.value.trim());
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }

  return (
    <Stack
      component="form"
      spacing={2}
      onSubmit={submit}
      onChange={onEdit}
      aria-busy={isSaving}
    >
      {saveSucceeded && <Alert severity="success">{t("provider.saved")}</Alert>}
      {saveFailed && <Alert severity="error">{t("provider.saveError")}</Alert>}
      <TextField
        name="issuer"
        label={t("provider.issuer")}
        type="url"
        defaultValue={settings?.issuer}
        placeholder="https://id.example.com"
        required
        fullWidth
        disabled={isSaving}
      />
      <Stack
        direction="row"
        sx={{ flexDirection: { xs: "column", sm: "row" }, gap: 2 }}
      >
        <TextField
          name="clientId"
          label={t("provider.clientId")}
          defaultValue={settings?.clientId}
          required
          fullWidth
          disabled={isSaving}
        />
        <TextField
          name="clientSecret"
          inputRef={clientSecretInput}
          label={t("provider.clientSecret")}
          type="password"
          autoComplete="new-password"
          required={!settings?.hasClientSecret}
          helperText={
            settings?.hasClientSecret ? t("provider.secretStored") : undefined
          }
          fullWidth
          disabled={isSaving}
        />
      </Stack>
      <TextField
        name="callbackUrl"
        label={t("provider.callbackUrl")}
        type="url"
        inputRef={callbackInput}
        defaultValue={settings?.callbackUrl ?? callbackUrl}
        onChange={() => setCopyState("idle")}
        required
        fullWidth
        helperText={t(
          {
            idle: "provider.callbackHint",
            copied: "provider.callbackCopied",
            failed: "provider.callbackCopyFailed",
          }[copyState],
        )}
        slotProps={{
          formHelperText: { role: "status" },
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label={t("provider.copyCallback")}
                  title={t("provider.copyCallback")}
                  edge="end"
                  disabled={isSaving}
                  onClick={() => void copyCallback()}
                >
                  <ContentCopyOutlined fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
        disabled={isSaving}
      />
      <FormControlLabel
        control={
          <Switch name="enabled" defaultChecked={settings?.enabled ?? true} />
        }
        label={t("provider.enabled")}
        labelPlacement="start"
        disabled={isSaving}
        sx={{
          m: 0,
          px: 1.5,
          py: 0.5,
          border: 1,
          borderColor: "divider",
          borderRadius: 1,
          justifyContent: "space-between",
        }}
      />
      <Button
        type="submit"
        variant="contained"
        loading={isSaving}
        sx={{ alignSelf: { xs: "stretch", sm: "flex-end" } }}
      >
        {t("common.save")}
      </Button>
    </Stack>
  );
}
