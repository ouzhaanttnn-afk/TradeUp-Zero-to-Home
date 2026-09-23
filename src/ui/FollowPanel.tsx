import { familyById } from "../content/families";
import { savedSearchMatches } from "../domain/meta";
import type { GameState, Listing } from "../domain/models";
import { npcRiskSignal } from "../domain/world";
import { money } from "../game";
import { missedOpportunityPresentation } from "./followPresentation";
import { Icon } from "./Icon";
import { ProductVisual } from "./ProductVisual";
import { useTranslation } from "../i18n";

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
  const { t } = useTranslation();
  const watchedListings = marketListings.filter((listing) =>
    game.follow.watchedListingIds.includes(listing.id),
  );

  return (
    <>
      <div className="section-title">
        <div>
          <small>{t("follow.heading")}</small>
          <h2 id="follow-sheet-title">{t("follow.title")}</h2>
        </div>
        <span>{t("follow.activeCount", { count: watchedListings.length })}</span>
      </div>
      {!watchedListings.length &&
      !game.follow.savedSearches.length &&
      !game.follow.missedOpportunities.length ? (
        <div className="empty">
          <span className="empty-icon">
            <Icon name="follow" />
          </span>
          <h3>{t("follow.emptyTitle")}</h3>
          <p>{t("follow.emptyDesc")}</p>
          <button onClick={onOpenMarket}>{t("follow.emptyAction")}</button>
        </div>
      ) : null}
      {watchedListings.length ? (
        <h3 className="module-title">{t("follow.watchlistTitle")}</h3>
      ) : null}
      <div className="feed compact-feed">
        {watchedListings.map((item) => (
          <button
            className="listing watch-listing"
            key={item.id}
            onClick={() => onSelectListing(item.id)}
            aria-label={`${item.instance.family.name}, ${money(item.priceMinor)}, %${item.instance.condition}`}
          >
            <ProductVisual instance={item.instance} className="product-art" />
            <div className="listing-copy">
              <small>CANLI · %{item.instance.condition}</small>
              <h3>{item.instance.family.name}</h3>
              <span className="subtle">
                {npcRiskSignal(item, game.gameTimeMin).text}
              </span>
            </div>
            <div className="price">
              <strong>{money(item.priceMinor)}</strong>
              <small>{t("follow.inspect")}</small>
            </div>
          </button>
        ))}
      </div>
      {game.follow.savedSearches.length ? (
        <h3 className="module-title">{t("follow.alertsTitle")}</h3>
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
                  <small>{t("follow.alertsTitle").toUpperCase()}</small>
                  <h3>{family?.name ?? t("follow.unknownFamily")}</h3>
                </div>
                <span
                  className={`match-count${matches.length ? " has-matches" : ""}`}
                >
                  {matches.length
                    ? t("follow.matches", { count: matches.length })
                    : t("follow.waiting")}
                </span>
              </div>
              <div className="alarm-criteria">
                <span>
                  <small>{t("follow.maxPrice")}</small>
                  <b>{money(search.maxPriceMinor)}</b>
                </span>
                <span>
                  <small>{t("follow.minCondition")}</small>
                  <b>%{search.minCondition}</b>
                </span>
                <span>
                  <small>{t("follow.evidence")}</small>
                  <b>
                    {search.evidencePreference === "CHECKED"
                      ? t("follow.evidenceRequired")
                      : t("follow.evidenceAny")}
                  </b>
                </span>
              </div>
              <div className="inline-actions">
                {matches[0] ? (
                  <button
                    className="primary"
                    onClick={() => onSelectListing(matches[0].id)}
                  >
                    {t("follow.openMatch")}
                  </button>
                ) : null}
                <button
                  className="text-button"
                  onClick={() => onRemoveSearch(search.id)}
                >
                  {t("follow.remove")}
                </button>
              </div>
            </article>
          );
        })}
      </div>
      {game.follow.missedOpportunities.length ? (
        <h3 className="module-title">{t("follow.missedTitle")}</h3>
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
                  {t("follow.missedDesc", {
                    price: money(missed.priceMinor),
                    condition: missed.condition,
                  })}
                </p>
              </div>
              {similar ? (
                <button onClick={() => onSelectListing(similar.id)}>
                  {t("follow.seeSimilar")}
                </button>
              ) : (
                <button onClick={onOpenMarket}>{t("follow.returnMarket")}</button>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}

