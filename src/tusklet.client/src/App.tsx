import { Alert, Button, Container, Stack } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense, useEffect, useState } from "react";
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
import SignInForm from "./features/accounts/SignInForm";
import UserPreferencesProvider from "./features/accounts/UserPreferencesProvider";
import PageProgress from "./shared/PageProgress";

const Workspace = lazy(() => import("./features/tasks/Workspace"));
const ProfilePage = lazy(() => import("./features/accounts/ProfilePage"));
const AdminPage = lazy(() => import("./features/accounts/AdminPage"));

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
        <Suspense fallback={<PageProgress />}>
          <Routes>
            <Route path="/" element={<Workspace {...account} />} />
            <Route
              element={
                <AccountPageLayout {...account}>
                  <Suspense fallback={<PageProgress />}>
                    <Outlet />
                  </Suspense>
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
                    <Navigate to="/" replace />
                  )
                }
              />
            </Route>
          </Routes>
        </Suspense>
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
