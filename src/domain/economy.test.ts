import { describe, expect, it } from "vitest";
import { initialState, signedMoney, validateState } from "../game";
import type { GameState, OwnedAsset, OwnershipState } from "./models";
import {
  activeBookCostMinor,
  addAssetCost,
  buyerCounterMinor,
  counterBuyerOffer,
  conservativeMarkToMarketMinor,
  createPlayerListing,
  netWorthMinor,
  purchaseHome,
  purchaseListing,
  preparationAssets,
  inventoryAssets,
  quoteAssetExit,
  quoteAssetSale,
  reconcileJournal,
  rejectBuyerOffer,
  settleAssetSale,
  withdrawPlayerListing,
} from "./economy";
import { startPreparation, completeDuePreparations } from "./preparation";

function purchasedState(): GameState {
  const state = initialState(0, "SANDBOX");
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
  it("purchases the home atomically with cash and preserves journal reconciliation", () => {
    const state = initialState(0, "SANDBOX");
    const priceMinor = 350_000_000;
    state.cashMinor = priceMinor;
    state.home = { ...state.home, unlocked: true };
    state.transactionJournal[0] = {
      ...state.transactionJournal[0],
      cashDeltaMinor: priceMinor,
    };

    const result = purchaseHome(state, priceMinor, "home-purchase:career", 480);
    if (!result.ok) throw new Error(result.reason);

    expect(result.state.cashMinor).toBe(0);
    expect(result.state.home.purchased).toBe(true);
    expect(result.state.career.at(-1)).toMatchObject({
      type: "HOME_PURCHASE",
      amountMinor: priceMinor,
    });
    expect(result.state.transactionJournal.at(-1)).toMatchObject({
      kind: "HOME_PURCHASE",
      cashDeltaMinor: -priceMinor,
    });
    expect(reconcileJournal(result.state)).toEqual({
      cash: true,
      activeBookCost: true,
      realizedProfit: true,
    });

    const repeated = purchaseHome(
      result.state,
      priceMinor,
      "home-purchase:career",
      480,
    );
    expect(repeated.ok && repeated.idempotent).toBe(true);
    expect(repeated.state).toBe(result.state);
  });

  it("does not auto-sell inventory when home cash is insufficient", () => {
    const state = initialState(0, "SANDBOX");
    state.home = { ...state.home, unlocked: true };
    const beforeAssets = state.ownedAssets;
    const result = purchaseHome(
      state,
      350_000_000,
      "home-purchase:insufficient",
      480,
    );

    expect(result).toMatchObject({ ok: false, reason: "INSUFFICIENT_CASH" });
    expect(result.state.cashMinor).toBe(state.cashMinor);
    expect(result.state.ownedAssets).toBe(beforeAssets);
    expect(result.state.home.purchased).toBe(false);
  });

  it.each([15_000, 20_000, 30_000])(
    "previews the same profit as settlement for %s minor-unit proceeds",
    (proceeds) => {
      const state = purchasedState();
      const asset = state.ownedAssets[0];
      const quote = quoteAssetSale(asset, proceeds);
      expect(quote).toEqual({
        proceedsMinor: proceeds,
        bookCostMinor: 20_000,
        profitMinor: proceeds - 20_000,
      });
      const sold = settleAssetSale(
        state,
        asset.id,
        proceeds,
        `sale:preview:${proceeds}`,
        20,
      );
      if (!sold.ok) throw new Error(sold.reason);
      expect(sold.state.realizedProfitMinor - state.realizedProfitMinor).toBe(
        quote.profitMinor,
      );
      expect(sold.state.cashMinor - state.cashMinor).toBe(quote.proceedsMinor);
    },
  );
  it("keeps an in-progress preparation visible after save/load and returns it to inventory on completion", () => {
    const before = purchasedState();
    const asset = before.ownedAssets[0];
    const started = startPreparation(before, asset.id, "CLEAN");
    if (!started.ok) throw new Error(started.reason);
    const restored = validateState(JSON.parse(JSON.stringify(started.state)));
    expect(inventoryAssets(restored)).toHaveLength(0);
    expect(preparationAssets(restored).map((item) => item.id)).toEqual([
      asset.id,
    ]);
    const completed = completeDuePreparations(
      restored,
      restored.gameTimeMin + started.durationMin,
    );
    expect(inventoryAssets(completed).map((item) => item.id)).toEqual([
      asset.id,
    ]);
    expect(preparationAssets(completed).map((item) => item.id)).toEqual([
      asset.id,
    ]);
    expect(reconcileJournal(completed)).toEqual({
      cash: true,
      activeBookCost: true,
      realizedProfit: true,
    });
    const listed = createPlayerListing(completed, asset.id, 30_000, 20);
    if (!listed.ok) throw new Error(listed.reason);
    expect(preparationAssets(listed.state)).toHaveLength(0);
  });
  it("quotes quick-sale proceeds, full-book-cost profit and forgone premium before settlement", () => {
    const state = purchasedState();
    const asset = {
      ...state.ownedAssets[0],
      bookCostMinor: 23_000,
      instance: {
        ...state.ownedAssets[0].instance,
        fairValueMinor: 40_000,
      },
    };

    expect(quoteAssetExit(asset)).toEqual({
      quickSaleMinor: 33_000,
      balancedAskingMinor: 42_000,
      quickSaleProfitMinor: 10_000,
      estimatedPremiumGivenUpMinor: 9_000,
    });
    expect(signedMoney(10_000)).toMatch(/^\+/);
    expect(signedMoney(-10_000)).toMatch(/^-/);
    expect(signedMoney(0)).toMatch(/^±/);
  });

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
    const state = initialState(0, "SANDBOX");
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
    const state = initialState(0, "SANDBOX");
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

  it("rejects only the buyer offer while keeping the asset listed and accounting untouched", () => {
    const state = purchasedState();
    const asset = state.ownedAssets[0];
    const listed = createPlayerListing(state, asset.id, 30_000, 20);
    if (!listed.ok) throw new Error(listed.reason);
    const listing = listed.state.playerListings[0];
    const offered: GameState = {
      ...listed.state,
      buyerOffers: [
        {
          id: "offer:reject-test",
          listingId: listing.id,
          amountMinor: 28_000,
          buyer: "Deniz",
          expiresAtGameMin: 80,
        },
      ],
    };
    const beforeJournal = structuredClone(offered.transactionJournal);
    const rejected = rejectBuyerOffer(offered, "offer:reject-test");
    if (!rejected.ok) throw new Error(rejected.reason);

    expect(rejected.state.buyerOffers).toEqual([]);
    expect(rejected.state.playerListings[0]).toEqual(listing);
    expect(rejected.state.ownedAssets[0].state).toBe("LISTED");
    expect(rejected.state.ownedAssets[0].currentListingId).toBe(listing.id);
    expect(rejected.state.cashMinor).toBe(offered.cashMinor);
    expect(rejected.state.transactionJournal).toEqual(beforeJournal);
    expect(reconcileJournal(rejected.state)).toEqual({
      cash: true,
      activeBookCost: true,
      realizedProfit: true,
    });
  });

  it("resolves the single buyer counter deterministically without opening a message chain", () => {
    const state = purchasedState();
    const asset = state.ownedAssets[0];
    const listed = createPlayerListing(state, asset.id, 36_000, 20);
    if (!listed.ok) throw new Error(listed.reason);
    const listing = listed.state.playerListings[0];
    const counterMinor = buyerCounterMinor({ amountMinor: 30_000 }, listing)!;
    expect(counterMinor).toBe(33_000);

    const outcomes = new Map<
      "ACCEPTED" | "FINAL" | "WITHDREW",
      ReturnType<typeof counterBuyerOffer>
    >();
    for (let index = 0; index < 1_000 && outcomes.size < 3; index++) {
      const offerId = `offer:counter-branch:${index}`;
      const offered: GameState = {
        ...listed.state,
        buyerOffers: [
          {
            id: offerId,
            listingId: listing.id,
            amountMinor: 30_000,
            buyer: "Selin",
            expiresAtGameMin: 80,
          },
        ],
      };
      const result = counterBuyerOffer(offered, offerId, counterMinor, 30);
      if (result.ok && !outcomes.has(result.outcome)) {
        outcomes.set(result.outcome, result);
      }
    }
    expect([...outcomes.keys()].sort()).toEqual([
      "ACCEPTED",
      "FINAL",
      "WITHDREW",
    ]);

    const accepted = outcomes.get("ACCEPTED")!;
    if (!accepted.ok) throw new Error(accepted.reason);
    expect(accepted.state.ownedAssets[0].state).toBe("SOLD_COMPLETE");
    expect(accepted.state.cashMinor).toBe(
      listed.state.cashMinor + counterMinor,
    );
    expect(reconcileJournal(accepted.state)).toEqual({
      cash: true,
      activeBookCost: true,
      realizedProfit: true,
    });

    const final = outcomes.get("FINAL")!;
    if (!final.ok) throw new Error(final.reason);
    expect(final.state.buyerOffers[0]).toMatchObject({
      amountMinor: final.amountMinor,
      initialAmountMinor: 30_000,
      counterUsed: true,
    });
    expect(final.state.cashMinor).toBe(listed.state.cashMinor);
    expect(final.state.transactionJournal).toEqual(
      listed.state.transactionJournal,
    );
    expect(
      validateState(JSON.parse(JSON.stringify(final.state))).buyerOffers[0],
    ).toMatchObject({
      initialAmountMinor: 30_000,
      counterUsed: true,
    });
    expect(
      counterBuyerOffer(
        final.state,
        final.state.buyerOffers[0].id,
        counterMinor,
        30,
      ).ok,
    ).toBe(false);

    const withdrew = outcomes.get("WITHDREW")!;
    if (!withdrew.ok) throw new Error(withdrew.reason);
    expect(withdrew.state.buyerOffers).toEqual([]);
    expect(withdrew.state.playerListings[0].state).toBe("ACTIVE");
    expect(withdrew.state.ownedAssets[0].state).toBe("LISTED");
    expect(withdrew.state.cashMinor).toBe(listed.state.cashMinor);
    expect(withdrew.state.transactionJournal).toEqual(
      listed.state.transactionJournal,
    );
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
