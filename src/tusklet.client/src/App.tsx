import { AppBar, Container, Toolbar, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import CounterPanel from "./features/counter/CounterPanel";

export default function App() {
  const { t } = useTranslation();

  return (
    <>
      <AppBar
        position="static"
        color="inherit"
        elevation={0}
        sx={{ borderBottom: 1, borderColor: "divider" }}
      >
        <Container maxWidth="md">
          <Toolbar disableGutters>
            <Typography variant="h6" component="span">
              {t("appName")}
            </Typography>
          </Toolbar>
        </Container>
      </AppBar>
      <Container component="main" maxWidth="xs" sx={{ py: { xs: 4, sm: 8 } }}>
        <CounterPanel />
      </Container>
    </>
  );
}
