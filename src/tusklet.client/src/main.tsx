import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./shared/i18n";

const root = document.getElementById("root");
if (root === null) {
  throw new Error("Application root was not found.");
}

const theme = createTheme({
  palette: {
    primary: { main: "#1d5b9b" },
    background: { default: "#f6f8fa" },
  },
});
const queryClient = new QueryClient();

createRoot(root).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);
