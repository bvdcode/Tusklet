import { ThemeProvider } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../App";
import "../shared/i18n";
import theme from "../shared/theme";

export function renderApp(path = "/") {
  const queryClient = new QueryClient();
  return render(
    <ThemeProvider theme={theme} defaultMode="system" storageManager={null}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[path]}>
          <App />
        </MemoryRouter>
      </QueryClientProvider>
    </ThemeProvider>,
  );
}
