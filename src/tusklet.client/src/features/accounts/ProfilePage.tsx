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
import OpenIdButton from "./OpenIdButton";
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
    <Stack spacing={3}>
      <Typography component="h1" variant="h3">
        {t("auth.profile")}
      </Typography>
      <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 3.5 } }}>
        <Stack spacing={3}>
          <Stack direction="row" sx={{ alignItems: "center", gap: 1.5 }}>
            <Avatar
              sx={{ width: 54, height: 54, fontSize: "1.3rem" }}
              aria-hidden="true"
            >
              {Array.from(user.username)[0]?.toLocaleUpperCase()}
            </Avatar>
            <Stack sx={{ minWidth: 0 }}>
              <Typography variant="h6" sx={{ overflowWrap: "anywhere" }}>
                {user.username}
              </Typography>
              {user.isAdmin && (
                <Typography variant="body2" color="text.secondary">
                  {t("auth.adminRole")}
                </Typography>
              )}
            </Stack>
          </Stack>
          <Divider />
          <Stack spacing={1.25}>
            <Typography component="h2" variant="h6">
              {t("auth.openId")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t(
                user.openIdLinked
                  ? "auth.linked"
                  : session.openIdEnabled
                    ? "auth.notLinked"
                    : "auth.openIdDisabled",
              )}
            </Typography>
            {unlink.isError && (
              <Alert severity="error">{t("auth.unlinkError")}</Alert>
            )}
            {user.openIdLinked && (
              <Button
                variant="outlined"
                onClick={() => unlink.mutate()}
                loading={unlink.isPending}
                sx={{ alignSelf: "flex-start" }}
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
        </Stack>
      </Paper>
    </Stack>
  );
}
