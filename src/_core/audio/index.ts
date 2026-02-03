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
    this.musicCtx.load("main-soundtrack");
  }

  public async resumeContext() {
    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }
  }

  public async playMusic(musicId: MusicId = "main-soundtrack") {
    await this.resumeContext();
    this.musicCtx.play(true);
  }

  public pauseMusic() {
    this.musicCtx.pause();
  }

  public async resumeMusic() {
    await this.resumeContext();
    this.musicCtx.resume();
  }

  public changeMusic(musicId: MusicId) {
    this.musicCtx.changeTrack(musicId);
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
    this.sfxCtx.play(sfxId);
  }

  public loadSFX(sfxId: SFXId) {
    this.sfxCtx.load(sfxId);
  }

  public loadMultipleSFX(sfxIds: SFXId[]) {
    this.sfxCtx.loadMultiple(sfxIds);
  }

  public getSFXVolume() {
    return this.sfxCtx.getVolume();
  }

  public setSFXVolume(volume: number, ease: boolean = true) {
    this.sfxCtx.setVolume(volume, ease);
  }
}

export default new AudioManager();
