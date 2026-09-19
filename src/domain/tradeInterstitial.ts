import type { GameState } from "./models";
import { completedTradeCount } from "./economy";
import { hasPremiumEntitlement } from "./monetization";

export const TRADE_INTERSTITIAL_INTERVAL = 30;

// A sale always settles first. Ads are a best-effort presentation and can
// never veto, undo, or delay the economic transaction.
export const shouldShowTradeInterstitial = (
  before: Pick<GameState, "ownedAssets" | "monetization">,
  after: Pick<GameState, "ownedAssets" | "monetization">,
): boolean => {
  const previous = completedTradeCount(before);
  const current = completedTradeCount(after);
  return (
    current > previous &&
    current > 0 &&
    current % TRADE_INTERSTITIAL_INTERVAL === 0 &&
    !hasPremiumEntitlement(after) &&
    after.monetization.consent.canRequestAds
  );
};
