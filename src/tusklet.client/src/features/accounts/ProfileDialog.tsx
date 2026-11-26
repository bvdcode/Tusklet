import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
  onClose: () => void;
};

export default function ProfileDialog({ session, user, onClose }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const accountAction = useMutation({
    mutationFn: (action: "unlink" | "logout") => {
      switch (action) {
        case "unlink":
          return changeAccount(
            "/api/auth/openid/link",
            session.requestToken,
            "DELETE",
          );
        case "logout":
          return changeAccount(
            "/api/auth/logout",
            session.requestToken,
            "POST",
          );
      }
    },
    onSuccess: async (_, action) => {
      if (action === "logout") {
        onClose();
      }
      await queryClient.invalidateQueries({ queryKey: sessionKey });
    },
  });

  return (
    <Dialog
      open
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      aria-labelledby="profile-title"
    >
      <DialogTitle id="profile-title">{user.username}</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Typography color="text.secondary">
            {t(
              user.openIdLinked
                ? "auth.linked"
                : session.openIdEnabled
                  ? "auth.notLinked"
                  : "auth.openIdDisabled",
            )}
          </Typography>
          {accountAction.isError && (
            <Alert severity="error">{t("auth.actionError")}</Alert>
          )}
          {user.openIdLinked && (
            <Button
              variant="outlined"
              onClick={() => accountAction.mutate("unlink")}
              disabled={accountAction.isPending}
            >
              {t("auth.unlinkOpenId")}
            </Button>
          )}
          {!user.openIdLinked && session.openIdEnabled && (
            <OpenIdButton action="link" requestToken={session.requestToken} />
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => accountAction.mutate("logout")}
          disabled={accountAction.isPending}
        >
          {t("auth.logout")}
        </Button>
        <Button onClick={onClose}>{t("common.close")}</Button>
      </DialogActions>
    </Dialog>
  );
}
