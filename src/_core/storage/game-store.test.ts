import { describe, it, expect, beforeEach, vi } from "vitest";
import { GameStoreImpl } from "./game-store";

type TestSchema = {
  score: number;
  name: string;
};

type OtherSchema = {
  level: number;
};

function createFakeStorage(): Storage {
  const data = new Map<string, string>();

  return {
    getItem: vi.fn((key: string) => data.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      data.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      data.delete(key);
    }),
    clear: vi.fn(() => data.clear()),
    get length() {
      return data.size;
    },
    key: vi.fn(() => null),
  };
}

describe("GameStoreImpl", () => {
  let fakeStorage: Storage;

  beforeEach(() => {
    fakeStorage = createFakeStorage();
    vi.stubGlobal("localStorage", fakeStorage);
  });

  it("should return null for a missing key", () => {
    const store = new GameStoreImpl<TestSchema>("test");
    expect(store.get("score")).toBeNull();
  });

  it("should round-trip a number value", () => {
    const store = new GameStoreImpl<TestSchema>("test");
    store.set("score", 42);
    expect(store.get("score")).toBe(42);
  });

  it("should round-trip a string value", () => {
    const store = new GameStoreImpl<TestSchema>("test");
    store.set("name", "Alice");
    expect(store.get("name")).toBe("Alice");
  });

  it("should remove a key", () => {
    const store = new GameStoreImpl<TestSchema>("test");
    store.set("score", 100);
    store.remove("score");
    expect(store.get("score")).toBeNull();
  });

  it("should namespace keys to avoid collisions", () => {
    const storeA = new GameStoreImpl<TestSchema>("game-a");
    const storeB = new GameStoreImpl<OtherSchema>("game-b");

    storeA.set("score", 10);
    storeB.set("level", 5);

    expect(storeA.get("score")).toBe(10);
    expect(storeB.get("level")).toBe(5);

    // Verify keys are namespaced
    expect(fakeStorage.setItem).toHaveBeenCalledWith("game-a:score", JSON.stringify(10));
    expect(fakeStorage.setItem).toHaveBeenCalledWith("game-b:level", JSON.stringify(5));
  });

  it("should isolate stores with different namespaces", () => {
    const storeA = new GameStoreImpl<TestSchema>("ns-a");
    const storeB = new GameStoreImpl<TestSchema>("ns-b");

    storeA.set("score", 100);
    expect(storeB.get("score")).toBeNull();
  });

  it("should handle localStorage.getItem throwing", () => {
    const store = new GameStoreImpl<TestSchema>("test");
    vi.mocked(fakeStorage.getItem).mockImplementation(() => {
      throw new Error("quota exceeded");
    });

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(store.get("score")).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("should handle localStorage.setItem throwing", () => {
    const store = new GameStoreImpl<TestSchema>("test");
    vi.mocked(fakeStorage.setItem).mockImplementation(() => {
      throw new Error("quota exceeded");
    });

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    store.set("score", 999);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("should handle localStorage.removeItem throwing", () => {
    const store = new GameStoreImpl<TestSchema>("test");
    vi.mocked(fakeStorage.removeItem).mockImplementation(() => {
      throw new Error("access denied");
    });

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    store.remove("score");
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
