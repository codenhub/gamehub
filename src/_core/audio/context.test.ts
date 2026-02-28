import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MusicContext, SFXContext } from "./context";
import { MusicList } from "./music";
import { SFXList } from "./sfx";
import { DEFAULT_FADE_DURATION } from "./base";

describe("MusicContext", () => {
  let mockAudioContext: any;
  let mockGainNode: any;
  let mockSourceNode: any;
  let musicContext: MusicContext;

  beforeEach(() => {
    vi.useFakeTimers();

    mockGainNode = {
      connect: vi.fn(),
      gain: {
        value: 1,
        cancelScheduledValues: vi.fn(),
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
      },
    };

    mockSourceNode = {
      buffer: null,
      loop: false,
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      disconnect: vi.fn(),
    };

    mockAudioContext = {
      currentTime: 10,
      destination: {},
      createGain: vi.fn(() => mockGainNode),
      createBufferSource: vi.fn(() => mockSourceNode),
      decodeAudioData: vi.fn((buffer) => Promise.resolve({ mockedBuffer: true, buffer })),
    };

    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      } as Response),
    );

    musicContext = new MusicContext(mockAudioContext);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should initialize with default music volume", () => {
    expect(musicContext.getVolume()).toBe(0.5);
    expect(musicContext.getTrack()).toBe("main-soundtrack");
  });

  it("should load a single track", async () => {
    const buffer = await musicContext.load("frenetic-soundtrack");
    expect(globalThis.fetch).toHaveBeenCalledWith(MusicList["frenetic-soundtrack"]);
    expect(buffer).toBeDefined();
  });

  it("should load multiple tracks", async () => {
    await musicContext.loadMultiple(["main-soundtrack", "waiting-soundtrack"]);
    expect(globalThis.fetch).toHaveBeenCalledWith(MusicList["main-soundtrack"]);
    expect(globalThis.fetch).toHaveBeenCalledWith(MusicList["waiting-soundtrack"]);
  });

  it("should play a track with easing", async () => {
    await musicContext.play(true);

    expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
    expect(mockSourceNode.loop).toBe(true);
    expect(mockSourceNode.connect).toHaveBeenCalledWith(mockGainNode);
    expect(mockGainNode.gain.cancelScheduledValues).toHaveBeenCalledWith(10);
    expect(mockGainNode.gain.setValueAtTime).toHaveBeenCalledWith(0, 10);
    expect(mockSourceNode.start).toHaveBeenCalledWith(0);
    expect(mockGainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.5, 10 + DEFAULT_FADE_DURATION);
  });

  it("should play a track without easing", async () => {
    await musicContext.play(false);

    expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
    expect(mockSourceNode.loop).toBe(true);
    expect(mockSourceNode.connect).toHaveBeenCalledWith(mockGainNode);
    expect(mockGainNode.gain.cancelScheduledValues).toHaveBeenCalledWith(10);
    expect(mockGainNode.gain.setValueAtTime).toHaveBeenCalledWith(0.5, 10);
    expect(mockSourceNode.start).toHaveBeenCalledWith(0);
  });

  it("should pause a track with easing", async () => {
    await musicContext.play(false); // start immediately

    // advance time to simulate playing
    mockAudioContext.currentTime = 20;

    await musicContext.pause(true);

    expect(mockGainNode.gain.cancelScheduledValues).toHaveBeenCalledWith(20);
    expect(mockGainNode.gain.setValueAtTime).toHaveBeenCalledWith(0.5, 20);
    expect(mockGainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0, 20 + DEFAULT_FADE_DURATION);

    // Source shouldn't stop immediately
    expect(mockSourceNode.stop).not.toHaveBeenCalled();

    // Fast-forward past fade duration
    vi.advanceTimersByTime(DEFAULT_FADE_DURATION * 1000 + 100);

    expect(mockSourceNode.stop).toHaveBeenCalled();
    expect(mockSourceNode.disconnect).toHaveBeenCalled();
  });

  it("should pause a track without easing", async () => {
    await musicContext.play(false);

    await musicContext.pause(false);

    expect(mockGainNode.gain.value).toBe(0);
    expect(mockSourceNode.stop).toHaveBeenCalled();
    expect(mockSourceNode.disconnect).toHaveBeenCalled();
  });

  it("should change track with easing", async () => {
    await musicContext.play(false);
    expect(musicContext.getTrack()).toBe("main-soundtrack");

    const changePromise = musicContext.changeTrack("frenetic-soundtrack", true);

    // Initial pause is called, source doesn't stop yet due to easing
    expect(mockGainNode.gain.linearRampToValueAtTime).toHaveBeenCalled();

    await vi.runAllTimersAsync();
    await changePromise;

    expect(musicContext.getTrack()).toBe("frenetic-soundtrack");
    // play is called for new track
    expect(mockSourceNode.start).toHaveBeenCalledTimes(2);
  });

  it("should re-initialize safely without throwing", () => {
    musicContext.init(mockAudioContext);
    expect(mockAudioContext.createGain).toHaveBeenCalledTimes(2);
  });
});

describe("SFXContext", () => {
  let mockAudioContext: any;
  let mockGainNode: any;
  let mockSourceNode: any;
  let sfxContext: SFXContext;

  beforeEach(() => {
    mockGainNode = {
      connect: vi.fn(),
      gain: { value: 1 },
    };

    mockSourceNode = {
      buffer: null,
      connect: vi.fn(),
      start: vi.fn(),
      disconnect: vi.fn(),
      onended: null,
    };

    mockAudioContext = {
      destination: {},
      createGain: vi.fn(() => mockGainNode),
      createBufferSource: vi.fn(() => mockSourceNode),
      decodeAudioData: vi.fn((buffer) => Promise.resolve({ mockedBuffer: true, buffer })),
    };

    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      } as Response),
    );

    sfxContext = new SFXContext(mockAudioContext);
  });

  it("should initialize with default sfx volume", () => {
    expect(sfxContext.getVolume()).toBe(0.75);
  });

  it("should load a single sfx", async () => {
    const buffer = await sfxContext.load("collect");
    expect(globalThis.fetch).toHaveBeenCalledWith(SFXList["collect"]);
    expect(buffer).toBeDefined();
  });

  it("should load multiple sfx", async () => {
    await sfxContext.loadMultiple(["collect", "fail"]);
    expect(globalThis.fetch).toHaveBeenCalledWith(SFXList["collect"]);
    expect(globalThis.fetch).toHaveBeenCalledWith(SFXList["fail"]);
  });

  it("should play an sfx and clean up on end", async () => {
    await sfxContext.play("bonus");

    expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
    expect(mockSourceNode.connect).toHaveBeenCalledWith(mockGainNode);
    expect(mockSourceNode.start).toHaveBeenCalled();
    expect(typeof mockSourceNode.onended).toBe("function");

    // Simulate playback end
    mockSourceNode.onended();
    expect(mockSourceNode.disconnect).toHaveBeenCalled();
  });
});
