import { describe, expect, it } from "vitest";
import { initialState, validateState } from "../game";
import type { GameState, OwnedAsset, OwnershipState } from "./models";
import {
  activeBookCostMinor,
  addAssetCost,
  conservativeMarkToMarketMinor,
  createPlayerListing,
  netWorthMinor,
  purchaseListing,
  reconcileJournal,
  settleAssetSale,
  withdrawPlayerListing,
} from "./economy";

function purchasedState(): GameState {
  const state = initialState();
  state.cashMinor = 100_000;
  state.transactionJournal[0] = {
    ...state.transactionJournal[0],
    cashDeltaMinor: 100_000,
  };
  const result = purchaseListing(state, state.listings[0], 20_000, 10);
  if (!result.ok) throw new Error(result.reason);
  return result.state;
}

describe("canonical ownership and accounting", () => {
  it("keeps an asset in net worth when it is listed", () => {
    const before = purchasedState();
    const asset = before.ownedAssets[0];
    const result = createPlayerListing(before, asset.id, 31_000, 20);
    if (!result.ok) throw new Error(result.reason);

    expect(result.state.ownedAssets).toHaveLength(1);
    expect(result.state.ownedAssets[0].state).toBe("LISTED");
    expect(netWorthMinor(result.state)).toBe(netWorthMinor(before));
    expect(reconcileJournal(result.state)).toEqual({
      cash: true,
      activeBookCost: true,
      realizedProfit: true,
    });
  });

  it("computes completed-sale profit from full book cost, not asking price", () => {
    const purchased = purchasedState();
    const withCost = addAssetCost(
      purchased,
      purchased.ownedAssets[0].id,
      "PREPARATION",
      3_000,
      "preparation:1",
      20,
    );
    if (!withCost.ok) throw new Error(withCost.reason);
    const listed = createPlayerListing(
      withCost.state,
      withCost.state.ownedAssets[0].id,
      40_000,
      30,
    );
    if (!listed.ok) throw new Error(listed.reason);
    const sale = settleAssetSale(
      listed.state,
      listed.state.ownedAssets[0].id,
      35_000,
      "sale:1",
      40,
      listed.state.playerListings[0].id,
    );
    if (!sale.ok) throw new Error(sale.reason);

    expect(sale.state.realizedProfitMinor).toBe(12_000);
    expect(sale.state.ownedAssets[0].state).toBe("SOLD_COMPLETE");
    expect(activeBookCostMinor(sale.state)).toBe(0);
    expect(reconcileJournal(sale.state)).toEqual({
      cash: true,
      activeBookCost: true,
      realizedProfit: true,
    });
  });

  it.each<OwnershipState>([
    "IN_INVENTORY",
    "PREPARING",
    "READY",
    "LISTED",
    "RESERVED",
    "SOLD_PENDING",
  ])("counts %s as player-owned", (ownershipState) => {
    const state = purchasedState();
    state.ownedAssets[0].state = ownershipState;
    expect(netWorthMinor(state)).toBe(
      state.cashMinor + conservativeMarkToMarketMinor(state.ownedAssets[0]),
    );
  });

  it("excludes only SoldComplete from player wealth", () => {
    const state = purchasedState();
    state.ownedAssets[0].state = "SOLD_COMPLETE";
    expect(netWorthMinor(state)).toBe(state.cashMinor);
  });

  it("applies the same sale transaction only once", () => {
    const state = purchasedState();
    const asset = state.ownedAssets[0];
    const first = settleAssetSale(state, asset.id, 30_000, "sale:once", 20);
    if (!first.ok) throw new Error(first.reason);
    const second = settleAssetSale(
      first.state,
      asset.id,
      30_000,
      "sale:once",
      20,
    );
    if (!second.ok) throw new Error(second.reason);

    expect(second.idempotent).toBe(true);
    expect(second.state.cashMinor).toBe(first.state.cashMinor);
    expect(second.state.transactionJournal).toHaveLength(
      first.state.transactionJournal.length,
    );
  });

  it("rejects an unaffordable purchase atomically", () => {
    const state = initialState();
    const before = structuredClone(state);
    const result = purchaseListing(
      state,
      state.listings[0],
      state.cashMinor + 1,
      10,
    );

    expect(result.ok).toBe(false);
    expect(result.state).toEqual(before);
  });

  it("rejects a stale listing atomically", () => {
    const state = initialState();
    const staleListing = state.listings[0];
    state.listings = state.listings.slice(1);
    const before = structuredClone(state);

    const result = purchaseListing(state, staleListing, 1_000, 10);
    expect(result.ok).toBe(false);
    expect(result.state).toEqual(before);
  });

  it("returns a withdrawn listing to inventory without loss", () => {
    const state = purchasedState();
    const asset = state.ownedAssets[0];
    const listed = createPlayerListing(state, asset.id, 30_000, 20);
    if (!listed.ok) throw new Error(listed.reason);
    const listingId = listed.state.playerListings[0].id;
    const withdrawn = withdrawPlayerListing(listed.state, listingId, 30);
    if (!withdrawn.ok) throw new Error(withdrawn.reason);

    const returned: OwnedAsset = withdrawn.state.ownedAssets[0];
    expect(returned.state).toBe("IN_INVENTORY");
    expect(returned.bookCostMinor).toBe(asset.bookCostMinor);
    expect(returned.currentListingId).toBeUndefined();
    expect(netWorthMinor(withdrawn.state)).toBe(netWorthMinor(state));

    const relisted = createPlayerListing(
      withdrawn.state,
      returned.id,
      32_000,
      40,
    );
    expect(relisted.ok).toBe(true);
    if (relisted.ok) {
      expect(relisted.state.ownedAssets[0].state).toBe("LISTED");
      expect(relisted.state.playerListings).toHaveLength(2);
    }
  });

  it("rejects duplicate ownership records during state validation", () => {
    const state = purchasedState();
    state.ownedAssets.push(structuredClone(state.ownedAssets[0]));
    expect(() => validateState(state)).toThrow(/OwnedAsset id must be unique/);
  });

  it("rejects a save whose journal does not reconcile", () => {
    const state = purchasedState();
    state.cashMinor += 1;
    expect(() => validateState(state)).toThrow(
      /Transaction journal does not reconcile/,
    );
  });
});
