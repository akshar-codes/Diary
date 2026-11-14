import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      injectRegister: "auto",
      manifest: false, // Managed manually in public/manifest.json
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//, /^\/uploads\//],
        runtimeCaching: [
          // Public release metadata cache
          {
            urlPattern: /\/api\/v1\/releases\/.*/,
            handler: "NetworkFirst",
            options: {
              cacheName: "release-metadata-cache",
              networkTimeoutSeconds: 5,
              cacheableResponse: { statuses: [200] },
            },
          },
          // All private authenticated APIs: STRICTLY NetworkOnly (never cache private notes/diary in SW)
          {
            urlPattern:
              /\/api\/v1\/(auth|diary|notes|folders|users|attachments)\/.*/,
            handler: "NetworkOnly",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
