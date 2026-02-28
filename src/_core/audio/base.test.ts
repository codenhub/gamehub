import { describe, it, expect, vi, beforeEach } from "vitest";
import { clampVolume, BaseAudioContext, DEFAULT_FADE_DURATION } from "./base";

describe("clampVolume", () => {
  it("should return value within range unchanged", () => {
    expect(clampVolume(0.5)).toBe(0.5);
    expect(clampVolume(0)).toBe(0);
    expect(clampVolume(1)).toBe(1);
  });

  it("should clamp values above 1", () => {
    expect(clampVolume(1.5)).toBe(1);
    expect(clampVolume(100)).toBe(1);
  });

  it("should clamp values below 0", () => {
    expect(clampVolume(-0.5)).toBe(0);
    expect(clampVolume(-100)).toBe(0);
  });
});

class TestAudioContext extends BaseAudioContext<string> {
  public getLoadedBuffer(id: string) {
    return this.loadedBuffers.get(id);
  }
}

describe("BaseAudioContext", () => {
  let mockAudioContext: any;
  let mockGainNode: any;
  let testContext: TestAudioContext;

  beforeEach(() => {
    mockGainNode = {
      connect: vi.fn(),
      gain: {
        value: 1,
        cancelScheduledValues: vi.fn(),
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
      },
    };

    mockAudioContext = {
      currentTime: 10,
      destination: {},
      createGain: vi.fn(() => mockGainNode),
      decodeAudioData: vi.fn((buffer) => Promise.resolve({ mockedBuffer: true, buffer })),
    };

    testContext = new TestAudioContext(mockAudioContext, 0.5);

    // Mock fetch globally for load tests
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      } as Response),
    );
  });

  it("should initialize correctly", () => {
    expect(mockAudioContext.createGain).toHaveBeenCalled();
    expect(mockGainNode.connect).toHaveBeenCalledWith(mockAudioContext.destination);
    expect(testContext.getVolume()).toBe(0.5);
    expect(mockGainNode.gain.value).toBe(0.5);
  });

  it("should re-initialize with a new AudioContext", () => {
    const newMockGainNode = {
      connect: vi.fn(),
      gain: { value: 1 },
    };
    const newMockAudioContext = {
      destination: {},
      createGain: vi.fn(() => newMockGainNode),
    } as any;

    testContext.init(newMockAudioContext);
    expect(newMockAudioContext.createGain).toHaveBeenCalled();
    expect(newMockGainNode.connect).toHaveBeenCalledWith(newMockAudioContext.destination);
    expect(newMockGainNode.gain.value).toBe(0.5); // should preserve volume
  });

  it("should set volume with easing", () => {
    testContext.setVolume(0.8, true);
    expect(testContext.getVolume()).toBe(0.8);
    expect(mockGainNode.gain.cancelScheduledValues).toHaveBeenCalledWith(10);
    expect(mockGainNode.gain.setValueAtTime).toHaveBeenCalledWith(0.5, 10);
    expect(mockGainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.8, 10 + DEFAULT_FADE_DURATION);
  });

  it("should set volume without easing", () => {
    testContext.setVolume(0.2, false);
    expect(testContext.getVolume()).toBe(0.2);
    expect(mockGainNode.gain.cancelScheduledValues).toHaveBeenCalledWith(10);
    expect(mockGainNode.gain.setValueAtTime).toHaveBeenCalledWith(0.2, 10);
    expect(mockGainNode.gain.linearRampToValueAtTime).not.toHaveBeenCalled();
  });

  it("should clamp volume when setting", () => {
    testContext.setVolume(1.5, false);
    expect(testContext.getVolume()).toBe(1);
    expect(mockGainNode.gain.setValueAtTime).toHaveBeenCalledWith(1, 10);
  });

  it("should load an audio file successfully", async () => {
    const buffer = await testContext.load("test-id", "http://test.url");

    expect(globalThis.fetch).toHaveBeenCalledWith("http://test.url");
    expect(mockAudioContext.decodeAudioData).toHaveBeenCalled();
    expect(testContext.getLoadedBuffer("test-id")).toBe(buffer);
  });

  it("should return cached buffer if already loaded", async () => {
    const buffer1 = await testContext.load("test-id", "http://test.url");

    // Clear mock calls to verify fetch isn't called again
    vi.mocked(globalThis.fetch).mockClear();

    const buffer2 = await testContext.load("test-id", "http://test.url");
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(buffer1).toBe(buffer2);
  });

  it("should handle concurrent loads of the same id gracefully", async () => {
    const load1 = testContext.load("test-id", "http://test.url");
    const load2 = testContext.load("test-id", "http://test.url");

    const [buffer1, buffer2] = await Promise.all([load1, load2]);

    // Fetch should only be called once
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(buffer1).toBe(buffer2);
  });

  it("should throw an error if fetch fails", async () => {
    globalThis.fetch = vi.fn(() => Promise.resolve({ ok: false, status: 404, statusText: "Not Found" } as Response));
    await expect(testContext.load("fail-id", "http://fail.url")).rejects.toThrow(
      'Failed to load audio "fail-id": 404 Not Found',
    );
  });

  it("should load multiple files successfully", async () => {
    await testContext.loadMultiple(["id1", "id2"], { id1: "url1", id2: "url2" });
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    expect(globalThis.fetch).toHaveBeenCalledWith("url1");
    expect(globalThis.fetch).toHaveBeenCalledWith("url2");
    expect(testContext.getLoadedBuffer("id1")).toBeDefined();
    expect(testContext.getLoadedBuffer("id2")).toBeDefined();
  });

  it("should throw an error if any file in loadMultiple fails", async () => {
    globalThis.fetch = vi.fn((url) => {
      if (url === "url2") {
        return Promise.resolve({ ok: false, status: 500, statusText: "Error" } as Response);
      }
      return Promise.resolve({ ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) } as Response);
    });

    await expect(testContext.loadMultiple(["id1", "id2"], { id1: "url1", id2: "url2" })).rejects.toThrow(
      "Failed to load audio IDs: id2",
    );
  });
});
