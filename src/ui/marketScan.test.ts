import { describe, expect, it } from "vitest";
import { initialState } from "../game";
import { marketScanRefillStatus, shortDuration } from "./marketScan";

describe("market scan refill presentation", () => {
  it("shows the next credit and full refill from the persisted anchor", () => {
    const state = initialState(1_000, "SANDBOX");
    state.monetization.marketScanCredits = 0;
    state.monetization.marketScanRefillAnchorWallMs = 1_000;
    expect(marketScanRefillStatus(state, 1_000)).toEqual({
      full: false,
      nextCreditSeconds: 72,
      fullRechargeSeconds: 1_800,
    });
    expect(marketScanRefillStatus(state, 61_000).nextCreditSeconds).toBe(12);
  });

  it("formats a compact mobile countdown", () => {
    expect(shortDuration(72)).toBe("1:12");
    expect(shortDuration(8)).toBe("0:08");
  });
});
