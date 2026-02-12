import AudioManager from "../_core/audio";

document.addEventListener(
  "click",
  () => {
    AudioManager.playMusic().catch((err) => {
      console.warn("[UI] Failed to start music on click:", err);
    });
  },
  { once: true },
);

document.addEventListener(
  "keydown",
  () => {
    AudioManager.playMusic().catch((err) => {
      console.warn("[UI] Failed to start music on keydown:", err);
    });
  },
  { once: true },
);

document.addEventListener("DOMContentLoaded", () => {
  const els = document.querySelectorAll("img, a") as
    | NodeListOf<HTMLImageElement>
    | NodeListOf<HTMLAnchorElement>;

  els.forEach((e) => {
    e.draggable = false;
  });
});
