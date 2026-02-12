import AudioManager from "../_core/audio";
import { showAlert } from "../_core/utils/alerts";

document.addEventListener("DOMContentLoaded", () => {
  const successBtn = document.getElementById("success-alert-btn");
  const errorBtn = document.getElementById("error-alert-btn");
  const warningBtn = document.getElementById("warning-alert-btn");
  const infoBtn = document.getElementById("info-alert-btn");

  successBtn?.addEventListener("click", () => {
    showAlert({ message: "Success!", type: "success" });
  });

  errorBtn?.addEventListener("click", () => {
    showAlert({ message: "Error!", type: "error" });
  });

  warningBtn?.addEventListener("click", () => {
    showAlert({ message: "Warning!", type: "warning" });
  });

  infoBtn?.addEventListener("click", () => {
    showAlert({ message: "Info!", type: "info" });
  });

  const playSfxBtn = document.getElementById("play-sfx-btn");
  const playMusicBtn = document.getElementById("play-music-btn");
  const pauseMusicBtn = document.getElementById("pause-music-btn");
  const resumeMusicBtn = document.getElementById("resume-music-btn");
  const changeMusicBtn = document.getElementById("change-music-btn");
  const musicTrackBtn = document.getElementById("track-music-btn");

  playSfxBtn?.addEventListener("click", () => {
    AudioManager.playSFX("collect").catch((err) => {
      console.warn("[QAS] Failed to play SFX:", err);
    });
  });

  playMusicBtn?.addEventListener("click", () => {
    AudioManager.playMusic("main-soundtrack").catch((err) => {
      console.warn("[QAS] Failed to play music:", err);
    });
  });

  pauseMusicBtn?.addEventListener("click", () => {
    AudioManager.pauseMusic();
  });

  resumeMusicBtn?.addEventListener("click", () => {
    AudioManager.resumeMusic().catch((err) => {
      console.warn("[QAS] Failed to resume music:", err);
    });
  });

  changeMusicBtn?.addEventListener("click", () => {
    AudioManager.changeMusic("frenetic-soundtrack");
  });

  musicTrackBtn?.addEventListener("click", () => {
    const track = AudioManager.getMusicTrack();
    showAlert({ message: `Current track: ${track}`, type: "info" });
  });
});
