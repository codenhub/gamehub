import { MusicId, SFXId } from "./types";

class AudioManager {
  private musicVolume: number = 0;
  private sfxVolume: number = 0;
  private currentMusic = null;
  private currentSFX = [];
  private playingMusic: boolean = false;
  private playingSFX: boolean = false;

  public setMusicVolume(volume: number) {
    this.musicVolume = volume;
  }

  public setSFXVolume(volume: number) {
    this.sfxVolume = volume;
  }

  public getMusicVolume() {
    return this.musicVolume;
  }

  public getSFXVolume() {
    return this.sfxVolume;
  }

  public setMusic(musicId: MusicId, ease: boolean = true) {}

  public playMusic() {}

  public stopMusic() {}

  public playSFX() {}

  public stopSFX() {}

  public stopAllSFX() {}
}

export default new AudioManager();
