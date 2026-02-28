import AudioManager from "../../_core/audio";
import { createStore } from "../../_core/storage";
import ThemeManager, { THEMES, VALID_THEMES, isValidTheme } from "../../_core/utils/theme";
import type { Theme } from "../../_core/utils/theme";
import type { Slider } from "./slider";

const DEFAULT_MUSIC_VOLUME = "50";
const DEFAULT_SOUND_VOLUME = "75";

type VolumeSchema = {
  musicVolume: string;
  soundVolume: string;
};

const volumeStore = createStore<VolumeSchema>("settings");

/**
 * Custom element for the application header.
 * Provides navigation, volume controls for music and SFX, and theme selection.
 *
 * @attr title - The text to display in the header. Defaults to "GameHub".
 * @attr backBtn - If present, displays a back arrow linking to the home page.
 */
export class Header extends HTMLElement {
  private abortController: AbortController | null = null;

  connectedCallback() {
    const title = this.getAttribute("title") || "GameHub";
    const backBtn = this.hasAttribute("backBtn");

    const musicVolume = volumeStore.get("musicVolume") || DEFAULT_MUSIC_VOLUME;
    const soundVolume = volumeStore.get("soundVolume") || DEFAULT_SOUND_VOLUME;

    const currentTheme = ThemeManager.getTheme();

    this.innerHTML = `
      <header class="flex w-full justify-center p-4 border-b-2 border-border">
        <div class="flex max-w-7xl w-full justify-between">
          <h2 class="font-contrast">${backBtn ? `<a href="/" class="mr-6 cur-pointer">&lt;</a>` : ""}${title}</h2>
          <div class="flex gap-4 items-center">
            <label for="sound-menu" class="relative flex items-center justify-center cur-pointer">
              <input type="checkbox" id="sound-menu" class="peer sr-only">
              <gh-icon src="/assets/icons/volume-high.webp" width="1.5rem" height="1.5rem"></gh-icon>
              <div class="scale-0 peer-checked:scale-100 origin-top-right 2xl:origin-top transition-transform duration-200 flex pointer-events-none absolute z-999 -bottom-4 right-0 2xl:right-1/2 2xl:translate-x-1/2 translate-y-full card flex-col gap-4 p-6">
                <div class="pointer-events-auto flex flex-col gap-4">
                  <div class="flex items-center gap-4 w-48">
                    <gh-icon src="/assets/icons/music.webp" width="1.5rem" height="1.5rem"></gh-icon>
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
                    <gh-icon src="/assets/icons/volume-high.webp" width="1.5rem" height="1.5rem"></gh-icon>
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
              </div>
            </label>
            
            <label for="theme-menu" class="relative flex items-center justify-center cur-pointer">
              <input type="checkbox" id="theme-menu" class="peer sr-only">
              <gh-icon src="/assets/icons/contrast.webp" width="1.5rem" height="1.5rem"></gh-icon>
              <div class="scale-0 peer-checked:scale-100 origin-top-right 2xl:origin-top transition-transform duration-200 flex pointer-events-none absolute z-999 -bottom-4 right-0 2xl:right-1/2 2xl:translate-x-1/2 translate-y-full card flex-col gap-4 p-4">
                <div class="pointer-events-auto flex flex-col gap-1 min-w-48">
                  ${this.buildThemeOptions(currentTheme)}
                </div>
              </div>
            </label>
          </div>
        </div>
      </header>
    `;

    this.setupListeners(musicVolume, soundVolume);
  }

  disconnectedCallback() {
    this.abortController?.abort();
    this.abortController = null;
  }

  private buildThemeOptions(currentTheme: Theme): string {
    return VALID_THEMES.map((theme) => {
      const vars = THEMES[theme];
      const primary = vars["--color-primary"];
      const accent = vars["--color-accent"];
      const bg = vars["--color-background"];
      const isSelected = currentTheme === theme;

      return `
        <button class="theme-option flex items-center gap-3 w-full p-2 hover:bg-primary/10 rounded-md transition-colors cur-pointer" data-theme="${theme}">
          <div class="flex flex-col size-8 overflow-hidden ring-4 ring-border">
            <div class="w-full h-1/2" style="background: ${bg}"></div>
            <div class="flex w-full h-1/2">
              <div class="w-1/2 h-full" style="background: ${primary}"></div>
              <div class="w-1/2 h-full" style="background: ${accent}"></div>
            </div>
          </div>
          <span class="capitalize text-xl ${isSelected ? "font-bold text-primary" : "font-normal text-text"} flex-1 text-left">${theme}</span>
          ${isSelected ? `<div class="size-2 bg-primary active-indicator"></div>` : ""}
        </button>
      `;
    }).join("");
  }

  private setupListeners(musicVolume: string, soundVolume: string) {
    this.abortController = new AbortController();
    const { signal } = this.abortController;

    const musicVolumeEl = this.querySelector("#music-volume") as Slider | null;
    const soundVolumeEl = this.querySelector("#sound-volume") as Slider | null;

    if (!musicVolumeEl || !soundVolumeEl) {
      console.warn("[Header] Volume controls not found in DOM");
      return;
    }

    AudioManager.setMusicVolume(Number(musicVolume) / 100);
    AudioManager.setSFXVolume(Number(soundVolume) / 100);

    musicVolumeEl.addEventListener(
      "input",
      () => {
        volumeStore.set("musicVolume", musicVolumeEl.value);
        AudioManager.setMusicVolume(musicVolumeEl.valueAsNumber / 100);
      },
      { signal },
    );

    soundVolumeEl.addEventListener(
      "input",
      () => {
        volumeStore.set("soundVolume", soundVolumeEl.value);
        AudioManager.setSFXVolume(soundVolumeEl.valueAsNumber / 100);
      },
      { signal },
    );

    this.querySelectorAll(".theme-option").forEach((btn) => {
      btn.addEventListener(
        "click",
        () => {
          const raw = btn.getAttribute("data-theme");
          if (!isValidTheme(raw)) return;

          ThemeManager.setTheme(raw);
          this.updateActiveThemeUI(raw);

          const menuToggle = this.querySelector("#theme-menu") as HTMLInputElement;
          if (menuToggle) menuToggle.checked = false;
        },
        { signal },
      );
    });

    const soundMenu = this.querySelector("#sound-menu") as HTMLInputElement;
    const themeMenu = this.querySelector("#theme-menu") as HTMLInputElement;
    const soundLabel = soundMenu?.closest("label");
    const themeLabel = themeMenu?.closest("label");

    // Close one menu when the other opens
    if (soundMenu && themeMenu) {
      soundMenu.addEventListener(
        "change",
        () => {
          if (soundMenu.checked) themeMenu.checked = false;
        },
        { signal },
      );

      themeMenu.addEventListener(
        "change",
        () => {
          if (themeMenu.checked) soundMenu.checked = false;
        },
        { signal },
      );
    }

    // Close menus when clicking outside
    document.addEventListener(
      "click",
      (e) => {
        const target = e.target as Node;

        // Ensure click wasn't inside the labels/menus
        if (soundMenu?.checked && soundLabel && !soundLabel.contains(target)) {
          soundMenu.checked = false;
        }

        if (themeMenu?.checked && themeLabel && !themeLabel.contains(target)) {
          themeMenu.checked = false;
        }
      },
      { signal },
    );
  }

  private updateActiveThemeUI(activeTheme: Theme) {
    this.querySelectorAll(".theme-option").forEach((opt) => {
      const optTheme = opt.getAttribute("data-theme");
      const isSelected = optTheme === activeTheme;
      const text = opt.querySelector("span");
      const indicator = opt.querySelector(".active-indicator");

      if (text) {
        text.classList.toggle("text-primary", isSelected);
        text.classList.toggle("text-text", !isSelected);
        text.classList.toggle("font-semibold", isSelected);
        text.classList.toggle("font-normal", !isSelected);
      }

      if (isSelected) {
        if (!indicator) {
          const div = document.createElement("div");
          div.className = "size-2 bg-primary active-indicator";
          opt.appendChild(div);
        }
      } else if (indicator) {
        indicator.remove();
      }
    });
  }
}

customElements.define("gh-header", Header);
