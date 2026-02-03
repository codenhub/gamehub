import { MusicId, MusicList } from "./music";
import { SFXId, SFXList } from "./sfx";
import gsap from "gsap";

const DEFAULT_MUSIC_VOLUME = 0.5;
const DEFAULT_SFX_VOLUME = 0.75;
const DEFAULT_FADE_DURATION = 1;

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
  private ctx: AudioContext;
  private gain: GainNode;
  private volume: number = DEFAULT_MUSIC_VOLUME;
  private currentTrack: MusicId = "main-soundtrack";
  private source: AudioBufferSourceNode | null = null;
  private playing: boolean = false;

  private loadedBuffers: LoadedMusicBuffer[] = [];
  private loadingPromises: Map<MusicId, Promise<AudioBuffer>> = new Map();

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.gain = this.ctx.createGain();
    this.gain.connect(this.ctx.destination);
    this.gain.gain.value = this.volume;
  }

  public setVolume(volume: number, ease: boolean = true) {
    this.volume = volume;
    if (ease) {
      gsap.to(this.gain.gain, {
        value: volume,
        duration: DEFAULT_FADE_DURATION,
      });
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

  public async load(id: MusicId): Promise<AudioBuffer> {
    const existingBuffer = this.getBuffer(id);
    if (existingBuffer) return existingBuffer;

    if (this.loadingPromises.has(id)) {
      return this.loadingPromises.get(id)!;
    }

    const loadPromise = (async () => {
      try {
        const res = await fetch(MusicList[id]);
        const arrayBuffer = await res.arrayBuffer();
        const buffer = await this.ctx.decodeAudioData(arrayBuffer);
        this.loadedBuffers.push({ id, buffer });
        return buffer;
      } finally {
        this.loadingPromises.delete(id);
      }
    })();

    this.loadingPromises.set(id, loadPromise);
    return loadPromise;
  }

  public async loadMultiple(ids: MusicId[]) {
    const promises = ids.map((id) => this.load(id));
    await Promise.all(promises);
  }

  public async play(ease: boolean = true) {
    if (this.playing && this.source) return;

    const buffer =
      this.getBuffer(this.currentTrack) || (await this.load(this.currentTrack));
    if (!buffer) return;

    if (this.source) {
      try {
        this.source.stop();
        this.source.disconnect();
      } catch (e) {
        // Ignore errors if source already stopped
      }
    }

    this.source = this.ctx.createBufferSource();
    this.source.buffer = buffer;
    this.source.loop = true;
    this.source.connect(this.gain);

    if (ease) {
      this.gain.gain.value = 0;
      this.source.start();
      gsap.to(this.gain.gain, {
        value: this.volume,
        duration: DEFAULT_FADE_DURATION,
      });
    } else {
      this.gain.gain.value = this.volume;
      this.source.start();
    }

    this.playing = true;
  }

  public async pause(ease: boolean = true) {
    if (!this.playing || !this.source) return;

    this.playing = false;

    if (ease) {
      await gsap.to(this.gain.gain, {
        value: 0,
        duration: DEFAULT_FADE_DURATION,
      });
    } else {
      this.gain.gain.value = 0;
    }

    if (this.source) {
      try {
        this.source.stop();
        this.source.disconnect();
      } catch (e) {
        /* ignore */
      }
      this.source = null;
    }
  }

  public async resume(ease: boolean = true) {
    if (this.playing) return;
    await this.play(ease);
  }

  public async changeTrack(id: MusicId, ease: boolean = true) {
    if (this.playing) {
      await this.pause(ease);
    }

    this.currentTrack = id;

    await this.play(ease);
  }

  public getTrack() {
    return this.currentTrack;
  }
}

export class SFXContext {
  private ctx: AudioContext;
  private gain: GainNode;
  private volume: number = DEFAULT_SFX_VOLUME;

  private loadedBuffers: LoadedSFXBuffer[] = [];
  private loadingPromises: Map<SFXId, Promise<AudioBuffer>> = new Map();

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.gain = this.ctx.createGain();
    this.gain.connect(this.ctx.destination);
    this.gain.gain.value = this.volume;
  }

  public setVolume(volume: number, ease: boolean = true) {
    this.volume = volume;
    if (ease) {
      gsap.to(this.gain.gain, {
        value: volume,
        duration: DEFAULT_FADE_DURATION,
      });
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

  public async load(id: SFXId): Promise<AudioBuffer> {
    const existingBuffer = this.getBuffer(id);
    if (existingBuffer) return existingBuffer;

    if (this.loadingPromises.has(id)) {
      return this.loadingPromises.get(id)!;
    }

    const loadPromise = (async () => {
      try {
        const res = await fetch(SFXList[id]);
        const arrayBuffer = await res.arrayBuffer();
        const buffer = await this.ctx.decodeAudioData(arrayBuffer);
        this.loadedBuffers.push({ id, buffer });
        return buffer;
      } finally {
        this.loadingPromises.delete(id);
      }
    })();

    this.loadingPromises.set(id, loadPromise);
    return loadPromise;
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
