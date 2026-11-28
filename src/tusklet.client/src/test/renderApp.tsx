import { ThemeProvider } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { VirtuosoMockContext } from "react-virtuoso";
import { vi } from "vitest";
import App from "../App";
import "../shared/i18n";
import NotificationProvider from "../shared/NotificationProvider";
import theme from "../shared/theme";

vi.mock("../features/tasks/TaskRealtimeProvider", () => ({
  default: ({ children }: { children: ReactNode }) => children,
}));

export function renderApp(path = "/") {
  const queryClient = new QueryClient();
  return render(
    <ThemeProvider theme={theme} defaultMode="system" storageManager={null}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[path]}>
          <VirtuosoMockContext.Provider
            value={{ viewportHeight: 640, itemHeight: 65 }}
          >
            <NotificationProvider>
              <App />
            </NotificationProvider>
          </VirtuosoMockContext.Provider>
        </MemoryRouter>
      </QueryClientProvider>
    </ThemeProvider>,
  );
}
