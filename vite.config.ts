import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: path.resolve(__dirname, "postcss.config.js"),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src/renderer"),
    },
  },
  root: "src/renderer",
  build: {
    outDir: "../../dist/renderer",
    emptyOutDir: true,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["../../tests/renderer/setup.ts"],
    include: ["../../tests/renderer/**/*.test.tsx", "../../tests/renderer/**/*.test.ts"],
  },
});
