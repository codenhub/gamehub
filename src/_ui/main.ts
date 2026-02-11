import AudioManager from "../_core/audio";

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
  const els = document.querySelectorAll("img, a") as
    | NodeListOf<HTMLImageElement>
    | NodeListOf<HTMLAnchorElement>;

  els.forEach((e) => {
    e.draggable = false;
  });
});
