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

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export class MusicContext {
  private ctx = new AudioContext();
  private gain = this.ctx.createGain();
  private volume: number = 0.5;
  private currentTrack: MusicId = "main-soundtrack";
  private source = this.ctx.createBufferSource();
  private playing: boolean = false;

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

  public async play(ease: boolean = true) {
    if (this.source.buffer) throw new Error("Music is already playing");
    const buffer =
      this.getBuffer(this.currentTrack) || (await this.load(this.currentTrack));
    if (!buffer) return;

    this.gain.gain.value = 0;
    this.source.buffer = buffer;
    this.source.connect(this.gain);
    this.source.loop = true;
    this.source.start();
    if (ease) {
      gsap.to(this.gain.gain, { value: this.volume, duration: 1 });
    } else {
      this.gain.gain.value = this.volume;
    }
    this.playing = true;
  }

  public async pause(ease: boolean = true) {
    if (!this.playing) throw new Error("Music is not playing");
    if (!this.source.buffer) throw new Error("No music loaded");
    this.playing = false;
    if (ease) {
      gsap.to(this.gain.gain, { value: 0, duration: 1 });
    } else {
      this.gain.gain.value = 0;
    }
    await delay(1000);
    await this.ctx.suspend();
  }

  public async resume(ease: boolean = true) {
    if (this.playing) throw new Error("Music is already playing");
    if (!this.source.buffer) throw new Error("No music loaded");
    this.playing = true;
    await this.ctx.resume();
    if (ease) {
      gsap.to(this.gain.gain, { value: this.volume, duration: 1 });
    } else {
      this.gain.gain.value = this.volume;
    }
    await delay(1000);
  }

  public async changeTrack(id: MusicId, ease: boolean = true) {
    await this.pause(ease);
    this.source.disconnect();
    this.source = this.ctx.createBufferSource();
    this.currentTrack = id;

    const buffer =
      this.getBuffer(this.currentTrack) || (await this.load(this.currentTrack));
    if (!buffer) return;

    this.gain.gain.value = 0;
    this.source.buffer = buffer;
    this.source.connect(this.gain);
    this.source.loop = true;
    this.source.start();
    if (ease) {
      gsap.to(this.gain.gain, { value: this.volume, duration: 1 });
    } else {
      this.gain.gain.value = this.volume;
    }

    await this.resume(ease);
  }

  public getTrack() {
    return this.currentTrack;
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
