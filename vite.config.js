import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icons/icon-192.png", "icons/icon-512.png"],
      manifest: {
        name: "AURA — Music, your vibe",
        short_name: "AURA",
        description:
          "YouTube-powered music discovery app with a glassmorphism player UI.",
        theme_color: "#0a0912",
        background_color: "#0a0912",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "icons/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ]
      },
      workbox: {
        // Never cache API calls to the search backend or the YouTube
        // iframe/player scripts — only cache the app shell + static assets.
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/www\.youtube\.com\/iframe_api/,
            handler: "NetworkOnly"
          },
          {
            urlPattern: /^\/api\//,
            handler: "NetworkOnly"
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    // Proxy /api requests to a local serverless dev server during `npm run dev`.
    // Point this at wherever you run the functions in ./api locally
    // (e.g. `vercel dev` on port 3000). Safe to leave as-is if you deploy
    // the /api functions alongside the frontend on Vercel/Netlify.
    proxy: {
      "/api": {
        target: process.env.VITE_DEV_API_PROXY_TARGET || "http://localhost:3000",
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: "dist",
    sourcemap: false
  }
});
