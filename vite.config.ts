import { readdirSync, existsSync } from "fs";
import path from "path";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

/**
 * Auto-discovers game entry points by scanning src/games/\*\/index.html.
 * New games are picked up automatically — no manual config changes needed.
 */
function discoverGameEntries(): Record<string, string> {
  const gamesDir = path.resolve(__dirname, "src/games");
  if (!existsSync(gamesDir)) return {};

  return Object.fromEntries(
    readdirSync(gamesDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((dir) => [dir.name, path.join("src/games", dir.name, "index.html")])
      .filter(([, filePath]) => existsSync(filePath)),
  );
}

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
        ...discoverGameEntries(),
      },
    },
  },
  plugins: [tailwindcss()],
});
