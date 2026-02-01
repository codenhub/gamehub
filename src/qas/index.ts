import AudioManager from "../_core/audio";

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("btn");
  AudioManager.loadSFX("collect");

  btn?.addEventListener("click", () => {
    AudioManager.playSFX("collect");
  });
});
