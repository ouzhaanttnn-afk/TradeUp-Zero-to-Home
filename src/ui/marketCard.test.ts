import { describe, expect, it } from "vitest";
import { initialState } from "../game";
import {
  ALL_MARKET_CATEGORIES,
  filterMarketListings,
  listingAgeLabel,
  marketCategories,
} from "./marketCard";

describe("market card age", () => {
  it("uses short labels that fit a compact tile", () => {
    expect(listingAgeLabel(0, 0)).toBe("Yeni");
    expect(listingAgeLabel(4, 3)).toBe("Yeni");
    expect(listingAgeLabel(0, 1)).toBe("1 dk");
    expect(listingAgeLabel(0, 59)).toBe("59 dk");
    expect(listingAgeLabel(0, 60)).toBe("1 sa");
    expect(listingAgeLabel(10, 131)).toBe("2 sa");
  });
});

describe("market category filter", () => {
  const listings = initialState(0, "SANDBOX").listings;

  it("offers stable category choices and leaves the full feed intact", () => {
    const categories = marketCategories(listings);

    expect(categories).toEqual(
      [...categories].sort((left, right) => left.localeCompare(right, "tr")),
    );
    expect(new Set(categories).size).toBe(categories.length);
    expect(filterMarketListings(listings, ALL_MARKET_CATEGORIES)).toBe(
      listings,
    );
  });

  it("shows only listings from the chosen category", () => {
    const category = marketCategories(listings)[0];
    const filtered = filterMarketListings(listings, category);

    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.length).toBeLessThan(listings.length);
    expect(
      filtered.every(
        (listing) => listing.instance.family.category === category,
      ),
    ).toBe(true);
  });
});
