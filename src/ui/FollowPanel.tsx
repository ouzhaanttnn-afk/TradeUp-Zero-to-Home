import { familyById } from "../content/families";
import { savedSearchMatches } from "../domain/meta";
import type { GameState, Listing } from "../domain/models";
import { npcRiskSignal } from "../domain/world";
import { money } from "../game";
import { missedOpportunityPresentation } from "./followPresentation";
import { Icon } from "./Icon";
import { ProductVisual } from "./ProductVisual";

export default function FollowPanel({
  game,
  marketListings,
  onSelectListing,
  onOpenMarket,
  onRemoveSearch,
}: {
  game: GameState;
  marketListings: Listing[];
  onSelectListing: (listingId: string) => void;
  onOpenMarket: () => void;
  onRemoveSearch: (searchId: string) => void;
}) {
  const watchedListings = marketListings.filter((listing) =>
    game.follow.watchedListingIds.includes(listing.id),
  );

  return (
    <>
      <div className="section-title">
        <div>
          <small>GERİ DÖNÜŞ NOKTAN</small>
          <h2>Takip</h2>
        </div>
        <span>{watchedListings.length} canlı</span>
      </div>
      {!watchedListings.length &&
      !game.follow.savedSearches.length &&
      !game.follow.missedOpportunities.length ? (
        <div className="empty">
          <span className="empty-icon">
            <Icon name="follow" />
          </span>
          <h3>Henüz takip yok</h3>
          <p>
            Bir ilanı takip et. Pazar deneyimin Seviye 3 olduğunda ürün alarmı
            da kurabilirsin.
          </p>
          <button onClick={onOpenMarket}>Pazardan ürün seç</button>
        </div>
      ) : null}
      {watchedListings.length ? (
        <h3 className="module-title">İzleme listesi</h3>
      ) : null}
      <div className="feed compact-feed">
        {watchedListings.map((item) => (
          <button
            className="listing watch-listing"
            key={item.id}
            onClick={() => onSelectListing(item.id)}
            aria-label={`${item.instance.family.name}, fiyat ${money(item.priceMinor)}, yüzde ${item.instance.condition} kondisyon. Takip edilen ilanı aç`}
          >
            <ProductVisual instance={item.instance} className="product-art" />
            <div className="listing-copy">
              <small>CANLI · %{item.instance.condition} kondisyon</small>
              <h3>{item.instance.family.name}</h3>
              <span className="subtle">
                {npcRiskSignal(item, game.gameTimeMin).text}
              </span>
            </div>
            <div className="price">
              <strong>{money(item.priceMinor)}</strong>
              <small>incele</small>
            </div>
          </button>
        ))}
      </div>
      {game.follow.savedSearches.length ? (
        <h3 className="module-title">Ürün alarmları</h3>
      ) : null}
      <div className="follow-stack">
        {game.follow.savedSearches.map((search) => {
          const family = familyById(search.familyId);
          const matches = marketListings.filter((listing) =>
            savedSearchMatches(search, listing),
          );
          return (
            <article className="follow-card" key={search.id}>
              <div className="follow-card-heading">
                <div>
                  <small>ÜRÜN ALARMI</small>
                  <h3>{family?.name ?? "Bilinmeyen ürün grubu"}</h3>
                </div>
                <span
                  className={`match-count${matches.length ? " has-matches" : ""}`}
                >
                  {matches.length ? `${matches.length} eşleşme` : "Bekliyor"}
                </span>
              </div>
              <div className="alarm-criteria">
                <span>
                  <small>En yüksek fiyat</small>
                  <b>{money(search.maxPriceMinor)}</b>
                </span>
                <span>
                  <small>En düşük kondisyon</small>
                  <b>%{search.minCondition}</b>
                </span>
                <span>
                  <small>Bilgi kontrolü</small>
                  <b>
                    {search.evidencePreference === "CHECKED"
                      ? "Gerekli"
                      : "Fark etmez"}
                  </b>
                </span>
              </div>
              <div className="inline-actions">
                {matches[0] ? (
                  <button
                    className="primary"
                    onClick={() => onSelectListing(matches[0].id)}
                  >
                    Eşleşmeyi aç
                  </button>
                ) : null}
                <button
                  className="text-button"
                  onClick={() => onRemoveSearch(search.id)}
                >
                  Kaldır
                </button>
              </div>
            </article>
          );
        })}
      </div>
      {game.follow.missedOpportunities.length ? (
        <h3 className="module-title">Kaçan fırsatlar</h3>
      ) : null}
      <div className="follow-stack">
        {game.follow.missedOpportunities.toReversed().map((missed) => {
          const similar = marketListings.find(
            (listing) => listing.familyId === missed.familyId,
          );
          const missedState = missedOpportunityPresentation(
            missed.reason,
            game.gameTimeMin,
            missed.atGameMin,
          );
          return (
            <article className="follow-card missed" key={missed.id}>
              <div className="missed-meta">
                <small className={`missed-reason ${missedState.tone}`}>
                  {missedState.label}
                </small>
                <span className="missed-age">{missedState.ageLabel}</span>
              </div>
              <div>
                <h3>{missed.familyName}</h3>
                <p>
                  {money(missed.priceMinor)} · %{missed.condition} kondisyon.
                  Fırsat kapandı; benzer ilanları aramaya devam edebilirsin.
                </p>
              </div>
              {similar ? (
                <button onClick={() => onSelectListing(similar.id)}>
                  Benzerini gör
                </button>
              ) : (
                <button onClick={onOpenMarket}>Pazara dön</button>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}
