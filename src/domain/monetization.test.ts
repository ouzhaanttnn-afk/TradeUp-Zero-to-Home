import { describe, expect, it } from "vitest";
import { initialState } from "../game";
import type { Listing } from "./models";
import {
  advanceRewardClock,
  beginRewardSession,
  applyRewardedResult,
  advanceRewardState,
  closeRewardedAction,
  getRewardEligibility,
  markFirstSaleComplete,
  rechargeMarketScanCredits,
  hasAdFreeEntitlement,
  requestMonetizedAction,
  setRewardEntitlement,
  syncConsentState,
  syncVerifiedEntitlement,
} from "./monetization";
import { ownsAnimatedAvatars } from "./profile";
import {
  createPlayerListing,
  purchaseListing,
  withdrawPlayerListing,
} from "./economy";

const makeReadyForRewards = () => {
  const unlocked = advanceRewardState(
    markFirstSaleComplete(initialState(0, "SANDBOX")),
    20,
  );
  return syncConsentState(
    {
      ...unlocked,
      listings: unlocked.listings.map((listing, index) =>
        index >= 7
          ? { ...listing, state: "SOLD" as Listing["state"] }
          : listing,
      ),
      monetization: {
        ...unlocked.monetization,
        marketScanCredits: 0,
      },
    },
    true,
    false,
  );
};

const inspectionEntry = {
  id: "journal-inspection",
  kind: "INSPECTION" as const,
  gameTime: 20,
  assetId: "owned-0",
  cashDeltaMinor: -1500,
  costBasisDeltaMinor: 0,
  realizedProfitDeltaMinor: 0,
  metadata: { status: "IN_PROGRESS", completesAtGameMin: 22 },
};

describe("monetization reward eligibility", () => {
  it("refills one scan per 72 seconds and reaches 50 after 60 early-game minutes", () => {
    const base = initialState(1_000, "SANDBOX");
    const empty = {
      ...base,
      monetization: {
        ...base.monetization,
        marketScanCredits: 0,
        marketScanRefillAnchorWallMs: 1_000,
      },
    };

    const oneCredit = rechargeMarketScanCredits(empty, 73_000);
    expect(oneCredit.monetization.marketScanCredits).toBe(1);
    expect(oneCredit.monetization.marketScanRefillAnchorWallMs).toBe(73_000);

    const full = rechargeMarketScanCredits(empty, 3_601_000);
    expect(full.monetization.marketScanCredits).toBe(50);
    expect(full.monetization.marketScanRefillAnchorWallMs).toBe(3_601_000);
  });

  it("does not grant scans when the device clock moves backwards", () => {
    const base = initialState(100_000, "SANDBOX");
    const empty = {
      ...base,
      monetization: {
        ...base.monetization,
        marketScanCredits: 0,
        marketScanRefillAnchorWallMs: 100_000,
      },
    };

    expect(
      rechargeMarketScanCredits(empty, 10_000).monetization.marketScanCredits,
    ).toBe(0);
  });
  it("requires first sale unlock and play time before reward actions", () => {
    const locked = initialState(0, "SANDBOX");
    const before = requestMonetizedAction(locked, "MARKET_SCOUT", "ad");
    if (before.ok) throw new Error("Expected blocked until unlock");
    expect(before.ok).toBe(false);
    expect(before.reason).toBe("FIRST_REWARD_BLOCKED");

    const unlocked = makeReadyForRewards();
    const afterUnlock = requestMonetizedAction(unlocked, "MARKET_SCOUT", "ad");
    expect(afterUnlock.ok).toBe(true);
    if (!afterUnlock.ok) throw new Error("Expected request");
    expect(afterUnlock.state.monetization.rewardTransactions[0]?.status).toBe(
      "REQUESTED",
    );
  });

  it("enforces cooldown for repeated reward actions", () => {
    const base = makeReadyForRewards();
    const ready = {
      ...base,
      analytics: {
        ...base.analytics,
        events: Array.from({ length: 8 }, (_, index) => ({
          id: `impression:${index}`,
          name: "listing_impression" as const,
          atGameMin: base.gameTimeMin,
          properties: { listingId: `listing:${index}` },
        })),
      },
    };
    const first = requestMonetizedAction(ready, "MARKET_SCOUT", "ad");
    if (!first.ok) throw new Error("Expected first reward request to succeed");
    expect(first.ok).toBe(true);

    const applied = applyRewardedResult(first.state, first.rewardId);
    const later = {
      ...applied,
      gameTimeMin: applied.gameTimeMin + 1,
      monetization: { ...applied.monetization, marketScanCredits: 0 },
    };
    const second = requestMonetizedAction(later, "MARKET_SCOUT", "ad");
    expect(second.ok).toBe(false);
    if (second.ok) throw new Error("Expected cooldown block");
    expect(second.reason).toBe("COOLDOWN");
  });

  it("blocks missing placement-specific target", () => {
    const ready = makeReadyForRewards();
    const noTarget = getRewardEligibility(ready, "FAST_PREPARATION");
    expect(noTarget).toEqual({ ok: false, reason: "NO_ELIGIBLE_TARGET" });

    const blocked = requestMonetizedAction(ready, "FAST_PREPARATION", "ad");
    expect(blocked.ok).toBe(false);
    if (blocked.ok) throw new Error("Expected missing target block");
    expect(blocked.reason).toBe("NO_ELIGIBLE_TARGET");
  });

  it("is idempotent when the same rewarded action already exists", () => {
    const base = makeReadyForRewards();
    const ready = {
      ...base,
      transactionJournal: [...base.transactionJournal, inspectionEntry],
    };
    const requested = requestMonetizedAction(ready, "FAST_INSPECTION", "ad");
    if (!requested.ok) throw new Error("Expected request");
    const applied = applyRewardedResult(requested.state, requested.rewardId);
    const replay = applyRewardedResult(applied, requested.rewardId);
    expect(replay).toBe(applied);
    expect(replay.monetization.usage.sessionRewardCount).toBe(1);
  });

  it("does not consume caps or cooldown when an ad fails", () => {
    const ready = makeReadyForRewards();
    const requested = requestMonetizedAction(ready, "MARKET_SCOUT", "ad");
    if (!requested.ok) throw new Error("Expected request");
    const failed = closeRewardedAction(
      requested.state,
      requested.rewardId,
      "FAILED",
    );
    expect(failed.monetization.usage.sessionRewardCount).toBe(0);
    expect(failed.monetization.rewardCooldownUntilGameMin).toBeUndefined();
    expect(failed.monetization.rewardCooldownUntilWallMs).toBeUndefined();
  });

  it("starts a cold session without resetting daily caps, entitlements, cash or cooldown", () => {
    const first = requestMonetizedAction(
      makeReadyForRewards(),
      "MARKET_SCOUT",
      "ad",
    );
    if (!first.ok) throw new Error("Expected request");
    const applied = applyRewardedResult(first.state, first.rewardId);
    const cold = beginRewardSession(
      {
        ...applied,
        monetization: { ...applied.monetization, marketScanCredits: 0 },
      },
      30_000,
    );
    expect(cold.monetization.usage.sessionRewardCount).toBe(0);
    expect(cold.monetization.usage.rewardSessionId).toBe(1);
    expect(cold.monetization.rewardTransactions).toEqual(
      applied.monetization.rewardTransactions,
    );
    expect(cold.cashMinor).toBe(applied.cashMinor);
    expect(cold.transactionJournal).toEqual(applied.transactionJournal);
    expect(getRewardEligibility(cold, "MARKET_SCOUT")).toEqual({
      ok: false,
      reason: "COOLDOWN",
    });
    const second = requestMonetizedAction(
      advanceRewardClock(cold, 90_000),
      "MARKET_SCOUT",
      "ad",
    );
    if (!second.ok) throw new Error("Expected second session request");
    const secondApplied = applyRewardedResult(second.state, second.rewardId);
    const thirdSession = beginRewardSession(
      {
        ...secondApplied,
        monetization: { ...secondApplied.monetization, marketScanCredits: 0 },
      },
      180_000,
    );
    expect(getRewardEligibility(thirdSession, "MARKET_SCOUT")).toEqual({
      ok: false,
      reason: "PLACEMENT_CAP",
    });
    expect(
      getRewardEligibility(
        advanceRewardClock(thirdSession, 86_490_000),
        "MARKET_SCOUT",
      ).ok,
    ).toBe(true);
  });

  it("fast game-time advancement and clock rollback cannot bypass real reward limits", () => {
    const first = requestMonetizedAction(
      makeReadyForRewards(),
      "MARKET_SCOUT",
      "ad",
    );
    if (!first.ok) throw new Error("Expected request");
    const applied = applyRewardedResult(first.state, first.rewardId);
    const fast = {
      ...applied,
      gameTimeMin: 10_000,
      monetization: { ...applied.monetization, marketScanCredits: 0 },
    };
    expect(getRewardEligibility(fast, "MARKET_SCOUT")).toEqual({
      ok: false,
      reason: "COOLDOWN",
    });
    const later = advanceRewardClock(fast, 90_000);
    expect(advanceRewardClock(later, 1).monetization.rewardClockWallMs).toBe(
      90_000,
    );
    expect(getRewardEligibility(later, "MARKET_SCOUT")).toEqual({
      ok: false,
      reason: "PLACEMENT_CAP",
    });
  });

  it("a cancelled request can be retried without advancing the game or consuming limits", () => {
    const first = requestMonetizedAction(
      makeReadyForRewards(),
      "MARKET_SCOUT",
      "ad",
    );
    if (!first.ok) throw new Error("Expected request");
    const cancelled = closeRewardedAction(
      first.state,
      first.rewardId,
      "CANCELLED",
    );
    const retry = requestMonetizedAction(cancelled, "MARKET_SCOUT", "ad");
    if (!retry.ok) throw new Error("Expected retry");
    expect(retry.rewardId).not.toBe(first.rewardId);
    expect(retry.state.monetization.usage.sessionRewardCount).toBe(0);
  });

  it("applies reach once per listing lifecycle, including after a no-offer roll and cold reload", () => {
    const ready = { ...makeReadyForRewards(), seed: 1, cashMinor: 100_000_000 };
    const listing = ready.listings[0];
    const bought = purchaseListing(ready, listing, listing.priceMinor, 0);
    if (!bought.ok) throw new Error("Expected purchase");
    const asset = bought.state.ownedAssets.at(-1)!;
    // A deliberately overpriced listing makes the no-offer path deterministic.
    const listed = createPlayerListing(
      bought.state,
      asset.id,
      asset.instance.fairValueMinor * 20,
      0,
    );
    if (!listed.ok) throw new Error("Expected listing");
    const request = requestMonetizedAction(
      { ...listed.state, gameTimeMin: 5 },
      "LISTING_REACH",
      "ad",
    );
    if (!request.ok) throw new Error("Expected reach request");
    const applied = applyRewardedResult(request.state, request.rewardId);
    expect(applied.buyerOffers).toHaveLength(0);
    expect(applied.monetization.usage.sessionRewardCount).toBe(1);
    const listingId = listed.state.playerListings.at(-1)!.id;
    expect(
      applied.transactionJournal.filter(
        (entry) => entry.metadata.exposureRollCompleted === true,
      ),
    ).toHaveLength(1);
    expect(
      getRewardEligibility(
        advanceRewardClock(applied, 90_000),
        "LISTING_REACH",
      ),
    ).toEqual({ ok: false, reason: "NO_ELIGIBLE_TARGET" });
    // Simulate persisted data being reopened beyond the rolling reward window.
    const cold = beginRewardSession(
      JSON.parse(JSON.stringify(applied)),
      86_490_000,
    );
    const cleaned = requestMonetizedAction(cold, "LISTING_REACH", "ad");
    expect(cleaned.ok).toBe(false);
    expect(cleaned.state.monetization.rewardTransactions).toHaveLength(0);
    expect(getRewardEligibility(cleaned.state, "LISTING_REACH")).toEqual({
      ok: false,
      reason: "NO_ELIGIBLE_TARGET",
    });
    expect(cleaned.state.cashMinor).toBe(applied.cashMinor);
    expect(cleaned.state.transactionJournal).toEqual(
      applied.transactionJournal,
    );
    const withdrawn = withdrawPlayerListing(cleaned.state, listingId, 6);
    if (!withdrawn.ok) throw new Error("Expected withdrawal");
    const relisted = createPlayerListing(
      withdrawn.state,
      asset.id,
      asset.instance.fairValueMinor * 20,
      6,
    );
    if (!relisted.ok) throw new Error("Expected new lifecycle");
    expect(
      getRewardEligibility(
        { ...relisted.state, gameTimeMin: 11 },
        "LISTING_REACH",
      ),
    ).toMatchObject({
      ok: true,
      targetId: relisted.state.playerListings.at(-1)!.id,
    });
  });

  it("preserves the rolling global cap across cold starts and session-scoped failure recovery", () => {
    const ready = makeReadyForRewards();
    ready.monetization.rewardTransactions = Array.from(
      { length: 8 },
      (_, index) => ({
        id: `applied:${index}`,
        placementId: "LISTING_REACH",
        source: "ad",
        status: "APPLIED",
        requestedAt: 0,
        appliedAt: 0,
        appliedAtWallMs: 0,
        sessionId: 0,
      }),
    );
    const cold = beginRewardSession(ready, 90_000);
    expect(getRewardEligibility(cold, "MARKET_SCOUT")).toEqual({
      ok: false,
      reason: "GLOBAL_CAP",
    });
    ready.monetization.rewardTransactions = [0, 1].map((index) => ({
      id: `failed:${index}`,
      placementId: "MARKET_SCOUT",
      source: "ad",
      status: "FAILED",
      requestedAt: index,
      requestedAtWallMs: 0,
      sessionId: 0,
    }));
    expect(getRewardEligibility(ready, "MARKET_SCOUT")).toEqual({
      ok: false,
      reason: "PROVIDER_FAILURE_HIDDEN",
    });
    expect(
      getRewardEligibility(beginRewardSession(ready, 90_000), "MARKET_SCOUT")
        .ok,
    ).toBe(true);
  });

  it("restores exactly 25 scans without changing the existing market", () => {
    const ready = makeReadyForRewards();
    const requested = requestMonetizedAction(ready, "MARKET_SCOUT", "ad");
    if (!requested.ok) throw new Error("Expected request");
    const applied = applyRewardedResult(requested.state, requested.rewardId);

    expect(applied.monetization.marketScanCredits).toBe(25);
    expect(applied.listings).toEqual(ready.listings);
    expect(applied.marketCycle).toBe(ready.marketCycle);
  });

  it("requires consent for ads and verified premium ownership for video bypass", () => {
    const ready = makeReadyForRewards();
    const withoutConsent = syncConsentState(ready, false, false);
    const ad = requestMonetizedAction(withoutConsent, "MARKET_SCOUT", "ad");
    expect(ad.ok).toBe(false);
    if (ad.ok) throw new Error("Expected consent block");
    expect(ad.reason).toBe("AD_CONSENT_REQUIRED");

    const premium = requestMonetizedAction(
      withoutConsent,
      "MARKET_SCOUT",
      "premium",
    );
    expect(premium.ok).toBe(false);
    const owned = setRewardEntitlement(
      withoutConsent,
      "tradeup_premium_lifetime",
      true,
    );
    const claimed = requestMonetizedAction(owned, "MARKET_SCOUT", "premium");
    expect(claimed.ok).toBe(true);
    if (!claimed.ok) throw new Error("Expected premium claim");
    expect(claimed.state.monetization.usage.sessionRewardCount).toBe(1);
  });

  it("No Ads bypasses video without cosmetics or extra reward capacity", () => {
    const ready = syncConsentState(makeReadyForRewards(), false, false);
    const noAds = setRewardEntitlement(ready, "tradeup_no_ads_lifetime", true);
    expect(hasAdFreeEntitlement(noAds)).toBe(true);
    expect(ownsAnimatedAvatars(noAds)).toBe(false);
    const claimed = requestMonetizedAction(noAds, "MARKET_SCOUT", "premium");
    expect(claimed.ok).toBe(true);
    if (!claimed.ok) throw new Error("Expected ad-free claim");
    expect(claimed.state.monetization.usage.sessionRewardCount).toBe(1);
    expect(claimed.state.monetization.rewardTransactions[0]?.source).toBe(
      "premium",
    );
    const revoked = syncVerifiedEntitlement(
      noAds,
      "tradeup_no_ads_lifetime",
      "REVOKED",
      "ios",
    );
    expect(hasAdFreeEntitlement(revoked)).toBe(false);
    expect(requestMonetizedAction(revoked, "MARKET_SCOUT", "premium").ok).toBe(
      false,
    );
  });

  it("Premium avatar access survives a standalone refund and standalone access survives Premium refund", () => {
    const premium = setRewardEntitlement(
      initialState(0, "SANDBOX"),
      "tradeup_premium_lifetime",
      true,
      "ios",
    );
    premium.profile.avatarId = "gece-analisti";
    expect(ownsAnimatedAvatars(premium)).toBe(true);
    const withStandalone = setRewardEntitlement(
      premium,
      "tradeup_animated_avatars_01",
      true,
      "ios",
    );
    const standaloneRevoked = syncVerifiedEntitlement(
      withStandalone,
      "tradeup_animated_avatars_01",
      "REVOKED",
      "ios",
    );
    expect(standaloneRevoked.profile.avatarId).toBe("gece-analisti");
    const restoredStandalone = syncVerifiedEntitlement(
      withStandalone,
      "tradeup_premium_lifetime",
      "REVOKED",
      "ios",
    );
    expect(restoredStandalone.profile.avatarId).toBe("gece-analisti");
    const premiumRevoked = syncVerifiedEntitlement(
      standaloneRevoked,
      "tradeup_premium_lifetime",
      "REVOKED",
      "ios",
    );
    expect(premiumRevoked.profile.avatarId).toBe("pazar-kasifi");
  });

  it("applies pending, owned and revoke only from verified sync input", () => {
    const base = initialState(0, "SANDBOX");
    const pending = syncVerifiedEntitlement(
      base,
      "tradeup_theme_workshop",
      "PENDING",
      "android",
    );
    expect(pending.monetization.entitlements[0]?.status).toBe("PENDING");
    const owned = syncVerifiedEntitlement(
      pending,
      "tradeup_theme_workshop",
      "OWNED",
      "android",
    );
    expect(owned.monetization.entitlements[0]?.status).toBe("OWNED");
    const revoked = syncVerifiedEntitlement(
      owned,
      "tradeup_theme_workshop",
      "REVOKED",
      "android",
    );
    expect(revoked.monetization.entitlements[0]?.status).toBe("REVOKED");
    expect(
      revoked.monetization.entitlements.some(
        (entry) => entry.status === "OWNED",
      ),
    ).toBe(false);
  });

  it("grants and safely revokes the cosmetic animated-avatar entitlement", () => {
    const base = initialState(0, "SANDBOX");
    const owned = syncVerifiedEntitlement(
      base,
      "tradeup_animated_avatars_01",
      "OWNED",
      "ios",
    );
    expect(owned.monetization.entitlements[0]).toMatchObject({
      entitlementId: "animated_avatars_01",
      status: "OWNED",
    });
    owned.profile.avatarId = "gece-analisti";

    const revoked = syncVerifiedEntitlement(
      owned,
      "tradeup_animated_avatars_01",
      "REVOKED",
      "ios",
    );
    expect(revoked.profile.avatarId).toBe("pazar-kasifi");
    expect(revoked.monetization.entitlements[0].status).toBe("REVOKED");
  });
});
