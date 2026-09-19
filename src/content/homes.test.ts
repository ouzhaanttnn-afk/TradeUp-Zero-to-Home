import { describe, expect, it } from "vitest";
import { HOME_OPTIONS, isTopTierHome, nextLadderHome } from "./homes";
import type { HomeState } from "../domain/models";

const baseHome: HomeState = {
  unlocked: true,
  purchased: false,
  progressMilestones: [],
};

describe("home ladder selectors", () => {
  it("targets the cheapest option before any purchase", () => {
    expect(nextLadderHome(baseHome)).toBe(HOME_OPTIONS[0]);
    expect(isTopTierHome(undefined)).toBe(false);
  });

  it("targets the next pricier option after a purchase", () => {
    const owned: HomeState = {
      ...baseHome,
      purchased: true,
      purchasedHomeId: HOME_OPTIONS[0].id,
    };
    expect(nextLadderHome(owned)).toBe(HOME_OPTIONS[1]);
    expect(isTopTierHome(HOME_OPTIONS[0].id)).toBe(false);
  });

  it("has no next target once the priciest home is owned", () => {
    const topOwned: HomeState = {
      ...baseHome,
      purchased: true,
      purchasedHomeId: HOME_OPTIONS.at(-1)!.id,
    };
    expect(nextLadderHome(topOwned)).toBeUndefined();
    expect(isTopTierHome(HOME_OPTIONS.at(-1)!.id)).toBe(true);
  });
});
