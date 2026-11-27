import "@fontsource-variable/dm-sans";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./shared/i18n";
import theme from "./shared/theme";

const root = document.getElementById("root");
if (root === null) {
  throw new Error("Application root was not found.");
}

const queryClient = new QueryClient();

createRoot(root).render(
  <StrictMode>
    <ThemeProvider theme={theme} defaultMode="system" storageManager={null}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);
