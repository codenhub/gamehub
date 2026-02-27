export const DEFAULT_FADE_DURATION = 1;

export const clampVolume = (volume: number): number => Math.max(0, Math.min(1, volume));

/**
 * Base class for managing an AudioContext with gain control and buffer caching.
 * @template T Type of audio identifiers.
 */
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

  public init(newCtx?: AudioContext) {
    if (newCtx) {
      this.ctx = newCtx;
      this.gain = this.ctx.createGain();
      this.gain.connect(this.ctx.destination);
      this.gain.gain.value = this.volume;
    }
  }

  public setVolume(volume: number, ease: boolean = true) {
    this.volume = clampVolume(volume);
    const currentTime = this.ctx.currentTime;

    if (ease) {
      this.gain.gain.cancelScheduledValues(currentTime);
      this.gain.gain.setValueAtTime(this.gain.gain.value, currentTime);
      this.gain.gain.linearRampToValueAtTime(this.volume, currentTime + DEFAULT_FADE_DURATION);
    } else {
      this.gain.gain.cancelScheduledValues(currentTime);
      this.gain.gain.setValueAtTime(this.volume, currentTime);
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
          throw new Error(`Failed to load audio "${id}": ${res.status} ${res.statusText}`);
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
    const results = await Promise.allSettled(ids.map((id) => this.load(id, urlMap[id])));

    results.forEach((result, index) => {
      if (result.status === "rejected") {
        console.warn(`[AudioContext] Failed to load "${ids[index]}":`, result.reason);
      }
    });
  }
}
