import { Alert, Box, Button, Container, Skeleton, Stack } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, Route, Routes, useSearchParams } from "react-router-dom";
import { readSession, sessionKey } from "./features/accounts/accountsApi";
import AccountHeader from "./features/accounts/AccountHeader";
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
    openIdOutcome === "failed" || openIdOutcome === "linked" ? (
      <Alert
        severity={openIdOutcome === "failed" ? "error" : "success"}
        onClose={() => setOpenIdOutcome(null)}
        sx={{ mb: 2.5 }}
      >
        {t(openIdOutcome === "failed" ? "auth.openIdError" : "auth.linked")}
      </Alert>
    ) : null;

  if (session.data?.user) {
    const { user, requestToken } = session.data;
    return (
      <>
        <AccountHeader
          session={session.data}
          user={user}
          onLogout={() => setOpenIdOutcome(null)}
        />
        <Container component="main" maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
          {notice}
          <Suspense
            fallback={
              <Box role="status" aria-label={t("common.loading")}>
                <Skeleton variant="text" width="32%" height={52} />
                <Skeleton variant="rounded" height={240} />
              </Box>
            }
          >
            <Routes>
              <Route path="/" element={<Workspace />} />
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
            </Routes>
          </Suspense>
        </Container>
      </>
    );
  }

  return (
    <AccountLayout>
      {notice}
      {session.isPending && (
        <Stack role="status" aria-label={t("common.loading")} spacing={2}>
          <Skeleton variant="text" width="58%" height={52} />
          <Skeleton variant="rounded" height={56} />
          <Skeleton variant="rounded" height={56} />
          <Skeleton variant="rounded" height={48} />
        </Stack>
      )}
      {session.isError && (
        <Stack spacing={2}>
          <Alert severity="error">{t("auth.loadError")}</Alert>
          <Button variant="outlined" onClick={() => void session.refetch()}>
            {t("common.retry")}
          </Button>
        </Stack>
      )}
      {session.data && (
        <SignInForm
          key={String(session.data.setupRequired)}
          session={session.data}
        />
      )}
    </AccountLayout>
  );
}
