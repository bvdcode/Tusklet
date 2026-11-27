import {
  Alert,
  Button,
  CircularProgress,
  Container,
  Stack,
} from "@mui/material";
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
    return (
      <Container
        component="main"
        maxWidth="sm"
        sx={{ flex: 1, display: "grid", placeItems: "center" }}
      >
        {session.isError ? (
          <Stack spacing={2}>
            <Alert severity="error">{t("auth.loadError")}</Alert>
            <Button variant="outlined" onClick={() => void session.refetch()}>
              {t("common.retry")}
            </Button>
          </Stack>
        ) : (
          <CircularProgress size={28} aria-label={t("common.loading")} />
        )}
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
      <Suspense
        fallback={
          <AccountPageLayout {...account}>
            <CircularProgress size={24} aria-label={t("common.loading")} />
          </AccountPageLayout>
        }
      >
        <Routes>
          <Route path="/" element={<Workspace key={user.id} {...account} />} />
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
                  <Navigate to="/" replace />
                )
              }
            />
          </Route>
        </Routes>
      </Suspense>
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
