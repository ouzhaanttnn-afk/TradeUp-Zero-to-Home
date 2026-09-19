import { describe, expect, it } from "vitest";
import {
  createPlayerListing,
  FTUE_STARTING_ASSET_ID,
  purchaseListing,
  settleAssetSale,
} from "./economy";
import { activeMarketEvent } from "./marketEvents";
import { BUYER_TEMPO_CONFIG, EARLY_GAME_CONFIG } from "./config";
import { initialState, market } from "../game";
import {
  activeMarketListings,
  advanceOffline,
  advanceWorldTo,
  buyerOfferForMinute,
  earlyGameTempo,
  effectiveOfflineGameMinutes,
  npcRiskSignal,
  scanMarket,
  WORLD_CONFIG,
} from "./world";

const withOwnedAssets = (
  count: number,
  extra: Partial<ReturnType<typeof initialState>["ownedAssets"][number]> = {},
) => ({
  ownedAssets: Array.from({ length: count }, (_, index) => ({
    id: `sold-${index}`,
    familyId: "notebook",
    sourceListingId: `listing-${index}`,
    instance: initialState(1_000, "SANDBOX").listings[0].instance,
    state: "SOLD_COMPLETE" as const,
    purchasePriceMinor: 10_000,
    preparationCostMinor: 0,
    inspectionCostMinor: 0,
    transparentFeesMinor: 0,
    bookCostMinor: 10_000,
    acquiredAtGameMin: 0,
    ...extra,
  })),
});

describe("deterministic market world", () => {
  it("keeps the medium-demand card signal short enough for the mobile grid", () => {
    const listing = structuredClone(initialState(1_000, "SANDBOX").listings[0]);
    listing.priceMinor = Math.round(listing.instance.fairValueMinor * 1.18);
    listing.instance.family.liquidity = 1;
    listing.instance.family.demand = 1;
    listing.urgency = 0;
    listing.interest = 0;
    listing.createdAtGameMin = 0;
    listing.expiresAtGameMin = 100;

    expect(npcRiskSignal(listing, 0)).toEqual({
      level: "medium",
      text: "Talep çok",
    });
  });

  it("does not punish an unfinished first session while the app is closed", () => {
    const state = initialState(1_000);
    const result = advanceOffline(state, 24 * 60 * 60_000);
    expect(result.state.gameTimeMin).toBe(0);
    expect(result.state.buyerOffers).toEqual(state.buyerOffers);
    expect(result.state.ftue.stage).toBe("STARTING_SALE");
  });

  it("generates identical listings, IDs, and game-time lifetimes", () => {
    const left = market(42, 500_000, 3, 12, 4);
    const right = market(42, 500_000, 3, 12, 4);
    expect(left).toEqual(right);
    expect(left.every((listing) => listing.createdAtGameMin === 12)).toBe(true);
  });

  it("scans incrementally without replacing existing active listings", () => {
    const state = initialState(1_000, "SANDBOX");
    const existingIds = activeMarketListings(state).map(
      (listing) => listing.id,
    );
    const result = scanMarket(state);
    const nextIds = activeMarketListings(result.state).map(
      (listing) => listing.id,
    );

    expect(result.state.gameTimeMin).toBe(WORLD_CONFIG.scanAdvanceMin);
    expect(result.summary.arrivals).toBe(WORLD_CONFIG.scanArrivalCount);
    expect(nextIds).toEqual(expect.arrayContaining(existingIds));
    expect(new Set(nextIds).size).toBe(nextIds.length);
  });

  it("does not mutate the market when no game time advances", () => {
    const state = initialState(1_000, "SANDBOX");
    state.listings = state.listings.slice(0, 2);
    const result = advanceWorldTo(state, state.gameTimeMin);
    expect(result.state).toEqual(state);
    expect(result.summary.arrivals).toBe(0);
  });

  it("expires a listing at its deterministic lifecycle deadline", () => {
    const state = initialState(1_000, "SANDBOX");
    state.listings = [
      {
        ...state.listings[0],
        createdAtGameMin: 0,
        expiresAtGameMin: 1,
      },
    ];
    const result = advanceWorldTo(state, 1);

    expect(result.summary.marketExpirations).toBe(1);
    expect(
      result.state.listings.find(
        (listing) => listing.id === state.listings[0].id,
      ),
    ).toMatchObject({ state: "EXPIRED", exitReason: "EXPIRED" });
  });

  it("replays NPC competition identically and can close an active listing", () => {
    const state = initialState(1_000, "SANDBOX");
    const listing = {
      ...state.listings[0],
      createdAtGameMin: 0,
      expiresAtGameMin: 1_000,
      priceMinor: Math.round(state.listings[0].instance.fairValueMinor * 0.7),
      interest: 100,
      urgency: 1,
    };
    state.listings = [listing];
    state.negotiation = {
      listingId: listing.id,
      offersRemaining: 1,
      sellerFloorMinor: listing.priceMinor,
      closed: false,
    };
    const left = advanceWorldTo(structuredClone(state), 200);
    const right = advanceWorldTo(structuredClone(state), 200);

    expect(left).toEqual(right);
    expect(left.summary.npcSales).toBe(1);
    expect(
      left.state.listings.find((item) => item.id === listing.id)?.state,
    ).toBe("SOLD_TO_NPC");
    expect(left.state.negotiation?.closed).toBe(true);
  });

  it("clamps backward and long offline wall-clock deltas", () => {
    expect(effectiveOfflineGameMinutes(-60_000)).toBe(0);
    expect(effectiveOfflineGameMinutes(15 * 60_000)).toBe(15);
    expect(effectiveOfflineGameMinutes(60 * 60_000)).toBe(30);
    expect(effectiveOfflineGameMinutes(240 * 60_000)).toBe(93);
    expect(effectiveOfflineGameMinutes(24 * 60 * 60_000)).toBe(93);

    const state = initialState(10_000, "SANDBOX");
    const backward = advanceOffline(state, 1_000);
    expect(backward.state.gameTimeMin).toBe(0);
    expect(backward.state.lastWallClockMs).toBe(10_000);
  });

  it("protects a representative best opportunity during offline progress", () => {
    const state = initialState(1_000, "SANDBOX");
    const best = [...activeMarketListings(state)].sort(
      (left, right) =>
        left.priceMinor / left.instance.fairValueMinor -
        right.priceMinor / right.instance.fairValueMinor,
    )[0];
    const result = advanceOffline(state, 24 * 60 * 60_000 + 1_000);

    expect(result.state.gameTimeMin).toBe(93);
    expect(result.state.lastWallClockMs).toBe(24 * 60 * 60_000 + 1_000);
    expect(
      activeMarketListings(result.state).some(
        (listing) => listing.id === best.id,
      ),
    ).toBe(true);
    expect(activeMarketListings(result.state).length).toBeGreaterThanOrEqual(
      WORLD_CONFIG.minActiveListings,
    );
  });

  it("creates replayable buyer offers from world time and expires listings safely", () => {
    let state = initialState(1_000, "SANDBOX");
    state.cashMinor = 100_000;
    state.transactionJournal[0] = {
      ...state.transactionJournal[0],
      cashDeltaMinor: 100_000,
    };
    const purchase = purchaseListing(state, state.listings[0], 20_000, 0);
    if (!purchase.ok) throw new Error(purchase.reason);
    const listed = createPlayerListing(
      purchase.state,
      purchase.state.ownedAssets[0].id,
      25_000,
      0,
    );
    if (!listed.ok) throw new Error(listed.reason);

    const left = advanceWorldTo(structuredClone(listed.state), 200);
    const right = advanceWorldTo(structuredClone(listed.state), 200);
    expect(left).toEqual(right);
    expect(left.summary.buyerOffers).toBeGreaterThan(0);
    expect(left.state.buyerOffers.length).toBeLessThanOrEqual(1);
    expect(left.state.buyerOffers[0]?.buyerType).toBeTruthy();

    const expiryState = structuredClone(listed.state);
    expiryState.playerListings[0].expiresAtGameMin = 1;
    const expired = advanceWorldTo(expiryState, 1);
    expect(expired.state.playerListings[0].state).toBe("EXPIRED");
    expect(expired.state.ownedAssets[0]).toMatchObject({
      state: "IN_INVENTORY",
    });
    expect(expired.state.ownedAssets[0].currentListingId).toBeUndefined();
  });

  it("tapers early-game buyer tempo support by real completed trades, not session state", () => {
    const boosts = EARLY_GAME_CONFIG.buyerTempoBoostByTradeIndex;
    const freshPlayer = { ownedAssets: [] as never[] };
    expect(earlyGameTempo(freshPlayer).arrivalMultiplier).toBeCloseTo(
      BUYER_TEMPO_CONFIG.arrivalMultiplier * boosts[0],
    );

    const afterOneTrade = withOwnedAssets(1);
    expect(earlyGameTempo(afterOneTrade).arrivalMultiplier).toBeCloseTo(
      BUYER_TEMPO_CONFIG.arrivalMultiplier * boosts[1],
    );

    const afterSupportWindow = withOwnedAssets(boosts.length);
    expect(earlyGameTempo(afterSupportWindow)).toEqual(BUYER_TEMPO_CONFIG);

    // The gifted starting notebook is not a "real" trade: it must not count
    // toward tapering off the support it exists to provide.
    const onlyStartingNotebookSold = withOwnedAssets(1, {
      id: FTUE_STARTING_ASSET_ID,
      purchasePriceMinor: 0,
      bookCostMinor: 0,
    });
    expect(earlyGameTempo(onlyStartingNotebookSold)).toEqual(
      earlyGameTempo(freshPlayer),
    );
  });

  it("does not reset buyer tempo support by relisting the same asset or restarting", () => {
    let state = initialState(1_000, "SANDBOX");
    state.cashMinor = 200_000;
    state.transactionJournal[0] = {
      ...state.transactionJournal[0],
      cashDeltaMinor: 200_000,
    };
    const purchase = purchaseListing(state, state.listings[0], 20_000, 0);
    if (!purchase.ok) throw new Error(purchase.reason);
    let working = purchase.state;
    const assetId = working.ownedAssets[0].id;
    const firstListing = createPlayerListing(working, assetId, 25_000, 0);
    if (!firstListing.ok) throw new Error(firstListing.reason);
    working = firstListing.state;
    const beforeSale = earlyGameTempo(working);

    // Withdraw and relist the same asset several times without completing a
    // sale: tempo support must be unaffected, since it only counts real
    // completed trades.
    for (let round = 0; round < 3; round += 1) {
      working = {
        ...working,
        playerListings: working.playerListings.map((listing) => ({
          ...listing,
          state: "WITHDRAWN" as const,
        })),
        ownedAssets: working.ownedAssets.map((asset) => ({
          ...asset,
          state: "IN_INVENTORY" as const,
          currentListingId: undefined,
        })),
      };
      const relisted = createPlayerListing(
        working,
        assetId,
        25_000 + round,
        round + 1,
      );
      if (!relisted.ok) throw new Error(relisted.reason);
      working = relisted.state;
      expect(earlyGameTempo(working)).toEqual(beforeSale);
    }

    // Completing the sale is the only thing that should move the taper.
    const sold = settleAssetSale(working, assetId, 30_000, "sale:test", 10);
    if (!sold.ok) throw new Error(sold.reason);
    expect(earlyGameTempo(sold.state)).not.toEqual(beforeSale);

    // Simulating an app restart (a fresh initialState-less reload just
    // resumes the same persisted state) does not change the derived tempo.
    const reloaded = structuredClone(sold.state);
    expect(earlyGameTempo(reloaded)).toEqual(earlyGameTempo(sold.state));
  });

  it("gives Pazar Radarı HIGH/RISING categories a real, bounded arrival edge and never blocks other categories", () => {
    let state = initialState(1_000, "SANDBOX");
    state.cashMinor = 200_000;
    state.transactionJournal[0] = {
      ...state.transactionJournal[0],
      cashDeltaMinor: 200_000,
    };
    const purchase = purchaseListing(state, state.listings[0], 20_000, 0);
    if (!purchase.ok) throw new Error(purchase.reason);
    const listed = createPlayerListing(
      purchase.state,
      purchase.state.ownedAssets[0].id,
      Math.round(purchase.state.ownedAssets[0].instance.fairValueMinor * 0.75),
      0,
    );
    if (!listed.ok) throw new Error(listed.reason);
    const playerListing = listed.state.playerListings[0];

    let gameTimeMin = 180;
    let event = activeMarketEvent(listed.state.seed, gameTimeMin);
    while (event?.radarTier !== "HIGH") {
      gameTimeMin += 1;
      event = activeMarketEvent(listed.state.seed, gameTimeMin);
      if (gameTimeMin > 180 + 360 * 20) {
        throw new Error("No HIGH radar window found in a reasonable range");
      }
    }
    const boostedCategory = event.affectedCategories[0];
    const unaffectedCategory = "unrelated-category";

    const withCategory = (category: string) => ({
      ...listed.state,
      ownedAssets: listed.state.ownedAssets.map((asset) =>
        asset.id === playerListing.ownedAssetId
          ? {
              ...asset,
              instance: {
                ...asset.instance,
                family: {
                  ...asset.instance.family,
                  category,
                  demand: 1,
                  liquidity: 1,
                },
              },
            }
          : asset,
      ),
    });
    const boostedState = withCategory(boostedCategory);
    const plainState = withCategory(unaffectedCategory);

    // buyerOfferForMinute's roll is a single-step LCG keyed by rollSalt, so
    // consecutive salts advance the roll by a fixed step (~1664525/2^32)
    // rather than sampling independently. 2,600+ consecutive salts guarantee
    // at least one full sweep through [0, 1), so the loop is certain (not
    // merely likely) to land inside the plain/boosted threshold gap once.
    let plainCount = 0;
    let gapSaltFound = false;
    for (let salt = 0; salt < 3_000; salt += 1) {
      const plain = buyerOfferForMinute(
        plainState,
        playerListing,
        gameTimeMin,
        salt,
      );
      const boosted = buyerOfferForMinute(
        boostedState,
        playerListing,
        gameTimeMin,
        salt,
      );
      if (plain) plainCount += 1;
      // The event multiplier only ever scales the same underlying roll up,
      // never down, for an affected category: this must never fail.
      if (plain) expect(boosted).toBeTruthy();
      if (!plain && boosted) gapSaltFound = true;
    }

    expect(plainCount).toBeGreaterThan(0); // unaffected categories still sell
    expect(gapSaltFound).toBe(true); // the radar boost is a real, visible edge
  });
});
