import { MusicId, MusicList } from "./music";
import { SFXId, SFXList } from "./sfx";
import gsap from "gsap";

const DEFAULT_MUSIC_VOLUME = 0.5;
const DEFAULT_SFX_VOLUME = 0.75;
const DEFAULT_FADE_DURATION = 1;

const clampVolume = (volume: number): number =>
  Math.max(0, Math.min(1, volume));

export class MusicContext {
  private ctx: AudioContext;
  private gain: GainNode;
  private volume: number = DEFAULT_MUSIC_VOLUME;
  private currentTrack: MusicId = "main-soundtrack";
  private source: AudioBufferSourceNode | null = null;
  private playing: boolean = false;
  private isChangingTrack: boolean = false;

  private loadedBuffers: Map<MusicId, AudioBuffer> = new Map();
  private loadingPromises: Map<MusicId, Promise<AudioBuffer>> = new Map();

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.gain = this.ctx.createGain();
    this.gain.connect(this.ctx.destination);
    this.gain.gain.value = this.volume;
  }

  public setVolume(volume: number, ease: boolean = true) {
    this.volume = clampVolume(volume);
    gsap.killTweensOf(this.gain.gain);
    if (ease) {
      gsap.to(this.gain.gain, {
        value: this.volume,
        duration: DEFAULT_FADE_DURATION,
      });
    } else {
      this.gain.gain.value = this.volume;
    }
  }

  public getVolume() {
    return this.volume;
  }

  private getBuffer(id: MusicId) {
    return this.loadedBuffers.get(id);
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
        if (!res.ok) {
          throw new Error(
            `Failed to load music "${id}": ${res.status} ${res.statusText}`,
          );
        }
        const arrayBuffer = await res.arrayBuffer();
        const buffer = await this.ctx.decodeAudioData(arrayBuffer);
        this.loadedBuffers.set(id, buffer);
        return buffer;
      } catch (error) {
        console.error(`[MusicContext] Error loading "${id}":`, error);
        throw error;
      } finally {
        this.loadingPromises.delete(id);
      }
    })();

    this.loadingPromises.set(id, loadPromise);
    return loadPromise;
  }

  public async loadMultiple(ids: MusicId[]) {
    await Promise.all(ids.map((id) => this.load(id)));
  }

  public async play(ease: boolean = true) {
    if (this.playing && this.source) return;

    try {
      const buffer =
        this.getBuffer(this.currentTrack) ||
        (await this.load(this.currentTrack));
      if (!buffer) return;

      this.stopSource();

      this.source = this.ctx.createBufferSource();
      this.source.buffer = buffer;
      this.source.loop = true;
      this.source.connect(this.gain);

      gsap.killTweensOf(this.gain.gain);
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
    } catch (error) {
      console.error("[MusicContext] Error playing music:", error);
    }
  }

  private stopSource() {
    if (this.source) {
      try {
        this.source.stop();
        this.source.disconnect();
      } catch {
        // Ignore errors if source already stopped
      }
      this.source = null;
    }
  }

  public async pause(ease: boolean = true) {
    if (!this.playing || !this.source) return;

    this.playing = false;
    gsap.killTweensOf(this.gain.gain);

    if (ease) {
      await gsap.to(this.gain.gain, {
        value: 0,
        duration: DEFAULT_FADE_DURATION,
      });
    } else {
      this.gain.gain.value = 0;
    }

    this.stopSource();
  }

  public async resume(ease: boolean = true) {
    if (this.playing) return;
    await this.play(ease);
  }

  public async changeTrack(id: MusicId, ease: boolean = true) {
    if (this.isChangingTrack) return;
    this.isChangingTrack = true;

    try {
      if (this.playing) {
        await this.pause(ease);
      }
      this.currentTrack = id;
      await this.play(ease);
    } finally {
      this.isChangingTrack = false;
    }
  }

  public getTrack() {
    return this.currentTrack;
  }
}

export class SFXContext {
  private ctx: AudioContext;
  private gain: GainNode;
  private volume: number = DEFAULT_SFX_VOLUME;

  private loadedBuffers: Map<SFXId, AudioBuffer> = new Map();
  private loadingPromises: Map<SFXId, Promise<AudioBuffer>> = new Map();

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.gain = this.ctx.createGain();
    this.gain.connect(this.ctx.destination);
    this.gain.gain.value = this.volume;
  }

  public setVolume(volume: number, ease: boolean = true) {
    this.volume = clampVolume(volume);
    gsap.killTweensOf(this.gain.gain);
    if (ease) {
      gsap.to(this.gain.gain, {
        value: this.volume,
        duration: DEFAULT_FADE_DURATION,
      });
    } else {
      this.gain.gain.value = this.volume;
    }
  }

  public getVolume() {
    return this.volume;
  }

  private getBuffer(id: SFXId) {
    return this.loadedBuffers.get(id);
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
        if (!res.ok) {
          throw new Error(
            `Failed to load SFX "${id}": ${res.status} ${res.statusText}`,
          );
        }
        const arrayBuffer = await res.arrayBuffer();
        const buffer = await this.ctx.decodeAudioData(arrayBuffer);
        this.loadedBuffers.set(id, buffer);
        return buffer;
      } catch (error) {
        console.error(`[SFXContext] Error loading "${id}":`, error);
        throw error;
      } finally {
        this.loadingPromises.delete(id);
      }
    })();

    this.loadingPromises.set(id, loadPromise);
    return loadPromise;
  }

  public async loadMultiple(ids: SFXId[]) {
    await Promise.all(ids.map((id) => this.load(id)));
  }

  public async play(id: SFXId) {
    try {
      const buffer = this.getBuffer(id) || (await this.load(id));
      if (!buffer) return;

      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.gain);
      source.start();

      source.onended = () => {
        source.disconnect();
      };
    } catch (error) {
      console.error(`[SFXContext] Error playing "${id}":`, error);
    }
  }
}
