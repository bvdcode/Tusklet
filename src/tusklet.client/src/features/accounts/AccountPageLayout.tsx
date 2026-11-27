import { Container } from "@mui/material";
import type { ReactNode } from "react";
import AccountHeader from "./AccountHeader";
import type { SessionStatus, SessionUser } from "./accountsApi";

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
        {children}
      </Container>
    </>
  );
}
