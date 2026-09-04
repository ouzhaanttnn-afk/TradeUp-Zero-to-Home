import { describe, expect, it } from "vitest";
import { validateState } from "../game";
import { reconcileJournal } from "./economy";
import { migrateStateToV3 } from "./migrations";

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

    const state = validateState(migrateStateToV3(legacy));
    expect(state.version).toBe(3);
    expect(state.cashMinor).toBe(150_000);
    expect(state.ownedAssets[0]).toMatchObject({
      id: "owned-1",
      state: "LISTED",
      bookCostMinor: 750_000,
      currentListingId: "player-owned-1",
    });
    expect(state.playerListings[0].ownedAssetId).toBe("owned-1");
    expect(state.buyerOffers[0].amountMinor).toBe(970_000);
    expect(reconcileJournal(state)).toEqual({
      cash: true,
      activeBookCost: true,
      realizedProfit: true,
    });
  });
});
