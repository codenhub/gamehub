import { MusicId } from "./music";
import { SFXId } from "./sfx";
import { MusicContext, SFXContext } from "./context";

class AudioManager {
  private ctx?: AudioContext;
  private musicCtx?: MusicContext;
  private sfxCtx?: SFXContext;
  private initialized: boolean = false;

  private ensureInit() {
    if (this.initialized && this.ctx && this.musicCtx && this.sfxCtx) return;

    try {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();

      this.musicCtx = new MusicContext(this.ctx);
      this.sfxCtx = new SFXContext(this.ctx);

      this.initialized = true;

      this.musicCtx.load("main-soundtrack").catch((err) => {
        console.warn("[AudioManager] Failed to preload main soundtrack:", err);
      });
    } catch (err) {
      console.error("[AudioManager] Failed to initialize AudioContext:", err);
    }
  }

  public async resumeContext() {
    this.ensureInit();
    if (!this.ctx) return;

    try {
      if (this.ctx.state === "suspended") {
        await this.ctx.resume();
      }
    } catch (err) {
      console.warn("[AudioManager] Failed to resume audio context:", err);
    }
  }

  public async playMusic(musicId: MusicId = "main-soundtrack") {
    await this.resumeContext();
    if (!this.musicCtx) return;

    try {
      if (this.musicCtx.getTrack() !== musicId) {
        await this.musicCtx.changeTrack(musicId);
      } else {
        await this.musicCtx.play(true);
      }
    } catch (err) {
      console.warn("[AudioManager] Failed to play music:", err);
    }
  }

  public pauseMusic() {
    if (!this.initialized || !this.musicCtx) return;

    this.musicCtx.pause().catch((err) => {
      console.warn("[AudioManager] Failed to pause music:", err);
    });
  }

  public async resumeMusic() {
    await this.resumeContext();
    if (!this.musicCtx) return;

    try {
      await this.musicCtx.resume();
    } catch (err) {
      console.warn("[AudioManager] Failed to resume music:", err);
    }
  }

  public changeMusic(musicId: MusicId) {
    this.ensureInit();
    if (!this.musicCtx) return;

    this.musicCtx.changeTrack(musicId).catch((err) => {
      console.warn("[AudioManager] Failed to change music:", err);
    });
  }

  public getMusicTrack() {
    if (!this.musicCtx) return null;
    return this.musicCtx.getTrack();
  }

  public getMusicVolume() {
    if (!this.musicCtx) return 0;
    return this.musicCtx.getVolume();
  }

  public setMusicVolume(volume: number, ease: boolean = true) {
    this.ensureInit();
    if (this.musicCtx) {
      this.musicCtx.setVolume(volume, ease);
    }
  }

  public async playSFX(sfxId: SFXId) {
    await this.resumeContext();
    if (!this.sfxCtx) return;

    try {
      await this.sfxCtx.play(sfxId);
    } catch (err) {
      console.warn(`[AudioManager] Failed to play SFX "${sfxId}":`, err);
    }
  }

  public loadSFX(sfxId: SFXId) {
    this.ensureInit();
    if (!this.sfxCtx) return;

    this.sfxCtx.load(sfxId).catch((err) => {
      console.warn(`[AudioManager] Failed to preload SFX "${sfxId}":`, err);
    });
  }

  public loadMultipleSFX(sfxIds: SFXId[]) {
    this.ensureInit();
    if (!this.sfxCtx) return;

    this.sfxCtx.loadMultiple(sfxIds).catch((err) => {
      console.warn("[AudioManager] Failed to preload some SFX:", err);
    });
  }

  public getSFXVolume() {
    if (!this.sfxCtx) return 0;
    return this.sfxCtx.getVolume();
  }

  public setSFXVolume(volume: number, ease: boolean = true) {
    this.ensureInit();
    if (this.sfxCtx) {
      this.sfxCtx.setVolume(volume, ease);
    }
  }
}

const AUDIO_MANAGER_KEY = "__AUDIO_MANAGER__" as const;

function getAudioManagerInstance(): AudioManager {
  const global = globalThis as Record<string, unknown>;

  if (!global[AUDIO_MANAGER_KEY]) {
    global[AUDIO_MANAGER_KEY] = new AudioManager();
  }

  return global[AUDIO_MANAGER_KEY] as AudioManager;
}

export default getAudioManagerInstance();
