import { describe, expect, it } from "vitest";
import { initialState } from "../game";
import type { GameState } from "./models";
import { reconcileJournal } from "./economy";
import {
  applyRewardedResult,
  closeRewardedAction,
  getRewardEligibility,
  marketScanRegenCap,
  rechargeMarketScanCredits,
  requestMonetizedAction,
  setRewardEntitlement,
} from "./monetization";

const ready = (credits = 0) => {
  const game = initialState(1000, "SANDBOX");
  game.monetization.marketScanCredits = credits;
  game.monetization.consent.canRequestAds = true;
  return game;
};
const claim = (state: GameState, source: "ad" | "premium" = "ad") => {
  const requested = requestMonetizedAction(state, "MARKET_SCOUT", source);
  if (!requested.ok) throw new Error(requested.reason);
  return source === "ad"
    ? applyRewardedResult(requested.state, requested.rewardId)
    : requested.state;
};
const mature = (game: GameState) => ({
  ...game,
  ownedAssets: Array.from({ length: 30 }, (_, index) => ({
    ...game.ownedAssets[0],
    id: `market-sale-${index}`,
    state: "SOLD_COMPLETE" as const,
  })),
});
const inspection = {
  id: "inspect",
  kind: "INSPECTION" as const,
  gameTime: 0,
  cashDeltaMinor: 0,
  costBasisDeltaMinor: 0,
  realizedProfitDeltaMinor: 0,
  metadata: { status: "IN_PROGRESS", completesAtGameMin: 22 },
};

describe("unlimited voluntary MARKET_SCOUT", () => {
  it.each([0, 1, 20, 26, 49])(
    "adds 25 to %i, capped at 50, without sale/play-time gates",
    (credits) => {
      const game = ready(credits);
      expect(game.monetization.firstSaleComplete).toBe(false);
      expect(game.monetization.lifetimeActivePlayMinutes).toBe(0);
      const next = claim(game);
      expect(next.monetization.marketScanCredits).toBe(
        Math.min(50, credits + 25),
      );
      expect(next.monetization.rewardCooldownUntilWallMs).toBeUndefined();
      expect(next.monetization.usage.sessionRewardCount).toBe(0);
      expect(next.listings).toBe(game.listings);
      expect(next.gameTimeMin).toBe(game.gameTimeMin);
      expect(next.cashMinor).toBe(game.cashMinor);
      expect(next.transactionJournal).toBe(game.transactionJournal);
      expect(reconcileJournal(next)).toEqual({
        cash: true,
        activeBookCost: true,
        realizedProfit: true,
      });
    },
  );

  it("has capacity 25 from the 30th completed trade, never grants excess", () => {
    const game = mature(ready(12));
    expect(marketScanRegenCap(game)).toBe(25);
    const next = claim(game);
    expect(next.monetization.marketScanCredits).toBe(25);
    expect(getRewardEligibility(next, "MARKET_SCOUT")).toEqual({
      ok: false,
      reason: "MISSING_PRECONDITION",
    });
    expect(getRewardEligibility(ready(50), "MARKET_SCOUT")).toEqual({
      ok: false,
      reason: "MISSING_PRECONDITION",
    });
  });

  it("ignores all caps and cooldowns, without exhausting other placements' evidence", () => {
    let game = ready();
    game.monetization.firstSaleComplete = true;
    game.monetization.lifetimeActivePlayMinutes = 20;
    game.transactionJournal.push(inspection);
    game.monetization.rewardTransactions = Array.from(
      { length: 8 },
      (_, index) => ({
        id: `other-${index}`,
        placementId: "LISTING_REACH",
        source: "ad",
        status: "APPLIED",
        requestedAt: 0,
        appliedAtWallMs: 1000,
        sessionId: -1,
      }),
    );
    game.monetization.usage.sessionRewardCount = 4;
    for (let index = 0; index < 1250; index += 1) {
      game = claim({
        ...game,
        monetization: { ...game.monetization, marketScanCredits: 0 },
      });
    }
    expect(
      game.monetization.rewardTransactions.filter(
        (entry) => entry.placementId === "LISTING_REACH",
      ),
    ).toHaveLength(8);
    expect(game.monetization.rewardTransactions.length).toBeLessThan(15);
    expect(getRewardEligibility(game, "FAST_INSPECTION")).toEqual({
      ok: false,
      reason: "GLOBAL_CAP",
    });
    game.monetization.rewardCooldownUntilWallMs = 91_000;
    const next = claim({
      ...game,
      monetization: { ...game.monetization, marketScanCredits: 0 },
    });
    expect(next.monetization.rewardCooldownUntilWallMs).toBe(91_000);
    expect(getRewardEligibility(next, "FAST_INSPECTION")).toEqual({
      ok: false,
      reason: "COOLDOWN",
    });
  });

  it.each(["FAILED", "CANCELLED"] as const)(
    "does not grant after %s, even with a late callback",
    (status) => {
      const game = ready(8);
      const request = requestMonetizedAction(game, "MARKET_SCOUT", "ad");
      if (!request.ok) throw new Error(request.reason);
      const closed = closeRewardedAction(
        request.state,
        request.rewardId,
        status,
      );
      expect(applyRewardedResult(closed, request.rewardId)).toBe(closed);
      expect(closed.monetization.marketScanCredits).toBe(8);
      const retry = requestMonetizedAction(closed, "MARKET_SCOUT", "ad");
      expect(retry.ok).toBe(true);
    },
  );

  it("is idempotent across save/load and does not duplicate an in-flight request", () => {
    const request = requestMonetizedAction(ready(10), "MARKET_SCOUT", "ad");
    if (!request.ok) throw new Error(request.reason);
    const duplicate = requestMonetizedAction(
      { ...request.state, gameTimeMin: 3 },
      "MARKET_SCOUT",
      "ad",
    );
    if (!duplicate.ok) throw new Error(duplicate.reason);
    expect(duplicate.rewardId).toBe(request.rewardId);
    const next = applyRewardedResult(
      JSON.parse(JSON.stringify(duplicate.state)),
      request.rewardId,
    );
    expect(next.monetization.marketScanCredits).toBe(35);
    expect(applyRewardedResult(next, request.rewardId)).toBe(next);
  });

  it("preserves partial regeneration, caps a late reward against live credits and capacity", () => {
    const game = ready(10);
    const request = requestMonetizedAction(game, "MARKET_SCOUT", "ad");
    if (!request.ok) throw new Error(request.reason);
    const live = rechargeMarketScanCredits(request.state, 73_000);
    const next = applyRewardedResult(live, request.rewardId);
    expect(next.monetization.marketScanCredits).toBe(36);
    expect(next.monetization.marketScanRefillAnchorWallMs).toBe(73_000);
    const full = rechargeMarketScanCredits(request.state, 3_601_000);
    const capped = applyRewardedResult(full, request.rewardId);
    expect(capped.monetization.marketScanCredits).toBe(50);
    expect(capped.monetization.rewardTransactions.at(-1)?.status).toBe(
      "APPLIED",
    );
    expect(
      applyRewardedResult(mature(live), request.rewardId).monetization
        .marketScanCredits,
    ).toBe(25);
  });

  it.each(["tradeup_premium_lifetime", "tradeup_no_ads_lifetime"] as const)(
    "preserves %s bypass with the same increment/cap",
    (sku) => {
      const game = setRewardEntitlement(ready(1), sku, true);
      game.monetization.consent.canRequestAds = false;
      const first = claim(game, "premium");
      expect(first.monetization.marketScanCredits).toBe(26);
      expect(claim(first, "premium").monetization.marketScanCredits).toBe(50);
      expect(first.monetization.entitlements).toEqual(
        game.monetization.entitlements,
      );
    },
  );

  it("preserves other-placement cooldown/session/placement limits", () => {
    const game = ready();
    game.monetization.firstSaleComplete = true;
    game.monetization.lifetimeActivePlayMinutes = 20;
    game.transactionJournal.push(inspection);
    const request = requestMonetizedAction(game, "FAST_INSPECTION", "ad");
    if (!request.ok) throw new Error(request.reason);
    const done = applyRewardedResult(request.state, request.rewardId);
    done.transactionJournal.push({ ...inspection, id: "inspect-next" });
    expect(getRewardEligibility(done, "FAST_INSPECTION")).toEqual({
      ok: false,
      reason: "COOLDOWN",
    });
    done.monetization.rewardClockWallMs = 91_000;
    done.monetization.rewardTransactions = Array.from(
      { length: 4 },
      (_, index) => ({
        ...done.monetization.rewardTransactions[0],
        id: `same-session-${index}`,
        appliedAtWallMs: 91_000,
      }),
    );
    expect(getRewardEligibility(done, "FAST_INSPECTION")).toEqual({
      ok: false,
      reason: "SESSION_CAP",
    });
    done.monetization.rewardTransactions = done.monetization.rewardTransactions
      .slice(0, 3)
      .map((entry) => ({ ...entry, sessionId: -1 }));
    expect(getRewardEligibility(done, "FAST_INSPECTION")).toEqual({
      ok: false,
      reason: "PLACEMENT_CAP",
    });
  });
});
