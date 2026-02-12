import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  root: "./src",
  publicDir: "./_public",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: "./src/index.html",
        geometricFall: "./src/geometric-fall/index.html",
        snake: "./src/snake/index.html",
        twentyFortyEight: "./src/2048/index.html",
      },
    },
  },
  plugins: [tailwindcss()],
});
