import { MusicId } from "./music";
import { SFXId } from "./sfx";
import { MusicContext, SFXContext } from "./context";

type AudioContextCtor = new () => AudioContext;

/**
 * Central manager for all audio operations.
 * Handles lazy initialization of the AudioContext and coordinates music and SFX.
 */
class AudioManager {
  private ctx?: AudioContext;
  private musicCtx?: MusicContext;
  private sfxCtx?: SFXContext;
  private initialized = false;

  private logError(action: string, error: unknown) {
    console.warn(`[AudioManager] Failed to ${action}:`, error);
  }

  private async runAsync(action: string, operation: () => Promise<void>) {
    try {
      await operation();
    } catch (error) {
      this.logError(action, error);
    }
  }

  private runDeferred(action: string, operation: Promise<unknown>) {
    void operation.catch((error) => {
      this.logError(action, error);
    });
  }

  /**
   * Initializes the AudioContext and specialized contexts if not already done.
   * This should be triggered by a user interaction to satisfy browser policies.
   */
  private ensureInit() {
    if (this.initialized && this.ctx && this.musicCtx && this.sfxCtx) return;

    try {
      const AudioContextClass =
        (window as unknown as { AudioContext?: AudioContextCtor; webkitAudioContext?: AudioContextCtor })
          .AudioContext ?? (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error("AudioContext is not supported in this browser.");
      }

      const ctx = new AudioContextClass();
      this.ctx = ctx;

      this.musicCtx = new MusicContext(ctx);
      this.sfxCtx = new SFXContext(ctx);

      this.initialized = true;

      this.runDeferred("preload main soundtrack", this.musicCtx.load("main-soundtrack"));
    } catch (error) {
      this.logError("initialize audio context", error);
    }
  }

  public async resumeContext() {
    this.ensureInit();
    const ctx = this.ctx;
    if (!ctx) return;

    await this.runAsync("resume audio context", async () => {
      if (ctx.state === "suspended") {
        await ctx.resume();
      }
    });
  }

  public async playMusic(musicId: MusicId = "main-soundtrack") {
    await this.resumeContext();
    const musicCtx = this.musicCtx;
    if (!musicCtx) return;

    await this.runAsync(`play music \"${musicId}\"`, async () => {
      if (musicCtx.getTrack() !== musicId) {
        await musicCtx.changeTrack(musicId);
      } else {
        await musicCtx.play(true);
      }
    });
  }

  public pauseMusic() {
    if (!this.initialized || !this.musicCtx) return;

    this.runDeferred("pause music", this.musicCtx.pause());
  }

  public async resumeMusic() {
    await this.resumeContext();
    const musicCtx = this.musicCtx;
    if (!musicCtx) return;

    await this.runAsync("resume music", async () => {
      await musicCtx.resume();
    });
  }

  public changeMusic(musicId: MusicId) {
    this.ensureInit();
    if (!this.musicCtx) return;

    this.runDeferred(`change music to \"${musicId}\"`, this.musicCtx.changeTrack(musicId));
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
    const sfxCtx = this.sfxCtx;
    if (!sfxCtx) return;

    await this.runAsync(`play SFX \"${sfxId}\"`, async () => {
      await sfxCtx.play(sfxId);
    });
  }

  public loadSFX(sfxId: SFXId) {
    this.ensureInit();
    if (!this.sfxCtx) return;

    this.runDeferred(`preload SFX \"${sfxId}\"`, this.sfxCtx.load(sfxId));
  }

  public loadMultipleSFX(sfxIds: SFXId[]) {
    this.ensureInit();
    if (!this.sfxCtx) return;

    this.runDeferred("preload multiple SFX", this.sfxCtx.loadMultiple(sfxIds));
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

/**
 * Creates a fresh AudioManager instance.
 * Useful in tests where you need an isolated manager without touching globalThis.
 */
export function createAudioManager(): AudioManager {
  return new AudioManager();
}

const AUDIO_MANAGER_KEY = "__AUDIO_MANAGER__" as const;

function getAudioManagerInstance(): AudioManager {
  const global = globalThis as Record<string, unknown>;

  if (!global[AUDIO_MANAGER_KEY]) {
    global[AUDIO_MANAGER_KEY] = createAudioManager();
  }

  return global[AUDIO_MANAGER_KEY] as AudioManager;
}

export default getAudioManagerInstance();
