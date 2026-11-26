import {
  Alert,
  AppBar,
  Box,
  Button,
  CircularProgress,
  Container,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { readSession, sessionKey } from "./features/accounts/accountsApi";
import SignInForm from "./features/accounts/SignInForm";
import logo from "./shared/assets/tusklet.svg";

const ProfileDialog = lazy(() => import("./features/accounts/ProfileDialog"));
const ProviderDialog = lazy(() => import("./features/accounts/ProviderDialog"));
const Workspace = lazy(() => import("./features/tasks/Workspace"));

export default function App() {
  const { t } = useTranslation();
  const [dialog, setDialog] = useState<"profile" | "provider" | null>(null);
  const [openIdOutcome, setOpenIdOutcome] = useState(() =>
    new URLSearchParams(window.location.search).get("openid"),
  );
  const session = useQuery({
    queryKey: sessionKey,
    queryFn: ({ signal }) => readSession(signal),
    retry: false,
  });
  const user = session.data?.user;

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has("openid")) {
      url.searchParams.delete("openid");
      window.history.replaceState(null, "", url);
    }
  }, []);

  return (
    <>
      <AppBar
        position="static"
        color="inherit"
        elevation={0}
        sx={{
          bgcolor: "background.paper",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Container maxWidth="lg">
          <Toolbar
            disableGutters
            sx={{
              gap: 1.5,
              justifyContent: "space-between",
              flexWrap: "wrap",
              py: 1,
            }}
          >
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Box
                component="img"
                src={logo}
                alt=""
                sx={(theme) => ({
                  width: 38,
                  height: 38,
                  ...theme.applyStyles("dark", {
                    filter: "brightness(0) invert(1)",
                  }),
                })}
              />
              <Typography
                variant="h6"
                component="span"
                sx={{ fontWeight: 750 }}
              >
                {t("appName")}
              </Typography>
            </Stack>
            {user && (
              <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap" }}>
                <Button
                  sx={{ color: "text.primary" }}
                  onClick={() => setDialog("profile")}
                >
                  {t("auth.profile")}
                </Button>
                {user.isAdmin && (
                  <Button
                    sx={{ color: "text.primary" }}
                    onClick={() => setDialog("provider")}
                  >
                    {t("provider.title")}
                  </Button>
                )}
              </Stack>
            )}
          </Toolbar>
        </Container>
      </AppBar>
      <Box component="main" sx={{ py: { xs: 3, sm: 6 } }}>
        <Container maxWidth={user ? "lg" : "xs"}>
          {openIdOutcome === "failed" && (
            <Alert
              severity="error"
              onClose={() => setOpenIdOutcome(null)}
              sx={{ mb: 3 }}
            >
              {t("auth.openIdError")}
            </Alert>
          )}
          {openIdOutcome === "linked" && (
            <Alert
              severity="success"
              onClose={() => setOpenIdOutcome(null)}
              sx={{ mb: 3 }}
            >
              {t("auth.linked")}
            </Alert>
          )}
          {session.isPending && (
            <CircularProgress size={28} aria-label={t("common.loading")} />
          )}
          {session.isError && (
            <Alert
              severity="error"
              action={
                <Button color="inherit" onClick={() => void session.refetch()}>
                  {t("common.retry")}
                </Button>
              }
            >
              {t("auth.loadError")}
            </Alert>
          )}
          {session.data && !user && (
            <SignInForm
              key={String(session.data.setupRequired)}
              session={session.data}
            />
          )}
        </Container>
        {session.data && user && (
          <Suspense
            fallback={
              <CircularProgress size={28} aria-label={t("common.loading")} />
            }
          >
            <Workspace />
            {dialog === "profile" && (
              <ProfileDialog
                session={session.data}
                user={user}
                onClose={() => setDialog(null)}
              />
            )}
            {dialog === "provider" && user.isAdmin && (
              <ProviderDialog
                requestToken={session.data.requestToken}
                onClose={() => setDialog(null)}
              />
            )}
          </Suspense>
        )}
      </Box>
    </>
  );
}
