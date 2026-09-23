import type { Listing } from "../domain/models";
import { getLanguage, type Language } from "../i18n";

export const ALL_MARKET_CATEGORIES = "ALL";
export type MarketSort = "MARKET" | "PRICE_ASC" | "PRICE_DESC";

export function listingAgeLabel(
  createdAtGameMin: number,
  gameTimeMin: number,
  lang: Language = getLanguage(),
) {
  const age = Math.max(0, gameTimeMin - createdAtGameMin);
  if (lang === "tr") {
    if (age < 1) return "Yeni";
    if (age < 60) return `${age} dk`;
    return `${Math.floor(age / 60)} sa`;
  }
  if (lang === "de") {
    if (age < 1) return "Neu";
    if (age < 60) return `${age} Min.`;
    return `${Math.floor(age / 60)} Std.`;
  }
  if (lang === "es") {
    if (age < 1) return "Nuevo";
    if (age < 60) return `${age} min`;
    return `${Math.floor(age / 60)} h`;
  }
  if (age < 1) return "New";
  if (age < 60) return `${age}m`;
  return `${Math.floor(age / 60)}h`;
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

export function sortMarketListings(listings: Listing[], sort: MarketSort) {
  if (sort === "MARKET") return listings;
  const direction = sort === "PRICE_ASC" ? 1 : -1;
  return [...listings].sort(
    (left, right) =>
      (left.priceMinor - right.priceMinor) * direction ||
      left.id.localeCompare(right.id),
  );
}
