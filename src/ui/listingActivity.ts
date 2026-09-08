import type { BuyerOffer, PlayerListing } from "../domain/models";

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
  let diagnosis: string | undefined;
  if (active && offers.length === 0 && signals) {
    if (listing.askingPriceMinor > signals.estimateHighMinor) {
      diagnosis = "Fiyat, tahmini piyasa aralığının üzerinde.";
    } else if (signals.evidenceConfidence < 0.45) {
      diagnosis = "Ürün bilgisi zayıf; alıcılar temkinli davranıyor.";
    } else if (signals.competingListings >= 3) {
      diagnosis = "Benzer ilan sayısı yüksek; ürünün öne çıkması zorlaşıyor.";
    } else if (signals.demand < 0.45) {
      diagnosis = "Bu ürüne talep şu an düşük.";
    } else if (ageMin < 3) {
      diagnosis = "İlan yeni; alıcıların görmesi biraz zaman alabilir.";
    } else if (listing.interest < 25) {
      diagnosis = "İlan görülüyor ancak ilgi henüz sınırlı.";
    } else {
      diagnosis = "İlgi var; uygun teklif için biraz daha zaman gerekebilir.";
    }
  }
  return {
    offers,
    waiting: active && offers.length === 0,
    diagnosis,
    ageLabel:
      ageMin === 0
        ? "Az önce yayınlandı"
        : `${ageMin} oyun dakikasıdır yayında`,
  };
}
