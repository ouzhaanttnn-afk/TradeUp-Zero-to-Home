import type { Listing } from "../domain/models";

export const ALL_MARKET_CATEGORIES = "ALL";

export function listingAgeLabel(createdAtGameMin: number, gameTimeMin: number) {
  const age = Math.max(0, gameTimeMin - createdAtGameMin);
  if (age < 1) return "Yeni";
  if (age < 60) return `${age} dk`;
  return `${Math.floor(age / 60)} sa`;
}

export function marketCategories(listings: Listing[]) {
  return Array.from(
    new Set(listings.map((listing) => listing.instance.family.category)),
  ).sort((left, right) => left.localeCompare(right, "tr"));
}

export function filterMarketListings(listings: Listing[], category: string) {
  if (category === ALL_MARKET_CATEGORIES) return listings;
  return listings.filter(
    (listing) => listing.instance.family.category === category,
  );
}
