import { describe, expect, it } from "vitest";
import { families, initialState, market } from "../game";
import {
  familyById,
  heroFamilies,
  mediumBudgetFamilies,
  starterExpansionFamilies,
  upperMidFamilies,
  capitalBridgeFamilies,
  vehicleFamilies,
} from "../content/families";
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

  it("keeps 24 deep hero families and expands content across ten categories", () => {
    expect(heroFamilies).toHaveLength(24);
    expect(new Set(families.map((family) => family.category))).toHaveLength(10);
    expect(new Set(families.map((family) => family.id)).size).toBe(
      families.length,
    );
    expect(new Set(families.map((family) => family.assetKey)).size).toBe(
      families.length,
    );
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

  it("keeps collection wording exceptional instead of applying it to the whole market", () => {
    const collectionFamilies = families.filter((family) =>
      /koleksiyon/i.test(family.name),
    );
    expect(collectionFamilies).toHaveLength(7);
    expect(collectionFamilies.length / families.length).toBeLessThan(0.06);
    expect(collectionFamilies.map((family) => family.id)).toEqual(
      expect.arrayContaining(["vinyl", "book", "game_cartridge"]),
    );
    expect(familyById("notebook")?.name).toBe("Deri Kapaklı Kutu Defteri");
    expect(familyById("robot_vacuum")?.name).toBe("Haritalamalı Robot Süpürge");
  });

  it("adds exactly 32 distinct mid-budget products without bypassing progression", () => {
    expect(mediumBudgetFamilies).toHaveLength(32);
    expect(new Set(mediumBudgetFamilies.map((family) => family.id)).size).toBe(
      32,
    );
    expect(
      new Set(mediumBudgetFamilies.map((family) => family.assetKey)).size,
    ).toBe(32);
    for (const family of mediumBudgetFamilies) {
      expect(family.baseValueMinor).toBeGreaterThanOrEqual(180_000);
      expect(family.baseValueMinor).toBeLessThanOrEqual(950_000);
      expect([1, 2]).toContain(family.tier);
    }
  });

  it("adds 32 more starter and mid-tier products with bounded prices", () => {
    expect(families).toHaveLength(169);
    expect(starterExpansionFamilies).toHaveLength(32);
    expect(
      new Set(starterExpansionFamilies.map((family) => family.id)).size,
    ).toBe(32);
    expect(
      new Set(starterExpansionFamilies.map((family) => family.assetKey)).size,
    ).toBe(32);
    expect(
      new Set(starterExpansionFamilies.map((family) => family.category)).size,
    ).toBe(8);
    for (const family of starterExpansionFamilies) {
      expect(family.baseValueMinor).toBeGreaterThanOrEqual(45_000);
      expect(family.baseValueMinor).toBeLessThanOrEqual(850_000);
      expect([0, 1, 2]).toContain(family.tier);
    }
  });

  it("adds 16 upper-mid products only at tier three", () => {
    expect(upperMidFamilies).toHaveLength(16);
    expect(new Set(upperMidFamilies.map((family) => family.id)).size).toBe(16);
    expect(
      new Set(upperMidFamilies.map((family) => family.assetKey)).size,
    ).toBe(16);
    for (const family of upperMidFamilies) {
      expect(family.baseValueMinor).toBeGreaterThanOrEqual(1_850_000);
      expect(family.baseValueMinor).toBeLessThanOrEqual(5_800_000);
      expect(family.tier).toBe(3);
    }
  });

  it("bridges upper-mid goods into high-ticket trading without changing margins", () => {
    expect(capitalBridgeFamilies).toHaveLength(16);
    expect(new Set(capitalBridgeFamilies.map((family) => family.id)).size).toBe(
      16,
    );
    expect(
      capitalBridgeFamilies.filter((family) => family.tier === 4),
    ).toHaveLength(8);
    expect(
      capitalBridgeFamilies.filter((family) => family.tier === 5),
    ).toHaveLength(8);
    expect(
      capitalBridgeFamilies.every(
        (family) =>
          family.baseValueMinor >= 12_800_000 &&
          family.baseValueMinor <= 56_000_000,
      ),
    ).toBe(true);
  });

  it("adds six vehicle families only to the matching high-ticket tiers", () => {
    expect(vehicleFamilies).toHaveLength(6);
    expect(vehicleFamilies.every((family) => family.category === "Araç")).toBe(
      true,
    );
    expect(vehicleFamilies.map((family) => family.tier)).toEqual([
      4, 4, 4, 5, 5, 5,
    ]);
    expect(
      vehicleFamilies.every(
        (family) =>
          family.baseValueMinor >= 25_000_000 &&
          family.baseValueMinor <= 300_000_000,
      ),
    ).toBe(true);
    expect(
      vehicleFamilies.every((family) =>
        family.attributes.some((attribute) => attribute.label === "Kilometre"),
      ),
    ).toBe(true);
    expect(
      Array.from({ length: 80 }, (_, cycle) =>
        market(91_300, 24_999_999, cycle, cycle, 24),
      )
        .flat()
        .some((listing) => listing.instance.family.category === "Araç"),
    ).toBe(false);
    expect(
      Array.from({ length: 80 }, (_, cycle) =>
        market(91_300, 25_000_000, cycle, cycle, 24),
      )
        .flat()
        .some((listing) => listing.familyId === "urban_motorcycle"),
    ).toBe(true);
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
