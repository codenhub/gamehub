import { MusicId } from "./music";
import { SFXId } from "./sfx";
import { MusicContext, SFXContext } from "./context";

class AudioManager {
  private musicCtx = new MusicContext();
  private sfxCtx = new SFXContext();

  constructor() {
    this.musicCtx.load("main-soundtrack");
  }

  public async playMusic(musicId: MusicId = "main-soundtrack") {
    this.musicCtx.play(true);
  }

  public async pauseMusic() {
    this.musicCtx.pause();
  }

  public async resumeMusic() {
    this.musicCtx.resume();
  }

  public async changeMusic(musicId: MusicId) {
    this.musicCtx.changeTrack(musicId);
  }

  public getMusicVolume() {
    return this.musicCtx.getVolume();
  }

  public setMusicVolume(volume: number, ease: boolean = true) {
    this.musicCtx.setVolume(volume, ease);
  }

  public async playSFX(sfxId: SFXId) {
    this.sfxCtx.play(sfxId);
  }

  public async loadSFX(sfxId: SFXId) {
    this.sfxCtx.load(sfxId);
  }

  public async loadMultipleSFX(sfxIds: SFXId[]) {
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
