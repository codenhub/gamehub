import { MusicId, MusicList } from "./music";
import { SFXId, SFXList } from "./sfx";
import gsap from "gsap";
import { BaseAudioContext, DEFAULT_FADE_DURATION } from "./base";

const DEFAULT_MUSIC_VOLUME = 0.5;
const DEFAULT_SFX_VOLUME = 0.75;

export class MusicContext extends BaseAudioContext<MusicId> {
  private currentTrack: MusicId = "main-soundtrack";
  private source: AudioBufferSourceNode | null = null;
  private playing: boolean = false;
  private isChangingTrack: boolean = false;

  constructor(ctx: AudioContext) {
    super(ctx, DEFAULT_MUSIC_VOLUME);
  }

  public async load(id: MusicId): Promise<AudioBuffer> {
    return super.load(id, MusicList[id]);
  }

  public async loadMultiple(ids: MusicId[]) {
    return super.loadMultiple(ids, MusicList);
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

export class SFXContext extends BaseAudioContext<SFXId> {
  constructor(ctx: AudioContext) {
    super(ctx, DEFAULT_SFX_VOLUME);
  }

  public async load(id: SFXId): Promise<AudioBuffer> {
    return super.load(id, SFXList[id]);
  }

  public async loadMultiple(ids: SFXId[]) {
    return super.loadMultiple(ids, SFXList);
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
