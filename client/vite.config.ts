import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    TanStackRouterVite({ target: "react", autoCodeSplitting: true }),
    react({
      babel: {
        plugins: ["babel-plugin-react-compiler"],
      },
    }),
  ],
  optimizeDeps: {
    force: true,
  },
  server: {
    open: "/",
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, "/api"),
      },
    },
  },
  build: {
    sourcemap: mode === "development",
    outDir: "../server/static",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        compact: true,
        manualChunks: {
          react: ["react", "react-dom"],
          tanstack: [
            "@tanstack/react-router",
            "@tanstack/react-query",
            "@tanstack/react-form",
          ],
          mantine_core: ["@mantine/core"],
          mantine_hooks: ["@mantine/hooks"],
          mantine_codehighlight: ["@mantine/code-highlight"],
          mantine_notifactions: ["@mantine/notifications"],
          mantine_modals: ["@mantine/modals"],
          mantine_dates: ["@mantine/dates"],
          mantine_spotlight: ["@mantine/spotlight"],
          tabler_icons: ["@tabler/icons-react"],
          zustand: ["zustand"],
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
