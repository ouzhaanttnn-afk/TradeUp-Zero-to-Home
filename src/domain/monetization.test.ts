import { describe, expect, it } from "vitest";
import { initialState } from "../game";
import type { Listing } from "./models";
import {
  applyRewardedResult,
  advanceRewardState,
  closeRewardedAction,
  getRewardEligibility,
  markFirstSaleComplete,
  rechargeMarketScanCredits,
  requestMonetizedAction,
  setRewardEntitlement,
  syncConsentState,
  syncVerifiedEntitlement,
} from "./monetization";

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
  it("refills one scan per 72 seconds and reaches 25 after 30 minutes", () => {
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

    const full = rechargeMarketScanCredits(empty, 1_801_000);
    expect(full.monetization.marketScanCredits).toBe(25);
    expect(full.monetization.marketScanRefillAnchorWallMs).toBe(1_801_000);
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
