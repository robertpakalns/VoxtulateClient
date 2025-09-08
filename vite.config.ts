import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  root: "./",
  build: {
    outDir: "preload-dist",
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, "src/preload/preload.ts"),
      formats: ["cjs"],
    },
    rollupOptions: {
      external: ["electron", "discord-rpc", "fs", "path", "os"],
    },
  },
});
