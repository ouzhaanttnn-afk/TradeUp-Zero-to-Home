import { describe, expect, it } from "vitest";
import { createPlayerListing, purchaseListing } from "./economy";
import { initialState, market } from "../game";
import {
  activeMarketListings,
  advanceOffline,
  advanceWorldTo,
  effectiveOfflineGameMinutes,
  scanMarket,
  WORLD_CONFIG,
} from "./world";

describe("deterministic market world", () => {
  it("generates identical listings, IDs, and game-time lifetimes", () => {
    const left = market(42, 500_000, 3, 12, 4);
    const right = market(42, 500_000, 3, 12, 4);
    expect(left).toEqual(right);
    expect(left.every((listing) => listing.createdAtGameMin === 12)).toBe(true);
  });

  it("scans incrementally without replacing existing active listings", () => {
    const state = initialState(1_000);
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
    const state = initialState(1_000);
    state.listings = state.listings.slice(0, 2);
    const result = advanceWorldTo(state, state.gameTimeMin);
    expect(result.state).toEqual(state);
    expect(result.summary.arrivals).toBe(0);
  });

  it("expires a listing at its deterministic lifecycle deadline", () => {
    const state = initialState(1_000);
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
    const state = initialState(1_000);
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

    const state = initialState(10_000);
    const backward = advanceOffline(state, 1_000);
    expect(backward.state.gameTimeMin).toBe(0);
    expect(backward.state.lastWallClockMs).toBe(10_000);
  });

  it("protects a representative best opportunity during offline progress", () => {
    const state = initialState(1_000);
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
    let state = initialState(1_000);
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

    const expiryState = structuredClone(listed.state);
    expiryState.playerListings[0].expiresAtGameMin = 1;
    const expired = advanceWorldTo(expiryState, 1);
    expect(expired.state.playerListings[0].state).toBe("EXPIRED");
    expect(expired.state.ownedAssets[0]).toMatchObject({
      state: "IN_INVENTORY",
    });
    expect(expired.state.ownedAssets[0].currentListingId).toBeUndefined();
  });
});
