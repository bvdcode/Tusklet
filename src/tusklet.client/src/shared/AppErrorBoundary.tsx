import { Alert, Button, Container } from "@mui/material";
import { Component, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

function AppRenderError() {
  const { t } = useTranslation();

  return (
    <Container
      component="main"
      maxWidth="sm"
      sx={{ flex: 1, display: "grid", placeItems: "center" }}
    >
      <Alert
        severity="error"
        action={
          <Button color="inherit" onClick={() => window.location.reload()}>
            {t("common.reload")}
          </Button>
        }
      >
        {t("common.renderError")}
      </Alert>
    </Container>
  );
}

type State = { failed: boolean };

export default class AppErrorBoundary extends Component<
  { children: ReactNode },
  State
> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  render() {
    return this.state.failed ? <AppRenderError /> : this.props.children;
  }
}
