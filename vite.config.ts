import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    outDir: "js-dist",
    emptyOutDir: true,
    lib: {
      entry: {
        main: resolve(__dirname, "index.ts"),
        preload: resolve(__dirname, "src/preload/preload.ts"),
      },
      formats: ["cjs"],
      fileName: (format, name) => `${name}.${format}.js`,
    },
    rollupOptions: {
      external: ["electron", "electron-updater", "fs", "os", "path", "net"],
      output: {
        entryFileNames: "[name].js",
      },
    },
  },
});
