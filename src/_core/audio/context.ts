import { MusicId, MusicList } from "./music";
import { SFXId, SFXList } from "./sfx";
import gsap from "gsap";

type LoadedMusicBuffer = {
  id: MusicId;
  buffer: AudioBuffer;
};

type LoadedSFXBuffer = {
  id: SFXId;
  buffer: AudioBuffer;
};

export class MusicContext {
  private ctx = new AudioContext();
  private gain = this.ctx.createGain();
  private volume: number = 0.5;

  private loadedBuffers: LoadedMusicBuffer[] = [];

  constructor() {
    this.gain.connect(this.ctx.destination);
    this.gain.gain.value = this.volume;
  }

  public setVolume(volume: number, ease: boolean = true) {
    this.volume = volume;
    if (ease) {
      gsap.to(this.gain.gain, { value: volume, duration: 1 });
    } else {
      this.gain.gain.value = volume;
    }
  }

  public getVolume() {
    return this.volume;
  }

  private getBuffer(id: MusicId) {
    return this.loadedBuffers.find((buffer) => buffer.id === id)?.buffer;
  }

  public async load(id: MusicId) {
    const res = await fetch(MusicList[id]);
    const buffer = await this.ctx.decodeAudioData(await res.arrayBuffer());
    this.loadedBuffers.push({ id, buffer });
    return buffer;
  }

  public async loadMultiple(ids: MusicId[]) {
    const promises = ids.map((id) => this.load(id));
    await Promise.all(promises);
  }

  public async play(id: MusicId) {
    const buffer = this.getBuffer(id) || (await this.load(id));
    if (!buffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.gain);
    source.start();
  }

  public pause() {
    this.ctx.suspend();
  }

  public resume() {
    this.ctx.resume();
  }

  public changeTrack(id: MusicId) {
    this.pause();
    this.play(id);
    this.resume();
  }
}

export class SFXContext {
  private ctx = new AudioContext({ latencyHint: "interactive" });
  private gain = this.ctx.createGain();
  private volume: number = 0.75;

  private loadedBuffers: LoadedSFXBuffer[] = [];

  constructor() {
    this.gain.connect(this.ctx.destination);
    this.gain.gain.value = this.volume;
  }

  public setVolume(volume: number, ease: boolean = true) {
    this.volume = volume;
    if (ease) {
      gsap.to(this.gain.gain, { value: volume, duration: 1 });
    } else {
      this.gain.gain.value = volume;
    }
  }

  public getVolume() {
    return this.volume;
  }

  private getBuffer(id: SFXId) {
    return this.loadedBuffers.find((buffer) => buffer.id === id)?.buffer;
  }

  public async load(id: SFXId) {
    const res = await fetch(SFXList[id]);
    const buffer = await this.ctx.decodeAudioData(await res.arrayBuffer());
    this.loadedBuffers.push({ id, buffer });
    return buffer;
  }

  public async loadMultiple(ids: SFXId[]) {
    const promises = ids.map((id) => this.load(id));
    await Promise.all(promises);
  }

  public async play(id: SFXId) {
    const buffer = this.getBuffer(id) || (await this.load(id));
    if (!buffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.gain);
    source.start();
  }
}
