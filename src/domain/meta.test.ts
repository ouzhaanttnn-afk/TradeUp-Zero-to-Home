import { describe, expect, it } from "vitest";
import { initialState } from "../game";
import {
  setAnalyticsEnabled,
  trackAnalytics,
} from "../infrastructure/analytics";
import { purchaseListing, settleAssetSale } from "./economy";
import {
  addSavedSearch,
  categoryExpertiseLevel,
  gainExpertise,
  marketExpertiseLevel,
  recordCompletedSaleMeta,
  savedSearchMatches,
  toggleWatch,
} from "./meta";
import { advanceWorldTo } from "./world";

const fundedSandbox = () => {
  const state = initialState(0, "SANDBOX");
  state.cashMinor = 1_000_000;
  state.transactionJournal[0] = {
    ...state.transactionJournal[0],
    cashDeltaMinor: 1_000_000,
  };
  return state;
};

describe("expertise progression", () => {
  it("grants information XP once per action and never changes listing price", () => {
    const state = fundedSandbox();
    const listing = state.listings[0];
    const first = gainExpertise(
      state,
      "listingOpen",
      listing.familyId,
      listing.id,
    );
    const duplicate = gainExpertise(
      first,
      "listingOpen",
      listing.familyId,
      listing.id,
    );

    expect(first.expertise.marketXp).toBeGreaterThan(0);
    expect(duplicate.expertise).toEqual(first.expertise);
    expect(duplicate.listings[0].priceMinor).toBe(listing.priceMinor);
    expect(
      categoryExpertiseLevel(first, listing.instance.family.category),
    ).toBeGreaterThanOrEqual(0);
    expect(marketExpertiseLevel(first)).toBeGreaterThanOrEqual(0);
  });
});

describe("Takip", () => {
  it.each([
    [-1, 50],
    [1.5, 50],
    [NaN, 50],
    [Infinity, 50],
    [Number.MAX_SAFE_INTEGER + 1, 50],
    [100, -1],
    [100, 101],
    [100, NaN],
  ])(
    "rejects invalid alarm values %s / %s without changing the state",
    (price, condition) => {
      const state = fundedSandbox();
      expect(
        addSavedSearch(state, state.listings[0].familyId, price, condition),
      ).toBe(state);
    },
  );

  it("rejects unknown families and keeps valid duplicate alarms idempotent", () => {
    const state = fundedSandbox();
    expect(addSavedSearch(state, "missing-family", 100, 50)).toBe(state);
    const saved = addSavedSearch(state, state.listings[0].familyId, 100, 50);
    expect(addSavedSearch(saved, state.listings[0].familyId, 100, 50)).toBe(
      saved,
    );
  });
  it("keeps a watched listing purchasable and clears its watch entry", () => {
    const state = fundedSandbox();
    const listing = state.listings[0];
    const watched = toggleWatch(state, listing.id);
    const purchase = purchaseListing(watched, listing, 20_000, 1);

    expect(purchase.ok).toBe(true);
    if (purchase.ok) {
      expect(purchase.state.follow.watchedListingIds).not.toContain(listing.id);
      expect(purchase.state.listings[0].state).toBe("SOLD_TO_PLAYER");
    }
  });

  it("records a watched listing as a missed opportunity when it expires", () => {
    const state = fundedSandbox();
    const listing = state.listings[0];
    state.listings = [{ ...listing, createdAtGameMin: 0, expiresAtGameMin: 1 }];
    const watched = toggleWatch(state, listing.id);
    const result = advanceWorldTo(watched, 1);

    expect(result.state.follow.watchedListingIds).not.toContain(listing.id);
    expect(result.state.follow.missedOpportunities[0]).toMatchObject({
      listingId: listing.id,
      reason: "EXPIRED",
    });
    expect(
      result.state.analytics.events.some(
        (event) => event.name === "opportunity_lost",
      ),
    ).toBe(true);
  });

  it("stores every saved-search constraint and matches all of them", () => {
    const state = fundedSandbox();
    const listing = state.listings[0];
    const saved = addSavedSearch(
      state,
      listing.familyId,
      listing.priceMinor,
      listing.instance.condition,
      "ANY",
    );

    expect(saved.follow.savedSearches[0]).toMatchObject({
      familyId: listing.familyId,
      maxPriceMinor: listing.priceMinor,
      minCondition: listing.instance.condition,
      evidencePreference: "ANY",
    });
    expect(savedSearchMatches(saved.follow.savedSearches[0], listing)).toBe(
      true,
    );
  });
});

describe("career, home and analytics meta", () => {
  it("builds meaningful append-only sale events and reveals home after profit", () => {
    const start = fundedSandbox();
    start.ftue.stage = "COMPLETE";
    const listing = start.listings[0];
    const purchase = purchaseListing(start, listing, 20_000, 2);
    if (!purchase.ok) throw new Error(purchase.reason);
    const beforeSale = purchase.state;
    const asset = beforeSale.ownedAssets[0];
    const transactionId = "sale:meta-test";
    const sale = settleAssetSale(
      beforeSale,
      asset.id,
      32_000,
      transactionId,
      4,
    );
    if (!sale.ok) throw new Error(sale.reason);
    const meta = recordCompletedSaleMeta(
      beforeSale,
      sale.state,
      asset.id,
      transactionId,
    );

    expect(meta.home.unlocked).toBe(true);
    expect(meta.career.map((event) => event.type)).toEqual(
      expect.arrayContaining([
        "FIRST_SALE",
        "FIRST_PROFITABLE_SALE",
        "BEST_FLIP_UPDATED",
      ]),
    );
    expect(meta.career.some((event) => event.type === "LEGACY")).toBe(false);
    expect(
      meta.analytics.events.some((event) => event.name === "sale_complete"),
    ).toBe(true);

    const duplicate = recordCompletedSaleMeta(
      beforeSale,
      meta,
      asset.id,
      transactionId,
    );
    expect(duplicate.career).toEqual(meta.career);
  });

  it("stops collection and clears local events when analytics is disabled", () => {
    const state = trackAnalytics(
      fundedSandbox(),
      "listing_open",
      { familyId: "notebook" },
      "one",
    );
    const optedOut = setAnalyticsEnabled(state, false);
    const after = trackAnalytics(
      optedOut,
      "listing_open",
      { familyId: "phone" },
      "two",
    );

    expect(after.analytics).toEqual({ enabled: false, events: [] });
  });
});
