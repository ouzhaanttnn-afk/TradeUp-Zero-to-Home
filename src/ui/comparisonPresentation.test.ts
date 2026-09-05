import { describe, expect, it } from "vitest";
import { initialState } from "../game";
import { comparisonPresentation } from "./comparisonPresentation";
import { listingEstimateBand } from "../domain/decision";
import { formatEstimate } from "./wealthPresentation";

describe("comparison presentation", () => {
  it("keeps each listing aligned and uses the shared estimate", () => {
    const first = initialState(0, "SANDBOX").listings[0];
    const second = {
      ...structuredClone(first),
      id: "alternative",
      priceMinor: first.priceMinor + 100,
    };
    const rows = comparisonPresentation([first, second], 2);
    expect(rows.find((row) => row.label === "Fiyat")?.different).toBe(true);
    expect(
      rows.find((row) => row.label === "Tahmini değer aralığı")?.values,
    ).toEqual(
      [first, second].map((listing) =>
        formatEstimate(listingEstimateBand(listing, 2)),
      ),
    );
    expect(rows.every((row) => row.values.length === 2)).toBe(true);
    expect(rows.find((row) => row.label === "Kondisyon")?.different).toBe(
      false,
    );
  });

  it("does not reveal hidden defects or turn missing evidence into reassurance", () => {
    const listing = structuredClone(initialState(0, "SANDBOX").listings[0]);
    listing.instance.evidence = [];
    const before = comparisonPresentation([listing]);
    listing.instance.defects = listing.instance.defects.map((defect) => ({
      ...defect,
      present: !defect.present,
    }));
    expect(comparisonPresentation([listing])).toEqual(before);
    expect(
      before
        .filter((row) => row.label.startsWith("İnceleme ·"))
        .every((row) => row.values[0] === "Bilinmiyor"),
    ).toBe(true);
  });

  it("gates sale-speed information and handles empty comparisons", () => {
    const listing = initialState(0, "SANDBOX").listings[0];
    expect(
      comparisonPresentation([listing], 0).some(
        (row) => row.label === "Satış hızı",
      ),
    ).toBe(false);
    expect(
      comparisonPresentation([listing], 1).some(
        (row) => row.label === "Satış hızı",
      ),
    ).toBe(true);
    expect(comparisonPresentation([])).toEqual([]);
  });
});
