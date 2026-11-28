import { Alert, Button, Container, Stack } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useSearchParams,
} from "react-router-dom";
import { readSession, sessionKey } from "./features/accounts/accountsApi";
import AccountPageLayout from "./features/accounts/AccountPageLayout";
import AccountLayout from "./features/accounts/AccountLayout";
import AdminPage from "./features/accounts/AdminPage";
import ProfilePage from "./features/accounts/ProfilePage";
import SignInForm from "./features/accounts/SignInForm";
import UserPreferencesProvider from "./features/accounts/UserPreferencesProvider";
import { tasksPath } from "./features/tasks/taskRoutes";
import Workspace from "./features/tasks/Workspace";
import PageProgress from "./shared/PageProgress";

export default function App() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [openIdOutcome, setOpenIdOutcome] = useState(() =>
    searchParams.get("openid"),
  );
  const session = useQuery({
    queryKey: sessionKey,
    queryFn: ({ signal }) => readSession(signal),
    retry: false,
    networkMode: "always",
    refetchOnReconnect: true,
  });

  useEffect(() => {
    if (searchParams.has("openid")) {
      const next = new URLSearchParams(searchParams);
      next.delete("openid");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const notice =
    openIdOutcome === "failed" ? (
      <Alert
        severity="error"
        onClose={() => setOpenIdOutcome(null)}
        sx={{ mb: 2.5 }}
      >
        {t("auth.openIdError")}
      </Alert>
    ) : null;

  if (!session.data) {
    if (!session.isError) {
      return <PageProgress />;
    }

    return (
      <Container
        component="main"
        maxWidth="sm"
        sx={{ flex: 1, display: "grid", placeItems: "center" }}
      >
        <Stack spacing={2}>
          <Alert severity="error">{t("auth.loadError")}</Alert>
          <Button variant="outlined" onClick={() => void session.refetch()}>
            {t("common.retry")}
          </Button>
        </Stack>
      </Container>
    );
  }

  if (session.data.user) {
    const { user, requestToken } = session.data;
    const account = {
      session: session.data,
      user,
      notice,
      onLogout: () => setOpenIdOutcome(null),
    };
    return (
      <UserPreferencesProvider key={user.id} user={user}>
        <Routes>
          <Route path="/" element={<Navigate to={tasksPath} replace />} />
          <Route
            path={`${tasksPath}/:taskId?`}
            element={<Workspace {...account} />}
          />
          <Route
            element={
              <AccountPageLayout {...account}>
                <Outlet />
              </AccountPageLayout>
            }
          >
            <Route
              path="/profile"
              element={<ProfilePage session={session.data} user={user} />}
            />
            <Route
              path="/admin"
              element={
                user.isAdmin ? (
                  <AdminPage requestToken={requestToken} />
                ) : (
                  <Navigate to={tasksPath} replace />
                )
              }
            />
          </Route>
        </Routes>
      </UserPreferencesProvider>
    );
  }

  return (
    <AccountLayout>
      {notice}
      <SignInForm
        key={String(session.data.setupRequired)}
        session={session.data}
      />
    </AccountLayout>
  );
}
