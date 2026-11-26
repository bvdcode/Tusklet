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
  cssVariables: true,
  shape: { borderRadius: 10 },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: "#264CCF", contrastText: "#FFFFFF" },
        background: { default: "#F5F7FB", paper: "#FFFFFF" },
        text: { primary: "#17213A", secondary: "#59657B" },
        action: { selected: "#E9EEFF" },
        success: { main: "#216E4E" },
        warning: { main: "#8A5500" },
        error: { main: "#B83248" },
      },
    },
    dark: {
      palette: {
        primary: { main: "#94ABFF", contrastText: "#101521" },
        background: { default: "#101521", paper: "#191F2F" },
        text: { primary: "#F1F4FF", secondary: "#A8B3C9" },
        action: { selected: "#27345E" },
        success: { main: "#73D9AA" },
        warning: { main: "#FFC56C" },
        error: { main: "#FF9BAA" },
      },
    },
  },
  components: {
    MuiButton: { styleOverrides: { root: { textTransform: "none" } } },
  },
});
const queryClient = new QueryClient();

createRoot(root).render(
  <StrictMode>
    <ThemeProvider theme={theme} defaultMode="system" storageManager={null}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);
