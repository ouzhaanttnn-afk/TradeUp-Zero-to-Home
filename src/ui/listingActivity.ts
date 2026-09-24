import type { BuyerOffer, PlayerListing } from "../domain/models";
import { t, type Language } from "../i18n";

type ListingSignals = {
  estimateLowMinor: number;
  estimateHighMinor: number;
  evidenceConfidence: number;
  demand: number;
  competingListings: number;
};

export function listingActivity(
  listing: PlayerListing,
  buyerOffers: readonly BuyerOffer[],
  gameTimeMin: number,
  signals?: ListingSignals,
  lang?: Language,
) {
  const active =
    listing.state === "ACTIVE" && listing.expiresAtGameMin > gameTimeMin;
  const offers = active
    ? buyerOffers.filter(
        (offer) =>
          offer.listingId === listing.id &&
          offer.expiresAtGameMin > gameTimeMin,
      )
    : [];
  const ageMin = Math.max(0, Math.floor(gameTimeMin - listing.createdAtGameMin));
  const remainingMin = Math.max(0, listing.expiresAtGameMin - gameTimeMin);
  let diagnosis: string | undefined;
  if (active && offers.length === 0 && signals) {
    if (listing.askingPriceMinor > signals.estimateHighMinor) {
      diagnosis = t("activity.overpriced", undefined, lang);
    } else if (signals.evidenceConfidence < 0.45) {
      diagnosis = t("activity.lowEvidence", undefined, lang);
    } else if (signals.competingListings >= 3) {
      diagnosis = t("activity.highCompetition", undefined, lang);
    } else if (signals.demand < 0.45) {
      diagnosis = t("activity.lowDemand", undefined, lang);
    } else if (ageMin < 3) {
      diagnosis = t("activity.tooNew", undefined, lang);
    } else if (listing.interest < 25) {
      diagnosis = t("activity.limitedInterest", undefined, lang);
    } else {
      diagnosis = t("activity.solidInterest", undefined, lang);
    }
  }
  return {
    offers,
    waiting: active && offers.length === 0,
    diagnosis,
    ageLabel:
      ageMin === 0
        ? t("activity.justPublished", undefined, lang)
        : t("activity.publishedMins", { min: ageMin }, lang),
    remainingLabel: t("activity.autoCloseIn", { min: remainingMin }, lang),
  };
}
