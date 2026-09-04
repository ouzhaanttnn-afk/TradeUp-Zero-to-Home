import { describe, expect, it } from "vitest";
import { families, initialState, market } from "../game";
import {
  comparableListings,
  comparisonRows,
  inspectListing,
  listingEstimateBand,
} from "./decision";
import { purchaseListing, reconcileJournal } from "./economy";
import { completeDuePreparations, startPreparation } from "./preparation";

describe("decision vertical slice", () => {
  it("ships 24 deep data-driven hero families across six categories", () => {
    expect(families).toHaveLength(24);
    expect(new Set(families.map((family) => family.category))).toHaveLength(6);
    for (const family of families) {
      expect(family.attributes.length).toBeGreaterThanOrEqual(3);
      expect(family.evidence.length).toBeGreaterThanOrEqual(2);
      expect(family.defects.every((defect) => defect.riskSignal > 0)).toBe(
        true,
      );
      expect(new Set(family.preparation.map((item) => item.kind))).toEqual(
        new Set(["CLEAN", "TEST", "COMPLETE"]),
      );
    }
  });

  it("keeps ten same-family listings available for comparison", () => {
    const listings = market(77, 42_000, 0, 0, 24);
    const counts = Object.values(
      listings.reduce<Record<string, number>>(
        (result, item) => ({
          ...result,
          [item.familyId]: (result[item.familyId] ?? 0) + 1,
        }),
        {},
      ),
    );
    expect(Math.max(...counts)).toBeGreaterThanOrEqual(10);
    const state = { ...initialState(), listings };
    const comparable = comparableListings(state, listings[0].id);
    expect(comparable.length).toBeGreaterThanOrEqual(2);
    expect(comparable.length).toBeLessThanOrEqual(5);
    expect(
      comparisonRows(comparable).every(
        (row) => !row.label.toLowerCase().includes("gerçek"),
      ),
    ).toBe(true);
  });

  it("narrows estimates deterministically as evidence is checked", () => {
    const state = initialState();
    const listing = state.listings[0];
    const before = listingEstimateBand(listing);
    const left = inspectListing(
      structuredClone(state),
      listing.id,
      "QUICK_TEST",
    );
    const right = inspectListing(
      structuredClone(state),
      listing.id,
      "QUICK_TEST",
    );
    expect(left).toEqual(right);
    expect(left.ok).toBe(true);
    if (!left.ok) return;
    const after = listingEstimateBand(
      left.state.listings.find((item) => item.id === listing.id)!,
    );
    expect(after.highMinor - after.lowMinor).toBeLessThan(
      before.highMinor - before.lowMinor,
    );
  });

  it("capitalizes preparation cost and applies a capped deterministic result", () => {
    let state = initialState();
    state.cashMinor = 1_000_000;
    state.transactionJournal[0] = {
      ...state.transactionJournal[0],
      cashDeltaMinor: 1_000_000,
    };
    const purchase = purchaseListing(state, state.listings[0], 10_000, 0);
    if (!purchase.ok) throw new Error(purchase.reason);
    const asset = purchase.state.ownedAssets[0];
    const started = startPreparation(purchase.state, asset.id, "CLEAN");
    if (!started.ok) throw new Error(started.reason);
    const completed = completeDuePreparations(
      started.state,
      started.state.gameTimeMin + started.durationMin,
    );
    const updated = completed.ownedAssets[0];
    expect(updated.bookCostMinor).toBe(
      asset.bookCostMinor + asset.instance.family.preparation[0].costMinor,
    );
    expect(updated.instance.condition).toBeLessThanOrEqual(
      updated.instance.family.conditionCap,
    );
    expect(reconcileJournal(completed)).toEqual({
      cash: true,
      activeBookCost: true,
      realizedProfit: true,
    });
  });
});
