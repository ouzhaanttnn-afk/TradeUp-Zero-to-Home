import { describe, expect, it } from "vitest";
import { initialState } from "../game";
import { EARLY_GAME_CONFIG } from "../domain/config";
import { marketScanRefillStatus, shortDuration } from "./marketScan";

describe("market scan refill presentation", () => {
  it("shows the next credit and 30-minute full refill from the persisted anchor", () => {
    const state = initialState(1_000, "SANDBOX");
    state.monetization.marketScanCredits = 0;
    state.monetization.marketScanRefillAnchorWallMs = 1_000;
    expect(marketScanRefillStatus(state, 1_000)).toEqual({
      full: false,
      nextCreditSeconds: 72,
      fullRechargeSeconds: 1_800,
      cap: 25,
    });
    expect(marketScanRefillStatus(state, 61_000).nextCreditSeconds).toBe(12);
  });

  it("keeps the cap at 25 once past the early-game completed-trade threshold", () => {
    const state = initialState(1_000, "SANDBOX");
    state.ownedAssets = Array.from(
      { length: EARLY_GAME_CONFIG.completedTradeThreshold },
      (_, index) => ({
        ...state.ownedAssets[0],
        id: `veteran-sale-${index}`,
        state: "SOLD_COMPLETE" as const,
        instance: state.listings[0].instance,
      }),
    );
    state.monetization.marketScanCredits = 0;
    state.monetization.marketScanRefillAnchorWallMs = 1_000;
    expect(marketScanRefillStatus(state, 1_000)).toMatchObject({
      fullRechargeSeconds: 1_800,
      cap: 25,
    });
  });

  it("formats a compact mobile countdown", () => {
    expect(shortDuration(72)).toBe("1:12");
    expect(shortDuration(8)).toBe("0:08");
  });
});
