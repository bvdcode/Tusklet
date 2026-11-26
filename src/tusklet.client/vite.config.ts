import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import launchSettings from "../Tusklet.Server/Properties/launchSettings.json" with { type: "json" };

const apiAddress = launchSettings.profiles.http.applicationUrl;

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": apiAddress,
      "/health": apiAddress,
    },
  },
  test: {
    environment: "jsdom",
  },
});
