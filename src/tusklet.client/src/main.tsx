import "@fontsource-variable/dm-sans";
import {
  onlineManager,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import AppErrorBoundary from "./shared/AppErrorBoundary";
import "./shared/i18n";
import LocaleThemeProvider from "./shared/LocaleThemeProvider";

const root = document.getElementById("root");
if (root === null) {
  throw new Error("Application root was not found.");
}

onlineManager.setOnline(navigator.onLine);
const queryClient = new QueryClient();

createRoot(root).render(
  <StrictMode>
    <LocaleThemeProvider>
      <AppErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </QueryClientProvider>
      </AppErrorBoundary>
    </LocaleThemeProvider>
  </StrictMode>,
);
