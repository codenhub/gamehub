import gsap from "gsap";

export const DEFAULT_FADE_DURATION = 1;

export const clampVolume = (volume: number): number =>
  Math.max(0, Math.min(1, volume));

export abstract class BaseAudioContext<T extends string> {
  protected ctx: AudioContext;
  protected gain: GainNode;
  protected volume: number;

  protected loadedBuffers: Map<T, AudioBuffer> = new Map();
  protected loadingPromises: Map<T, Promise<AudioBuffer>> = new Map();

  constructor(ctx: AudioContext, initialVolume: number) {
    this.ctx = ctx;
    this.gain = this.ctx.createGain();
    this.gain.connect(this.ctx.destination);
    this.volume = initialVolume;
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

  protected getBuffer(id: T) {
    return this.loadedBuffers.get(id);
  }

  public async load(id: T, url: string): Promise<AudioBuffer> {
    const existingBuffer = this.getBuffer(id);
    if (existingBuffer) return existingBuffer;

    if (this.loadingPromises.has(id)) {
      return this.loadingPromises.get(id)!;
    }

    const loadPromise = (async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(
            `Failed to load audio "${id}": ${res.status} ${res.statusText}`,
          );
        }
        const arrayBuffer = await res.arrayBuffer();
        const buffer = await this.ctx.decodeAudioData(arrayBuffer);
        this.loadedBuffers.set(id, buffer);
        return buffer;
      } catch (error) {
        console.error(`[AudioContext] Error loading "${id}":`, error);
        throw error;
      } finally {
        this.loadingPromises.delete(id);
      }
    })();

    this.loadingPromises.set(id, loadPromise);
    return loadPromise;
  }

  public async loadMultiple(ids: T[], urlMap: Record<T, string>) {
    await Promise.all(ids.map((id) => this.load(id, urlMap[id])));
  }
}
