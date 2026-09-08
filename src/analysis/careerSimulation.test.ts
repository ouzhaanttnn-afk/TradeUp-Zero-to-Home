import { describe, expect, it } from "vitest";
import { HOME_GOAL_MINOR } from "../game";
import {
  simulateCareer,
  simulateCareerSample,
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
});
