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
      homeTrades: { fastP10: 514, median: 602, slowP90: 661 },
      medianRefreshes: 33,
      milestones: [
        { wealthMinor: 500_000, medianTrades: 12, goldPercent: 5 },
        { wealthMinor: 87_500_000, medianTrades: 318, goldPercent: 22 },
        { wealthMinor: 175_000_000, medianTrades: 458, goldPercent: 42 },
        { wealthMinor: 262_500_000, medianTrades: 528, goldPercent: 65 },
        { wealthMinor: 300_000_000, medianTrades: 561, goldPercent: 77.1 },
        { wealthMinor: 315_000_000, medianTrades: 573, goldPercent: 82 },
        { wealthMinor: 350_000_000, medianTrades: 602, goldPercent: 92 },
      ],
    });
  });
});
