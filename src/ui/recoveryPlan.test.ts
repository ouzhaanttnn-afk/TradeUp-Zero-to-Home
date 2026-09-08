import { describe, expect, it } from "vitest";
import { initialState } from "../game";
import { createPlayerListing, purchaseListing } from "../domain/economy";
import { recoveryPlan } from "./recoveryPlan";

describe("cash recovery shortcuts", () => {
  it("stays hidden while cash is healthy", () => {
    expect(recoveryPlan(initialState(0, "SANDBOX"))).toBeNull();
  });

  it("offers only real actions backed by the current portfolio", () => {
    const state = initialState(0, "SANDBOX");
    state.cashMinor = 1_000_000;
    state.transactionJournal[0].cashDeltaMinor = 1_000_000;
    const purchase = purchaseListing(state, state.listings[0], 999_999, 0);
    if (!purchase.ok) throw new Error(purchase.reason);
    expect(recoveryPlan(purchase.state)).toMatchObject({
      level: "LOCKED",
      canQuickSell: true,
      canRevise: false,
    });
    const asset = purchase.state.ownedAssets[0];
    const listed = createPlayerListing(purchase.state, asset.id, 1_000_000, 1);
    if (!listed.ok) throw new Error(listed.reason);
    expect(recoveryPlan(listed.state)).toMatchObject({
      canQuickSell: false,
      canRevise: true,
    });
  });
});
