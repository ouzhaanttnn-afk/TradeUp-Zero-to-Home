import { MONETIZATION_CONFIG } from "../domain/config";
import { marketScanRegenCap } from "../domain/monetization";
import type { GameState } from "../domain/models";

const steadyStateCap =
  MONETIZATION_CONFIG.reward.placementReward.MARKET_SCOUT_SCAN_CREDITS;
const intervalMs =
  (MONETIZATION_CONFIG.reward.placementReward.MARKET_SCOUT_FULL_REFILL_MINUTES *
    60_000) /
  steadyStateCap;

export function marketScanRefillStatus(
  state: Pick<GameState, "lastWallClockMs" | "monetization" | "ownedAssets">,
  requestedWallMs: number,
) {
  const credits = state.monetization.marketScanCredits;
  const cap = marketScanRegenCap(state);
  if (credits >= cap)
    return { full: true, nextCreditSeconds: 0, fullRechargeSeconds: 0, cap };
  const nowWallMs = Math.max(
    requestedWallMs,
    state.lastWallClockMs,
    state.monetization.marketScanRefillAnchorWallMs,
  );
  const elapsedMs = Math.max(
    0,
    nowWallMs - state.monetization.marketScanRefillAnchorWallMs,
  );
  return {
    full: false,
    nextCreditSeconds: Math.max(
      1,
      Math.ceil((intervalMs - (elapsedMs % intervalMs)) / 1_000),
    ),
    fullRechargeSeconds: Math.max(
      1,
      Math.ceil(((cap - credits) * intervalMs - elapsedMs) / 1_000),
    ),
    cap,
  };
}

export const shortDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
};
