import { describe, expect, it } from "vitest";
import { initialState } from "../game";
import { shouldShowTradeInterstitial } from "./tradeInterstitial";

describe("trade interstitial gate", () => {
  const at = (count: number) => {
    const state = initialState(0, "SANDBOX");
    state.monetization.consent.canRequestAds = true;
    state.ownedAssets = Array.from({ length: count }, (_, index) => ({
      ...state.ownedAssets[0],
      id: `sold:${index}`,
      state: "SOLD_COMPLETE" as const,
    }));
    return state;
  };

  it("fires once per 30 completed trades, never before settlement", () => {
    expect(shouldShowTradeInterstitial(at(28), at(29))).toBe(false);
    expect(shouldShowTradeInterstitial(at(29), at(30))).toBe(true);
    expect(shouldShowTradeInterstitial(at(30), at(30))).toBe(false);
    expect(shouldShowTradeInterstitial(at(59), at(60))).toBe(true);
  });

  it("skips without consent and for verified Premium", () => {
    const before = at(29);
    const after = at(30);
    after.monetization.consent.canRequestAds = false;
    expect(shouldShowTradeInterstitial(before, after)).toBe(false);
    after.monetization.consent.canRequestAds = true;
    after.monetization.entitlements = [
      {
        productId: "tradeup_premium_lifetime",
        entitlementId: "premium_lifetime",
        platform: "ios",
        status: "OWNED",
      },
    ];
    expect(shouldShowTradeInterstitial(before, after)).toBe(false);
  });
});
