import AudioManager from "../../_core/audio";
import ThemeManager from "../../_core/utils/theme";
import type { Slider } from "./slider";

const DEFAULT_MUSIC_VOLUME = "50";
const DEFAULT_SOUND_VOLUME = "75";

export class Header extends HTMLElement {
  connectedCallback() {
    const title = this.getAttribute("title") || "GameHub";
    const backBtn = this.hasAttribute("backBtn");

    ThemeManager.init();

    const musicVolume =
      localStorage.getItem("music-volume") || DEFAULT_MUSIC_VOLUME;
    const soundVolume =
      localStorage.getItem("sound-volume") || DEFAULT_SOUND_VOLUME;

    this.innerHTML = `
      <header class="flex w-full justify-center p-4 border-b-2 border-border">
        <div class="flex max-w-7xl w-full justify-between">
          <h2 class="font-contrast">${backBtn ? `<a href="/" class="mr-6 cur-pointer"><</a>` : ""}${title}</h2>
          <div class="flex gap-4 items-center">
            <label for="sound-menu" class="relative cur-pointer">
              <input type="checkbox" id="sound-menu" class="peer sr-only">
              <img
                class="size-6 object-contain not-dark:invert"
                src="/assets/icons/volume-high.webp"
                alt="Speaker icon"
              >
              <div class="hidden peer-checked:flex pointer-events-none absolute z-999 -bottom-4 right-0 2xl:right-1/2 2xl:translate-x-1/2 translate-y-1/1 card flex-col gap-4 p-6">
                <div class="flex items-center gap-4 w-48">
                  <img src="/assets/icons/music.webp" alt="Music icon" class="size-6 object-contain not-dark:invert">
                  <gh-slider
                    id="music-volume"
                    min="0"
                    max="100"
                    step="10"
                    value="${musicVolume}"
                    class="pointer-events-auto"
                  ></gh-slider>
                </div>
                <div class="flex items-center gap-4 w-48">
                  <img src="/assets/icons/volume-high.webp" alt="Sound icon" class="size-6 object-contain not-dark:invert">
                  <gh-slider
                    id="sound-volume"
                    min="0"
                    max="100"
                    step="10"
                    value="${soundVolume}"
                    class="pointer-events-auto"
                  ></gh-slider>
                </div>
              </div>
            </label>
            <button id="theme-toggle" class="flex items-center">
              <img
                class="dark:hidden size-6 object-contain"
                src="/assets/icons/sun.webp"
                alt="Sun icon"
              >
              <img
                class="hidden dark:flex size-6 object-contain"
                src="/assets/icons/moon.webp"
                alt="Moon icon"
              >
            </button>
          </div>
        </div>
      </header>
    `;

    const musicVolumeEl = document.getElementById(
      "music-volume",
    ) as Slider | null;
    const soundVolumeEl = document.getElementById(
      "sound-volume",
    ) as Slider | null;

    if (!musicVolumeEl || !soundVolumeEl) {
      console.warn("[Header] Volume controls not found in DOM");
      return;
    }

    AudioManager.setMusicVolume(Number(musicVolume) / 100);
    AudioManager.setSFXVolume(Number(soundVolume) / 100);

    musicVolumeEl.addEventListener("input", () => {
      localStorage.setItem("music-volume", musicVolumeEl.value);
      AudioManager.setMusicVolume(musicVolumeEl.valueAsNumber / 100);
    });

    soundVolumeEl.addEventListener("input", () => {
      localStorage.setItem("sound-volume", soundVolumeEl.value);
      AudioManager.setSFXVolume(soundVolumeEl.valueAsNumber / 100);
    });

    document.getElementById("theme-toggle")?.addEventListener("click", () => {
      if (ThemeManager.getTheme() === "dark") return ThemeManager.setTheme("light");
      ThemeManager.setTheme("dark");
    });
  }
}

customElements.define("gh-header", Header);
