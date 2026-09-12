import { describe, expect, it } from "vitest";
import { HOME_GOAL_MINOR } from "../game";
import {
  simulateCareer,
  simulateCareerSample,
  summarizeCareerSample,
  THREE_MILLION_MINOR,
} from "./careerSimulation";

describe("career balance simulation", () => {
  it("reaches three million and the home goal deterministically", () => {
    expect(simulateCareer(20_260_908)).toEqual(simulateCareer(20_260_908));
    const result = simulateCareer(20_260_908);
    expect(result.finalCashMinor).toBeGreaterThanOrEqual(HOME_GOAL_MINOR);
    expect(
      result.milestones.find(
        (milestone) => milestone.wealthMinor === THREE_MILLION_MINOR,
      )?.trades,
    ).toBeGreaterThan(0);
    expect(result.milestones.at(-1)).toMatchObject({
      wealthMinor: HOME_GOAL_MINOR,
      goldPercent: 92,
    });
  });

  it("keeps every sampled career finite and within the intended goal", () => {
    const sample = simulateCareerSample(40);
    expect(sample).toHaveLength(40);
    expect(sample.every((run) => run.trades > 0 && run.trades < 2_000)).toBe(
      true,
    );
    expect(sample.every((run) => run.finalCashMinor >= HOME_GOAL_MINOR)).toBe(
      true,
    );
  });

  it("locks the published 100-seed career report to the live price engine", () => {
    const summary = summarizeCareerSample();
    expect(summary).toEqual({
      sampleSize: 100,
      homeTrades: { fastP10: 255, median: 282, slowP90: 314 },
      medianRefreshes: 32,
      milestones: [
        { wealthMinor: 500_000, medianTrades: 12, goldPercent: 5 },
        { wealthMinor: 87_500_000, medianTrades: 164, goldPercent: 22 },
        { wealthMinor: 175_000_000, medianTrades: 208, goldPercent: 42 },
        { wealthMinor: 262_500_000, medianTrades: 244, goldPercent: 65 },
        { wealthMinor: 300_000_000, medianTrades: 261, goldPercent: 77.1 },
        { wealthMinor: 315_000_000, medianTrades: 268, goldPercent: 82 },
        { wealthMinor: 350_000_000, medianTrades: 282, goldPercent: 92 },
      ],
    });
    expect(summary.homeTrades.median).toBeLessThanOrEqual(300);
    expect(summary.homeTrades.slowP90).toBeLessThanOrEqual(330);
  }, 20_000);
});
