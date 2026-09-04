import { describe, expect, it } from "vitest";
import { initialState, sellerFloor } from "../game";
import { inspectListing } from "./decision";
import {
  createPlayerListing,
  purchaseListing,
  quoteAssetExit,
  reconcileJournal,
  settleAssetSale,
  withdrawPlayerListing,
} from "./economy";
import {
  recordFtueBuyerSale,
  recordFtueCompare,
  recordFtueEvidence,
  recordFtueListing,
  recordFtuePreparation,
  recordFtuePurchase,
  recordFtueWithdrawal,
  revealFirstMarket,
} from "./ftue";
import { completeDuePreparations, startPreparation } from "./preparation";

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

  it("completes compare, evidence, negotiation, preparation, listing and profitable buyer sale deterministically", () => {
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
    let state = revealFirstMarket(soldNotebook.state);
    expect(state.listings).toHaveLength(3);
    const familyCounts = state.listings.reduce<Record<string, number>>(
      (counts, listing) => ({
        ...counts,
        [listing.familyId]: (counts[listing.familyId] ?? 0) + 1,
      }),
      {},
    );
    expect(Math.max(...Object.values(familyCounts))).toBe(2);
    expect(
      state.listings.filter((listing) => listing.priceMinor <= state.cashMinor)
        .length,
    ).toBeGreaterThanOrEqual(2);

    state = recordFtueCompare(state);
    const choice = state.listings.find(
      (listing) => listing.priceMinor <= state.cashMinor,
    )!;
    const inspected = inspectListing(state, choice.id, "QUICK_TEST");
    if (!inspected.ok) throw new Error(inspected.reason);
    state = recordFtueEvidence(inspected.state);
    expect(state.ftue.stage).toBe("NEGOTIATION");

    const purchase = purchaseListing(
      state,
      choice,
      sellerFloor(choice),
      state.gameTimeMin,
    );
    if (!purchase.ok) throw new Error(purchase.reason);
    const assetId = `asset:${choice.id}`;
    state = recordFtuePurchase(purchase.state, assetId);
    const prepared = startPreparation(state, assetId, "CLEAN");
    if (!prepared.ok) throw new Error(prepared.reason);
    state = completeDuePreparations(
      prepared.state,
      state.gameTimeMin + prepared.durationMin,
    );
    state = recordFtuePreparation(state, assetId);
    expect(state.ftue.stage).toBe("LISTING");

    const asset = state.ownedAssets.find((item) => item.id === assetId)!;
    const playerListing = createPlayerListing(
      state,
      assetId,
      quoteAssetExit(asset).balancedAskingMinor,
      state.gameTimeMin,
    );
    if (!playerListing.ok) throw new Error(playerListing.reason);
    state = recordFtueListing(playerListing.state, assetId);
    const withdrawn = withdrawPlayerListing(
      structuredClone(state),
      state.ftue.firstPlayerListingId!,
      state.gameTimeMin,
    );
    if (!withdrawn.ok) throw new Error(withdrawn.reason);
    expect(
      recordFtueWithdrawal(withdrawn.state, state.ftue.firstPlayerListingId!)
        .ftue.stage,
    ).toBe("LISTING");
    const buyerOffer = state.buyerOffers.find((offer) =>
      offer.id.startsWith("offer:ftue-first-flip:"),
    )!;
    const sale = settleAssetSale(
      state,
      assetId,
      buyerOffer.amountMinor,
      `sale:buyer:${buyerOffer.id}`,
      state.gameTimeMin,
      buyerOffer.listingId,
    );
    if (!sale.ok) throw new Error(sale.reason);
    state = recordFtueBuyerSale(sale.state, buyerOffer.listingId);

    expect(state.ftue.stage).toBe("COMPLETE");
    expect(state.realizedProfitMinor).toBeGreaterThan(42_000);
    expect(reconcileJournal(state)).toEqual({
      cash: true,
      activeBookCost: true,
      realizedProfit: true,
    });
    expect(
      recordFtueBuyerSale(structuredClone(state), buyerOffer.listingId),
    ).toEqual(state);
  });
});
