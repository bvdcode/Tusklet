import { Alert, Button, Container, Stack } from "@mui/material";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
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
  centerExpanded,
  expanded,
  children,
}: AccountPage & {
  actions?: ReactNode;
  center?: ReactNode;
  centerExpanded?: boolean;
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
        centerExpanded={centerExpanded}
      />
      <Container
        component="main"
        maxWidth={expanded ? false : "md"}
        sx={{
          flex: 1,
          minHeight: 0,
          py: actions ? { xs: 1.5, sm: 3, md: 2 } : { xs: 3, md: 5 },
          ...(expanded
            ? { display: "flex", flexDirection: "column", overflow: "hidden" }
            : {
                overflowY: "auto",
                scrollbarGutter: "stable both-edges",
                scrollbarWidth: "thin",
              }),
        }}
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
        {children}
      </Container>
    </Stack>
  );
}
