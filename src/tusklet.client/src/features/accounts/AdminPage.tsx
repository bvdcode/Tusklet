import {
  Alert,
  Button,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import ProviderForm from "./ProviderForm";
import {
  changeAccount,
  readOpenIdSettings,
  sessionKey,
  type OpenIdSettingsInput,
} from "./accountsApi";

const providerKey = ["openid-settings"];

export default function AdminPage({ requestToken }: { requestToken: string }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const settings = useQuery({
    queryKey: providerKey,
    queryFn: ({ signal }) => readOpenIdSettings(signal),
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const save = useMutation({
    mutationFn: (input: OpenIdSettingsInput) =>
      changeAccount("/api/admin/openid", requestToken, "PUT", input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: sessionKey }),
        queryClient.invalidateQueries({ queryKey: providerKey }),
      ]);
    },
  });

  return (
    <Paper
      component="section"
      aria-labelledby="provider-title"
      variant="outlined"
      sx={{ p: { xs: 2.5, sm: 3.5 } }}
    >
      <Stack spacing={2.5}>
        <Typography component="h1" variant="h6" id="provider-title">
          {t("auth.openId")}
        </Typography>
        {settings.isSuccess && (
          <ProviderForm
            settings={settings.data}
            isSaving={save.isPending}
            saveFailed={save.isError}
            saveSucceeded={save.isSuccess}
            onSave={save.mutate}
            onEdit={save.reset}
          />
        )}
        {!settings.isSuccess && (settings.isPending || settings.isFetching) && (
          <Stack role="status" aria-label={t("common.loading")} spacing={2}>
            <Skeleton variant="rounded" height={56} />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Skeleton
                variant="rounded"
                height={56}
                sx={{ flex: { sm: 1 } }}
              />
              <Skeleton
                variant="rounded"
                height={56}
                sx={{ flex: { sm: 1 } }}
              />
            </Stack>
            <Skeleton variant="rounded" height={80} />
            <Skeleton variant="rounded" height={48} />
          </Stack>
        )}
        {settings.isError && !settings.isFetching && (
          <Stack spacing={1.5}>
            <Alert severity="error">{t("provider.loadError")}</Alert>
            <Button
              variant="outlined"
              onClick={() => void settings.refetch()}
              sx={{ alignSelf: { xs: "stretch", sm: "flex-end" } }}
            >
              {t("common.retry")}
            </Button>
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
