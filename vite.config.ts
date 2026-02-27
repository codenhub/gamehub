import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  root: "./src",
  publicDir: "./_public",
  cacheDir: "../node_modules/.vite",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: "./src/index.html",
        geometricFall: "./src/games/geometric-fall/index.html",
        snake: "./src/games/snake/index.html",
        2048: "./src/games/2048/index.html",
      },
    },
  },
  plugins: [tailwindcss()],
});
