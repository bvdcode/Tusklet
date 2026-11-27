import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vitest/config";
import launchSettings from "../Tusklet.Server/Properties/launchSettings.json" with { type: "json" };

const apiAddress = launchSettings.profiles.http.applicationUrl;

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      injectRegister: false,
      workbox: {
        globPatterns: ["**/*.{css,html,js,png,svg,woff2}"],
        navigateFallbackAllowlist: [/^\/(?:profile\/?|admin\/?)?(?:\?|$)/],
      },
      manifest: {
        id: "/",
        name: "Tusklet",
        short_name: "Tusklet",
        description: "Organize tasks, lists, and due dates.",
        categories: ["productivity", "utilities"],
        lang: "en",
        scope: "/",
        start_url: "/",
        display: "standalone",
        background_color: "#F5F7FB",
        theme_color: "#264CCF",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
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
