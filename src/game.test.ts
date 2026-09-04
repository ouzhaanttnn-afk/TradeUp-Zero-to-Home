import { describe, expect, it } from "vitest";
import {
  initialState,
  market,
  resolveOffer,
  sellerFloor,
  wealth,
} from "./game";

describe("deterministic economy", () => {
  it("replays the same market values for the same seed and cycle", () => {
    const a = market(42, 500_000, 3).map((item) => [
      item.family.id,
      item.priceMinor,
      item.condition,
    ]);
    const b = market(42, 500_000, 3).map((item) => [
      item.family.id,
      item.priceMinor,
      item.condition,
    ]);
    expect(a).toEqual(b);
  });

  it("keeps cash separate from active owned-asset wealth", () => {
    const state = initialState();
    const family = state.listings[0].family;
    state.cashMinor = 1_000;
    state.ownedAssets = [
      {
        id: "asset:x",
        familyId: family.id,
        sourceListingId: "x",
        instance: { family, fairValueMinor: 50_000, condition: 80 },
        state: "IN_INVENTORY",
        purchasePriceMinor: 10_000,
        preparationCostMinor: 0,
        inspectionCostMinor: 0,
        transparentFeesMinor: 0,
        bookCostMinor: 10_000,
        acquiredAtGameMin: 0,
      },
    ];
    expect(wealth(state)).toBe(51_000);
    expect(state.cashMinor).toBe(1_000);
  });

  it("keeps negotiation floor stable", () => {
    const item = market(8, 100_000)[0];
    const floor = sellerFloor(item);
    resolveOffer(item, 2_000, 1);
    expect(sellerFloor(item)).toBe(floor);
  });
});
