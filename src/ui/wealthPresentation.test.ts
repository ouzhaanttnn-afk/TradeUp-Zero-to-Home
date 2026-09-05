import { describe, expect, it } from "vitest";
import { initialState, validateState } from "../game";
import {
  purchaseListing,
  reconcileJournal,
  settleAssetSale,
} from "../domain/economy";
import type { OwnershipState } from "../domain/models";
import { formatEstimate, wealthPresentation } from "./wealthPresentation";

function fixture() {
  const state = initialState(0, "SANDBOX");
  state.cashMinor = 100_000;
  state.transactionJournal[0].cashDeltaMinor = 100_000;
  const result = purchaseListing(state, state.listings[0], 20_000, 10);
  if (!result.ok) throw new Error(result.reason);
  return result.state;
}

describe("player-visible wealth estimates", () => {
  it("keeps the exact engine value inside a range and does not alter accounting", () => {
    const state = fixture();
    const before = structuredClone(state);
    const result = wealthPresentation(state);
    expect(result.portfolio.lowMinor).toBeLessThan(
      state.ownedAssets[0].instance.fairValueMinor,
    );
    expect(result.portfolio.highMinor).toBeGreaterThan(
      state.ownedAssets[0].instance.fairValueMinor,
    );
    expect(result.total.lowMinor - result.portfolio.lowMinor).toBe(
      state.cashMinor,
    );
    expect(result.difference.highMinor).toBe(
      result.portfolio.highMinor - 20_000,
    );
    expect(state).toEqual(before);
  });
  it.each<OwnershipState>([
    "IN_INVENTORY",
    "PREPARING",
    "READY",
    "LISTED",
    "RESERVED",
    "SOLD_PENDING",
  ])("preserves ownership estimates in %s", (ownership) => {
    const state = fixture();
    const before = wealthPresentation(state);
    state.ownedAssets[0].state = ownership;
    expect(wealthPresentation(state)).toEqual(before);
  });
  it("narrows with evidence and keeps the same estimate after save/load", () => {
    const state = fixture();
    state.ownedAssets[0].instance.evidenceConfidence = 0;
    const before = wealthPresentation(state);
    state.ownedAssets[0].instance.evidenceConfidence = 1;
    const after = wealthPresentation(state);
    expect(after.portfolio.highMinor - after.portfolio.lowMinor).toBeLessThan(
      before.portfolio.highMinor - before.portfolio.lowMinor,
    );
    const restored = validateState(JSON.parse(JSON.stringify(state)));
    expect(wealthPresentation(restored)).toEqual(after);
    expect(reconcileJournal(restored)).toEqual(reconcileJournal(state));
  });
  it("removes a settled item from estimates while preserving cash and journal", () => {
    const state = fixture();
    const result = settleAssetSale(
      state,
      state.ownedAssets[0].id,
      30_000,
      "sale:estimate",
      12,
    );
    if (!result.ok) throw new Error(result.reason);
    const presentation = wealthPresentation(result.state);
    expect(presentation.portfolio).toEqual({ lowMinor: 0, highMinor: 0 });
    expect(presentation.total).toEqual({
      lowMinor: 110_000,
      highMinor: 110_000,
    });
    expect(formatEstimate(presentation.total)).toBe("₺1.100");
    expect(reconcileJournal(result.state)).toEqual(
      reconcileJournal(validateState(JSON.parse(JSON.stringify(result.state)))),
    );
  });
});
