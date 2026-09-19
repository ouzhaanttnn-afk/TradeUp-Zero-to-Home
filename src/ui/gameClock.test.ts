import { describe, expect, it } from "vitest";
import { gameClockLabel } from "./gameClock";

describe("gameClockLabel", () => {
  it("starts on day 1 at game time zero", () => {
    expect(gameClockLabel(0)).toBe("1. Gün · Gece");
  });

  it("buckets time-of-day phrases across a single day", () => {
    expect(gameClockLabel(0)).toBe("1. Gün · Gece");
    expect(gameClockLabel(6 * 60)).toBe("1. Gün · Sabah");
    expect(gameClockLabel(12 * 60)).toBe("1. Gün · Öğle");
    expect(gameClockLabel(14 * 60)).toBe("1. Gün · Öğleden sonra");
    expect(gameClockLabel(18 * 60)).toBe("1. Gün · Akşam");
    expect(gameClockLabel(22 * 60)).toBe("1. Gün · Gece");
  });

  it("advances the day count every 1,440 game minutes", () => {
    expect(gameClockLabel(1_439)).toBe("1. Gün · Gece");
    expect(gameClockLabel(1_440)).toBe("2. Gün · Gece");
    expect(gameClockLabel(1_440 * 9 + 6 * 60)).toBe("10. Gün · Sabah");
  });

  it("never goes negative or crashes on fractional/negative input", () => {
    expect(gameClockLabel(-5)).toBe("1. Gün · Gece");
    expect(gameClockLabel(90.7)).toBe("1. Gün · Gece");
  });
});
