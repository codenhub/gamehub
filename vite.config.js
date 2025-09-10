import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  root: "./src",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: "./src/index.html",
        geometricFall: "./src/geometric-fall/index.html",
      },
    },
  },
  plugins: [tailwindcss()],
});
