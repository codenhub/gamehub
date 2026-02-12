import { describe, it, expect } from "vitest";
import { clampVolume } from "./base";

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
