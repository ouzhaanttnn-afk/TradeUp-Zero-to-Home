import type { BuyerOffer, PlayerListing } from "../domain/models";

export function listingActivity(
  listing: PlayerListing,
  buyerOffers: readonly BuyerOffer[],
  gameTimeMin: number,
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
  const ageMin = Math.max(
    0,
    Math.floor(gameTimeMin - listing.createdAtGameMin),
  );
  return {
    offers,
    waiting: active && offers.length === 0,
    ageLabel:
      ageMin === 0
        ? "Az önce yayınlandı"
        : `${ageMin} oyun dakikasıdır yayında`,
  };
}
