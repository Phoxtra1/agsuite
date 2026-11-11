import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: { overlay: false },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: null,
      devOptions: { enabled: false },
      filename: "sw.js",
      manifest: false,
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        globPatterns: [
          "**/*.{html,js,css,ico,png,svg,jpg,jpeg,webp,avif,gif,woff,woff2,ttf,json,webmanifest}",
        ],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/~oauth/, /^\/api\//],
        runtimeCaching: [
          {
            // Cache same-origin public images after first successful load.
            // API, authentication and user-specific responses are never cached here.
            urlPattern: ({ url, sameOrigin }: any) =>
              sameOrigin && /\.(?:png|svg|jpe?g|webp|avif|gif|ico)$/.test(url.pathname),
            handler: "CacheFirst",
            options: {
              cacheName: "amineva-public-images",
              expiration: { maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 60 },
            },
          },
          {
            // Public font files can be reused without a network connection.
            urlPattern: ({ request, url }: any) =>
              request.destination === "font" && (url.origin === self.location?.origin || /fonts\.(?:googleapis|gstatic)\.com$/.test(url.hostname)),
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "amineva-fonts",
              expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 180 },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
}));
