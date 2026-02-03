import { MusicId } from "./music";
import { SFXId } from "./sfx";
import { MusicContext, SFXContext } from "./context";

class AudioManager {
  private ctx = new AudioContext();
  private musicCtx: MusicContext;
  private sfxCtx: SFXContext;

  constructor() {
    this.musicCtx = new MusicContext(this.ctx);
    this.sfxCtx = new SFXContext(this.ctx);
    this.musicCtx.load("main-soundtrack").catch((err) => {
      console.warn("[AudioManager] Failed to preload main soundtrack:", err);
    });
  }

  public async resumeContext() {
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
    this.musicCtx.pause().catch((err) => {
      console.warn("[AudioManager] Failed to pause music:", err);
    });
  }

  public async resumeMusic() {
    await this.resumeContext();
    try {
      await this.musicCtx.resume();
    } catch (err) {
      console.warn("[AudioManager] Failed to resume music:", err);
    }
  }

  public changeMusic(musicId: MusicId) {
    this.musicCtx.changeTrack(musicId).catch((err) => {
      console.warn("[AudioManager] Failed to change music:", err);
    });
  }

  public getMusicTrack() {
    return this.musicCtx.getTrack();
  }

  public getMusicVolume() {
    return this.musicCtx.getVolume();
  }

  public setMusicVolume(volume: number, ease: boolean = true) {
    this.musicCtx.setVolume(volume, ease);
  }

  public async playSFX(sfxId: SFXId) {
    await this.resumeContext();
    try {
      await this.sfxCtx.play(sfxId);
    } catch (err) {
      console.warn(`[AudioManager] Failed to play SFX "${sfxId}":`, err);
    }
  }

  public loadSFX(sfxId: SFXId) {
    this.sfxCtx.load(sfxId).catch((err) => {
      console.warn(`[AudioManager] Failed to preload SFX "${sfxId}":`, err);
    });
  }

  public loadMultipleSFX(sfxIds: SFXId[]) {
    this.sfxCtx.loadMultiple(sfxIds).catch((err) => {
      console.warn("[AudioManager] Failed to preload some SFX:", err);
    });
  }

  public getSFXVolume() {
    return this.sfxCtx.getVolume();
  }

  public setSFXVolume(volume: number, ease: boolean = true) {
    this.sfxCtx.setVolume(volume, ease);
  }
}

export default new AudioManager();
