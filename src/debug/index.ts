import AudioManager from "../_core/audio";
import { showAlert } from "../_ui/scripts/alert";

/**
 * Entry point for the QA/Support page.
 * Provides manual triggers for alerts and audio to verify functionality.
 */
document.addEventListener("DOMContentLoaded", () => {
  const successBtn = document.getElementById("success-alert-btn");
  const errorBtn = document.getElementById("error-alert-btn");
  const warningBtn = document.getElementById("warning-alert-btn");
  const infoBtn = document.getElementById("info-alert-btn");

  successBtn?.addEventListener("click", () => {
    showAlert({ message: "Success!", type: "success", hasIcon: true, isDismissable: true });
  });

  errorBtn?.addEventListener("click", () => {
    showAlert({ message: "Error!", type: "error", hasIcon: true, isDismissable: true });
  });

  warningBtn?.addEventListener("click", () => {
    showAlert({ message: "Warning!", type: "warning", hasIcon: true, isDismissable: true });
  });

  infoBtn?.addEventListener("click", () => {
    showAlert({ message: "Info!", type: "info", hasIcon: true, isDismissable: true });
  });

  const playSfxBtn = document.getElementById("play-sfx-btn");
  const playMusicBtn = document.getElementById("play-music-btn");
  const pauseMusicBtn = document.getElementById("pause-music-btn");
  const resumeMusicBtn = document.getElementById("resume-music-btn");
  const changeMusicBtn = document.getElementById("change-music-btn");
  const musicTrackBtn = document.getElementById("track-music-btn");

  playSfxBtn?.addEventListener("click", () => {
    AudioManager.playSFX("collect");
  });

  playMusicBtn?.addEventListener("click", () => {
    AudioManager.playMusic("main-soundtrack");
  });

  pauseMusicBtn?.addEventListener("click", () => {
    AudioManager.pauseMusic();
  });

  resumeMusicBtn?.addEventListener("click", () => {
    AudioManager.resumeMusic();
  });

  changeMusicBtn?.addEventListener("click", () => {
    AudioManager.changeMusic("frenetic-soundtrack");
  });

  musicTrackBtn?.addEventListener("click", () => {
    const track = AudioManager.getMusicTrack();
    showAlert({ message: `Current track: ${track}`, type: "info" });
  });
});
