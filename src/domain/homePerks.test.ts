import { describe, expect, it } from "vitest";
import { getActiveHomePerk } from "./homePerks";

describe("living home perks module", () => {
  it("returns null when no home is purchased", () => {
    expect(getActiveHomePerk(undefined)).toBeNull();
    expect(
      getActiveHomePerk({
        unlocked: false,
        purchased: false,
        progressMilestones: [],
      }),
    ).toBeNull();
  });

  it("provides tangible perks for each purchased home ladder tier", () => {
    const garden = getActiveHomePerk({
      unlocked: true,
      purchased: true,
      purchasedHomeId: "garden_edge",
      progressMilestones: [],
    });
    expect(garden?.inventoryBonus).toBe(1);
    expect(garden?.badge.tr).toBe("Huzurlu Veranda");

    const villa = getActiveHomePerk({
      unlocked: true,
      purchased: true,
      purchasedHomeId: "coastal_villa",
      progressMilestones: [],
    });
    expect(villa?.inventoryBonus).toBe(3);
    expect(villa?.showcaseCapacity).toBe(5);
  });
});
