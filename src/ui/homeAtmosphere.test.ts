import { describe, expect, it } from "vitest";
import { homeAtmosphereStage, homeGoldPercent } from "./homeAtmosphere";

const GOAL = 350_000_000;

describe("home atmosphere", () => {
  it("starts a subtle gold shift at five thousand lira", () => {
    expect(homeGoldPercent(500_000, GOAL, false)).toBe(5);
  });

  it.each([
    [0.25, 22],
    [0.5, 42],
    [0.75, 65],
    [0.9, 82],
    [1, 92],
  ])("maps the %s goal milestone to %s gold", (ratio, gold) => {
    expect(homeGoldPercent(GOAL * ratio, GOAL, false)).toBe(gold);
  });

  it("becomes fully gold only after the home is purchased", () => {
    expect(homeGoldPercent(GOAL, GOAL, false)).toBe(92);
    expect(homeGoldPercent(0, GOAL, true)).toBe(100);
    expect(homeAtmosphereStage(100)).toBe(7);
  });

  it("interpolates without sudden jumps between milestones", () => {
    const before = homeGoldPercent(GOAL * 0.4, GOAL, false);
    const after = homeGoldPercent(GOAL * 0.41, GOAL, false);
    expect(after).toBeGreaterThan(before);
    expect(after - before).toBeLessThan(2);
  });
});
