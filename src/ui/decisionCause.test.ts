import { describe, expect, it } from "vitest";
import { initialState } from "../game";
import { purchaseListing } from "../domain/economy";
import { purchaseDecisionCause, saleDecisionCause } from "./decisionCause";

describe("decision cause summaries", () => {
  it("explains a negotiated purchase without revealing exact fair value", () => {
    const state = initialState(0, "SANDBOX");
    const listing = state.listings[0];
    state.cashMinor = listing.priceMinor;
    state.transactionJournal[0] = {
      ...state.transactionJournal[0],
      cashDeltaMinor: listing.priceMinor,
    };
    const purchase = purchaseListing(
      state,
      listing,
      listing.priceMinor - 2_000,
      0,
    );
    if (!purchase.ok) throw new Error(purchase.reason);
    const copy = purchaseDecisionCause(
      purchase.state,
      purchase.state.ownedAssets[0],
    );
    expect(copy).toContain("₺20");
    expect(copy).toContain("tasarruf");
    expect(copy).not.toContain(String(listing.instance.fairValueMinor));
  });

  it("explains profit, break-even and loss from canonical book cost", () => {
    const state = initialState(0, "SANDBOX");
    const purchase = purchaseListing(state, state.listings[0], 20_000, 0);
    if (!purchase.ok) throw new Error(purchase.reason);
    const asset = purchase.state.ownedAssets[0];
    expect(saleDecisionCause(asset, 25_000)).toContain("₺50");
    expect(saleDecisionCause(asset, 20_000)).toContain(
      "kâr veya zarar oluşmadı",
    );
    expect(saleDecisionCause(asset, 15_000)).toContain("₺50");
  });
});
