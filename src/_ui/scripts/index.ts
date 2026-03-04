/**
 * Main entry point for the global UI.
 * Handles theme initialization and global event listeners for audio activation.
 */
import AudioManager from "../../_core/audio";

import ThemeManager from "./theme";
import I18n from "./i18n";

ThemeManager.init();
void I18n.init().catch((error) => {
  console.error("[UI] Failed to initialize i18n:", error);
});

document.addEventListener(
  "click",
  () => {
    AudioManager.playMusic();
  },
  { once: true },
);

document.addEventListener(
  "keydown",
  () => {
    AudioManager.playMusic();
  },
  { once: true },
);

document.addEventListener("DOMContentLoaded", () => {
  const els = document.querySelectorAll("img, a") as NodeListOf<HTMLImageElement> | NodeListOf<HTMLAnchorElement>;

  els.forEach((e) => {
    e.draggable = false;
  });
});
