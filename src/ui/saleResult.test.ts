import { describe, expect, it } from "vitest";
import { initialState, validateState } from "../game";
import { purchaseListing, settleAssetSale } from "../domain/economy";
import { latestSaleResult } from "./saleResult";

describe("latest sale result", () => {
  it("reconstructs the persisted result from the canonical journal", () => {
    const state = initialState(0, "SANDBOX");
    const purchase = purchaseListing(state, state.listings[0], 20_000, 0);
    if (!purchase.ok) throw new Error(purchase.reason);
    const asset = purchase.state.ownedAssets[0];
    const sale = settleAssetSale(
      purchase.state,
      asset.id,
      25_000,
      "sale:test",
      4,
    );
    if (!sale.ok) throw new Error(sale.reason);
    const restored = validateState(JSON.parse(JSON.stringify(sale.state)));
    expect(latestSaleResult(restored)).toEqual({
      transactionId: "sale:test",
      assetName: asset.instance.family.name,
      proceedsMinor: 25_000,
      bookCostMinor: 20_000,
      profitMinor: 5_000,
    });
  });

  it("shows the last completed sale and supports a recorded loss", () => {
    const state = initialState(0, "SANDBOX");
    const purchase = purchaseListing(state, state.listings[0], 20_000, 0);
    if (!purchase.ok) throw new Error(purchase.reason);
    const first = purchase.state.ownedAssets[0];
    const sale = settleAssetSale(
      purchase.state,
      first.id,
      15_000,
      "sale:loss",
      2,
    );
    if (!sale.ok) throw new Error(sale.reason);
    expect(latestSaleResult(sale.state)).toMatchObject({
      transactionId: "sale:loss",
      bookCostMinor: 20_000,
      profitMinor: -5_000,
    });
  });

  it("does not invent a result without a completed journal entry", () => {
    expect(latestSaleResult(initialState(0, "SANDBOX"))).toBeNull();
  });
});
