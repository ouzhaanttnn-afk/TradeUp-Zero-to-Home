import { describe, expect, it } from "vitest";
import { initialState } from "../game";
import { WORLD_CONFIG } from "./config";
import { reconcileJournal, settleAssetSale } from "./economy";
import { revealFirstMarket } from "./ftue";

describe("first-session transaction chain", () => {
  it("starts with zero cash and a real offer on the owned old notebook", () => {
    const state = initialState();
    expect(state.cashMinor).toBe(0);
    expect(state.ftue.stage).toBe("STARTING_SALE");
    expect(state.listings).toHaveLength(0);
    expect(state.ownedAssets[0]).toMatchObject({
      state: "LISTED",
      bookCostMinor: 0,
    });
    expect(state.buyerOffers[0]).toMatchObject({
      listingId: state.playerListings[0].id,
      amountMinor: 42_000,
    });
    expect(reconcileJournal(state)).toEqual({
      cash: true,
      activeBookCost: true,
      realizedProfit: true,
    });
  });

  it("reveals a full, unrestricted market and jumps straight to COMPLETE once the starting notebook sells", () => {
    const initial = initialState();
    const openingOffer = initial.buyerOffers[0];
    const openingListing = initial.playerListings[0];
    const soldNotebook = settleAssetSale(
      initial,
      openingListing.ownedAssetId,
      openingOffer.amountMinor,
      `sale:buyer:${openingOffer.id}`,
      0,
      openingListing.id,
    );
    if (!soldNotebook.ok) throw new Error(soldNotebook.reason);
    const state = revealFirstMarket(soldNotebook.state);

    // The guided walkthrough (compare/evidence/negotiation gating) is
    // disabled: the market reveal itself marks the tutorial complete so
    // normal market arrivals and buyer offers start flowing immediately.
    expect(state.ftue.stage).toBe("COMPLETE");
    expect(state.listings).toHaveLength(WORLD_CONFIG.minActiveListings);
    expect(reconcileJournal(state)).toEqual({
      cash: true,
      activeBookCost: true,
      realizedProfit: true,
    });

    // Calling it again once past STARTING_SALE is a no-op.
    expect(revealFirstMarket(state)).toEqual(state);
  });
});
