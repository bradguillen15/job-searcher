import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  root: "src/renderer",
  build: {
    outDir: "../../dist/renderer",
    emptyOutDir: true,
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["../../tests/renderer/**/*.test.tsx", "../../tests/renderer/**/*.test.ts"],
  },
});
