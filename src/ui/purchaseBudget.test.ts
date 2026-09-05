import { describe, expect, it } from "vitest";
import { playerOfferMinor } from "../game";
import { purchaseBudget } from "./purchaseBudget";
import type { Negotiation } from "../domain/models";

const negotiation: Negotiation = {
  listingId: "listing",
  offersRemaining: 1,
  closed: false,
  sellerFloorMinor: 45_000,
};

describe("purchase budget presentation", () => {
  it("preserves both existing preset formulas including rounding", () => {
    for (const asking of [1_000, 14_000, 15_000, 42_001, 50_000, 999_999]) {
      expect(playerOfferMinor(asking, 1)).toBe(
        Math.round((asking * 0.82) / 1_000) * 1_000,
      );
      expect(playerOfferMinor(asking, 2)).toBe(
        Math.round((asking * 0.91) / 1_000) * 1_000,
      );
    }
  });
  it("allows an affordable offer when asking price exceeds cash", () => {
    const result = purchaseBudget(50_000, 42_000, undefined, true);
    expect(result.offer).toEqual({
      amountMinor: 41_000,
      remainingMinor: 1_000,
      shortfallMinor: 0,
    });
    expect(result.direct?.shortfallMinor).toBe(8_000);
    expect(result.shortfallMinor).toBe(0);
  });
  it("shows the second offer without adding a right", () => {
    expect(purchaseBudget(50_000, 42_000, negotiation, true).offer).toEqual({
      amountMinor: 46_000,
      remainingMinor: 0,
      shortfallMinor: 4_000,
    });
  });
  it("uses the real counter, not asking price, for the shortfall", () => {
    const result = purchaseBudget(
      50_000,
      42_000,
      {
        ...negotiation,
        closed: true,
        offersRemaining: 0,
        counterMinor: 43_000,
      },
      true,
    );
    expect(result.offer).toBeNull();
    expect(result.counter?.shortfallMinor).toBe(1_000);
    expect(result.shortfallMinor).toBe(1_000);
  });
  it("keeps an affordable saved counter available with no offer rights", () => {
    const result = purchaseBudget(
      50_000,
      42_000,
      {
        ...negotiation,
        closed: true,
        offersRemaining: 0,
        counterMinor: 42_000,
      },
      true,
    );
    expect(result.offer).toBeNull();
    expect(result.counter).toEqual({
      amountMinor: 42_000,
      remainingMinor: 0,
      shortfallMinor: 0,
    });
    expect(result.shortfallMinor).toBe(0);
  });
  it("does not reopen accepted negotiations with a remaining right", () => {
    expect(
      purchaseBudget(50_000, 42_000, { ...negotiation, closed: true }, true)
        .offer,
    ).toBeNull();
  });
  it("does not expose direct purchase during the first session", () => {
    const result = purchaseBudget(50_000, 42_000, undefined, false);
    expect(result.direct).toBeNull();
  });
  it("quotes a deficit without a negative balance or mutating the negotiation", () => {
    const before = structuredClone(negotiation);
    expect(purchaseBudget(50_000, 0, negotiation, false).shortfallMinor).toBe(
      46_000,
    );
    expect(negotiation).toEqual(before);
  });
});
