import { describe, expect, it } from "vitest";
import { families, initialState, market } from "../game";
import { heroFamilies } from "../content/families";
import {
  comparableListings,
  comparisonRows,
  inspectListing,
  listingEstimateBand,
} from "./decision";
import { purchaseListing, reconcileJournal } from "./economy";
import { completeDuePreparations, startPreparation } from "./preparation";

describe("decision vertical slice", () => {
  it("keeps selected first and excludes inactive and unrelated listings", () => {
    const state = initialState(0, "SANDBOX");
    const first = state.listings[0];
    state.listings = Array.from({ length: 8 }, (_, index) => ({
      ...structuredClone(first),
      id: `compare-${index}`,
    }));
    state.listings[1].state = "EXPIRED";
    state.listings[2].familyId = "unrelated";
    const result = comparableListings(state, "compare-3");
    expect(result).toHaveLength(5);
    expect(result[0].id).toBe("compare-3");
    expect(
      result.some((item) => ["compare-1", "compare-2"].includes(item.id)),
    ).toBe(false);
    expect(comparableListings(state, "compare-1")).toEqual([]);
  });

  it("collapses unchanged secondary attributes using sorted priorities", () => {
    const first = structuredClone(initialState(0, "SANDBOX").listings[0]);
    first.instance.family.attributes = [
      {
        ...first.instance.family.attributes[0],
        id: "secondary",
        label: "Secondary",
        comparePriority: 9,
      },
      {
        ...first.instance.family.attributes[0],
        id: "essential",
        label: "Essential",
        comparePriority: 1,
      },
    ];
    first.instance.attributes = [
      { definitionId: "secondary", value: "same" },
      { definitionId: "essential", value: "same" },
    ];
    const second = structuredClone(first);
    expect(comparisonRows([first, second]).map((row) => row.label)).toContain(
      "Essential",
    );
    expect(
      comparisonRows([first, second]).map((row) => row.label),
    ).not.toContain("Secondary");
    second.instance.attributes[0].value = "different";
    expect(
      comparisonRows([first, second]).find((row) => row.label === "Secondary")
        ?.different,
    ).toBe(true);
  });

  it("keeps 24 deep hero families and scales internal alpha to sixty across eight categories", () => {
    expect(heroFamilies).toHaveLength(24);
    expect(families).toHaveLength(60);
    expect(new Set(families.map((family) => family.category))).toHaveLength(8);
    expect(new Set(families.map((family) => family.id)).size).toBe(60);
    expect(new Set(families.map((family) => family.assetKey)).size).toBe(60);
    for (const family of families) {
      expect(family.attributes.length).toBeGreaterThanOrEqual(3);
      expect(family.evidence.length).toBeGreaterThanOrEqual(2);
      expect(family.variants.length).toBeGreaterThanOrEqual(2);
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
    expect(Math.max(...counts)).toBeLessThanOrEqual(20);
    const state = { ...initialState(0, "SANDBOX"), listings };
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
    const state = initialState(0, "SANDBOX");
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
    let state = initialState(0, "SANDBOX");
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
