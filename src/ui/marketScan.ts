import { MONETIZATION_CONFIG } from "../domain/config";
import type { GameState } from "../domain/models";

const cap =
  MONETIZATION_CONFIG.reward.placementReward.MARKET_SCOUT_SCAN_CREDITS;
const intervalMs =
  (MONETIZATION_CONFIG.reward.placementReward.MARKET_SCOUT_FULL_REFILL_MINUTES *
    60_000) /
  cap;

export function marketScanRefillStatus(
  state: Pick<GameState, "lastWallClockMs" | "monetization">,
  requestedWallMs: number,
) {
  const credits = state.monetization.marketScanCredits;
  if (credits >= cap)
    return { full: true, nextCreditSeconds: 0, fullRechargeSeconds: 0 };
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
  };
}

export const shortDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
};
