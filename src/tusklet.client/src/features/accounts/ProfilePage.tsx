import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined";
import {
  Alert,
  Avatar,
  Button,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import LanguageSettings from "./LanguageSettings";
import OpenIdButton from "./OpenIdButton";
import TaskImportSettings from "./TaskImportSettings";
import ThemeSettings from "./ThemeSettings";
import {
  changeAccount,
  type SessionStatus,
  type SessionUser,
  sessionKey,
} from "./accountsApi";

type Props = {
  session: SessionStatus;
  user: SessionUser;
};

export default function ProfilePage({ session, user }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [redirecting, setRedirecting] = useState(false);

  const unlink = useMutation({
    mutationFn: () =>
      changeAccount("/api/auth/openid/link", session.requestToken, "DELETE"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionKey }),
  });

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3.5 } }}>
      <Stack spacing={3}>
        <Stack
          direction="row"
          sx={{ alignItems: "center", justifyContent: "space-between", gap: 2 }}
        >
          <Stack
            direction="row"
            sx={{ alignItems: "center", gap: 1.5, minWidth: 0 }}
          >
            <Avatar
              src={user.pictureUrl ?? undefined}
              slotProps={{ img: { alt: "", referrerPolicy: "no-referrer" } }}
              sx={{ width: 54, height: 54, fontSize: "1.3rem", flexShrink: 0 }}
              aria-hidden="true"
            >
              {Array.from(user.username)[0]?.toLocaleUpperCase()}
            </Avatar>
            <Typography
              component="h1"
              variant="h6"
              sx={{ overflowWrap: "anywhere" }}
            >
              {user.username}
            </Typography>
          </Stack>
          {user.isAdmin && (
            <Typography variant="body2" color="text.secondary">
              {t("auth.adminRole")}
            </Typography>
          )}
        </Stack>
        <Divider />
        <Stack
          direction={{ xs: "column", sm: "row" }}
          sx={{
            alignItems: { sm: "center" },
            justifyContent: "space-between",
            gap: 1.5,
          }}
        >
          <Stack spacing={0.5}>
            <Stack direction="row" sx={{ alignItems: "center", gap: 0.75 }}>
              <Typography component="h2" variant="h6">
                {t("auth.openId")}
              </Typography>
              {user.openIdLinked && (
                <CheckCircleOutlined
                  color="success"
                  fontSize="small"
                  titleAccess={t("auth.linked")}
                />
              )}
            </Stack>
            {!user.openIdLinked && (
              <Typography variant="body2" color="text.secondary">
                {t(
                  session.openIdEnabled
                    ? "auth.notLinked"
                    : "auth.openIdDisabled",
                )}
              </Typography>
            )}
          </Stack>
          {user.openIdLinked && (
            <Button
              variant="outlined"
              onClick={() => unlink.mutate()}
              loading={unlink.isPending}
            >
              {t("auth.unlinkOpenId")}
            </Button>
          )}
          {!user.openIdLinked && session.openIdEnabled && (
            <OpenIdButton
              action="link"
              requestToken={session.requestToken}
              redirecting={redirecting}
              setRedirecting={setRedirecting}
              disabled={false}
            />
          )}
        </Stack>
        {unlink.isError && (
          <Alert severity="error">{t("auth.unlinkError")}</Alert>
        )}
        <Divider />
        <ThemeSettings />
        <Divider />
        <LanguageSettings />
        <Divider />
        <TaskImportSettings requestToken={session.requestToken} />
      </Stack>
    </Paper>
  );
}
