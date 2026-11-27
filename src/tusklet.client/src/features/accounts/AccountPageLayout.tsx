import { Alert, Button, Container } from "@mui/material";
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
  expanded,
  children,
}: AccountPage & {
  actions?: ReactNode;
  expanded?: boolean;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const { saveFailed, retry } = useUserPreferences();

  return (
    <>
      <AccountHeader
        session={session}
        user={user}
        onLogout={onLogout}
        actions={actions}
      />
      <Container
        component="main"
        maxWidth={expanded ? "lg" : "md"}
        sx={{ py: actions ? { xs: 1.5, md: 2 } : { xs: 3, md: 5 } }}
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
    </>
  );
}
