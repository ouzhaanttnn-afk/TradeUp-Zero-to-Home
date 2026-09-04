import { describe, expect, it } from "vitest";
import { initialState, validateState } from "../game";
import { reconcileJournal } from "./economy";
import { migrateStateToCurrent } from "./migrations";

describe("save migration", () => {
  it("recovers a v2 listed asset and preserves reconciled totals", () => {
    const family = {
      id: "phone",
      name: "Nova X1 Telefon",
      assetKey: "prd_phone",
      base: 8_200,
      demand: 0.88,
      liquidity: 0.88,
      category: "Telefon",
      tier: 2,
      attributes: ["Pil sağlığı"],
    };
    const legacy = {
      version: 2,
      cash: 1_500,
      inventory: [],
      realizedProfit: 250,
      seed: 7,
      marketCycle: 2,
      listings: [],
      playerListings: [
        {
          id: "player-owned-1",
          family,
          fair: 9_000,
          price: 10_000,
          condition: 84,
          seller: "merchant",
          urgency: 0.5,
          interest: 5,
          createdAt: 100,
          expiresAt: 200,
          state: "ACTIVE",
          seed: 9,
        },
      ],
      buyerOffers: [
        {
          id: "offer-1",
          listingId: "player-owned-1",
          amount: 9_700,
          buyer: "Ece",
          expiresAt: 300,
        },
      ],
      expertise: {},
      career: [
        {
          id: "buy-1",
          type: "BUY",
          at: 50,
          label: "Nova X1 Telefon alındı",
          amount: 7_500,
        },
      ],
      lastSeenAt: 150,
    };

    const state = validateState(migrateStateToCurrent(legacy));
    expect(state.version).toBe(8);
    expect(state.cashMinor).toBe(150_000);
    expect(state.ownedAssets[0]).toMatchObject({
      id: "owned-1",
      state: "LISTED",
      bookCostMinor: 750_000,
      currentListingId: "player-owned-1",
    });
    expect(state.playerListings[0].ownedAssetId).toBe("owned-1");
    expect(state.buyerOffers[0].amountMinor).toBe(970_000);
    expect(state.buyerOffers[0].expiresAtGameMin).toBe(1);
    expect(reconcileJournal(state)).toEqual({
      cash: true,
      activeBookCost: true,
      realizedProfit: true,
    });
    expect(state.ftue.stage).toBe("COMPLETE");
  });

  it("adds the injected game clock to a v3 save without changing totals", () => {
    const v3 = {
      version: 3,
      cashMinor: 42_000,
      ownedAssets: [],
      realizedProfitMinor: 0,
      transactionJournal: [
        {
          id: "opening-balance:v3",
          kind: "OPENING_BALANCE",
          gameTime: 0,
          cashDeltaMinor: 42_000,
          costBasisDeltaMinor: 0,
          realizedProfitDeltaMinor: 0,
          metadata: {},
        },
      ],
      seed: 1,
      marketCycle: 0,
      listings: [],
      playerListings: [],
      buyerOffers: [],
      expertise: {},
      career: [],
      lastSeenAt: 123_000,
    };

    const state = validateState(migrateStateToCurrent(v3));
    expect(state).toMatchObject({
      version: 8,
      gameTimeMin: 0,
      lastWallClockMs: 123_000,
      cashMinor: 42_000,
    });
    expect(reconcileJournal(state)).toEqual({
      cash: true,
      activeBookCost: true,
      realizedProfit: true,
    });
  });

  it("adds P2 meta state to a v6 save without rewriting its ledger", () => {
    const current = initialState(1_000, "SANDBOX");
    current.realizedProfitMinor = 12_000;
    current.transactionJournal[0] = {
      ...current.transactionJournal[0],
      realizedProfitDeltaMinor: 12_000,
    };
    const v6: Record<string, unknown> = {
      ...current,
      version: 6,
      expertise: { Elektronik: 90 },
      career: [
        {
          id: "old-sale",
          type: "SALE",
          atGameMin: 0,
          label: "Önceki satış",
          amountMinor: 12_000,
        },
      ],
    };
    delete v6.follow;
    delete v6.home;
    delete v6.analytics;
    const state = validateState(migrateStateToCurrent(v6));

    expect(state.version).toBe(8);
    expect(state.expertise).toMatchObject({
      marketXp: 90,
      categoryXp: { Elektronik: 90 },
      familyActionCounts: {},
      seenActions: [],
    });
    expect(state.career[0]).toMatchObject({
      id: "old-sale",
      type: "LEGACY",
      label: "Önceki satış",
    });
    expect(state.follow).toEqual({
      watchedListingIds: [],
      savedSearches: [],
      missedOpportunities: [],
    });
    expect(state.home.unlocked).toBe(true);
    expect(reconcileJournal(state)).toEqual({
      cash: true,
      activeBookCost: true,
      realizedProfit: true,
    });
  });
});
