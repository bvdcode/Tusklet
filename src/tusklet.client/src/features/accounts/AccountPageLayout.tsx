import { Alert, Box, Button, Container, Stack } from "@mui/material";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { pageMaxWidth, pagePadding } from "../../shared/pageLayout";
import AccountHeader from "./AccountHeader";
import type { SessionStatus, SessionUser } from "./accountsApi";
import { useUserPreferences } from "./userPreferences";

export type AccountPage = {
  session: SessionStatus;
  user: SessionUser;
  onLogout: () => void;
  notice: ReactNode;
};

export default function AccountPageLayout({
  session,
  user,
  onLogout,
  notice,
  actions,
  center,
  expanded,
  children,
}: AccountPage & {
  actions?: ReactNode;
  center?: ReactNode;
  expanded?: boolean;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const { saveFailed, retry } = useUserPreferences();

  return (
    <Stack sx={{ position: "fixed", inset: 0 }}>
      <AccountHeader
        session={session}
        user={user}
        onLogout={onLogout}
        actions={actions}
        center={center}
      />
      <Container
        component="main"
        maxWidth={expanded ? false : pageMaxWidth}
        sx={{
          flex: 1,
          minHeight: 0,
          p: expanded ? { ...pagePadding, xs: 0 } : pagePadding,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {(notice || saveFailed) && (
          <Box
            sx={
              expanded
                ? {
                    px: { xs: pagePadding.xs, sm: 0 },
                    pt: { xs: pagePadding.xs, sm: 0 },
                  }
                : undefined
            }
          >
            {notice}
            {saveFailed && (
              <Alert
                severity="error"
                sx={{ mb: 2 }}
                action={
                  <Button color="inherit" onClick={retry}>
                    {t("common.retry")}
                  </Button>
                }
              >
                {t("profile.preferencesSaveError")}
              </Alert>
            )}
          </Box>
        )}
        {children}
      </Container>
    </Stack>
  );
}
