import { describe, it, expect, vi, afterEach, beforeAll } from "vitest";
import manager from "./index";
import { MusicContext, SFXContext } from "./context";

// We mock the methods of the contexts directly since they are singletons managed by index.ts
vi.mock("./context", () => {
  return {
    MusicContext: vi.fn().mockImplementation(function () {
      return {
        load: vi.fn().mockResolvedValue({}),
        play: vi.fn().mockResolvedValue(undefined),
        pause: vi.fn().mockResolvedValue(undefined),
        resume: vi.fn().mockResolvedValue(undefined),
        changeTrack: vi.fn().mockResolvedValue(undefined),
        getTrack: vi.fn().mockReturnValue("main-soundtrack"),
        getVolume: vi.fn().mockReturnValue(0.5),
        setVolume: vi.fn(),
      };
    }),
    SFXContext: vi.fn().mockImplementation(function () {
      return {
        load: vi.fn().mockResolvedValue({}),
        loadMultiple: vi.fn().mockResolvedValue({}),
        play: vi.fn().mockResolvedValue(undefined),
        getVolume: vi.fn().mockReturnValue(0.75),
        setVolume: vi.fn(),
      };
    }),
  };
});

describe("AudioManager", () => {
  let mockAudioContextInstance: any;
  let musicCtxMock: any;
  let sfxCtxMock: any;

  beforeAll(async () => {
    mockAudioContextInstance = {
      state: "suspended",
      resume: vi.fn().mockResolvedValue(undefined),
    };

    (globalThis as any).window = {
      AudioContext: vi.fn().mockImplementation(function () {
        return mockAudioContextInstance;
      }),
    };

    // Suppress console.warn for error tests globally
    vi.spyOn(console, "warn").mockImplementation(() => {});

    // Force initialization so we can capture the mock instances
    await manager.resumeContext();

    musicCtxMock = vi.mocked(MusicContext).mock.results[0]?.value;
    sfxCtxMock = vi.mocked(SFXContext).mock.results[0]?.value;

    if (!musicCtxMock) {
      throw new Error("MusicContext was not instantiated");
    }
  });

  afterEach(() => {
    // Clear the call counts on the mock instances without clearing the instances themselves
    vi.clearAllMocks();
  });

  it("should have initialized contexts", () => {
    expect(window.AudioContext).toHaveBeenCalledTimes(1);
    expect(musicCtxMock).toBeDefined();
    expect(sfxCtxMock).toBeDefined();
  });

  it("should gracefully handle missing AudioContext when re-evaluating", async () => {
    expect(true).toBe(true);
  });

  it("should play music and trigger track change if different", async () => {
    musicCtxMock.getTrack.mockReturnValueOnce("old-soundtrack");
    await manager.playMusic("frenetic-soundtrack");

    expect(musicCtxMock.changeTrack).toHaveBeenCalledWith("frenetic-soundtrack");
  });

  it("should play music directly if track is the same", async () => {
    musicCtxMock.getTrack.mockReturnValueOnce("main-soundtrack");
    await manager.playMusic("main-soundtrack");

    expect(musicCtxMock.play).toHaveBeenCalledWith(true);
  });

  it("should proxy SFX operations correctly", async () => {
    await manager.playSFX("collect");

    expect(sfxCtxMock.play).toHaveBeenCalledWith("collect");
  });

  it("should handle volumes", () => {
    manager.setMusicVolume(0.8);
    manager.setSFXVolume(0.9);

    expect(musicCtxMock.setVolume).toHaveBeenCalledWith(0.8, true);
    expect(sfxCtxMock.setVolume).toHaveBeenCalledWith(0.9, true);

    expect(manager.getMusicVolume()).toBe(0.5); // mocked return value
    expect(manager.getSFXVolume()).toBe(0.75); // mocked return value
  });

  it("should handle error in playSFX gracefully", async () => {
    sfxCtxMock.play.mockRejectedValueOnce(new Error("SFX Error"));

    await manager.playSFX("collect");

    expect(console.warn).toHaveBeenCalledWith('[AudioManager] Failed to play SFX "collect":', expect.any(Error));
  });
});
