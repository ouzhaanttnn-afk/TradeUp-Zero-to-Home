import type { GameState } from "../domain/models";
import type { RadarSignal } from "../domain/marketEvents";
import { Icon } from "./Icon";
import { useTranslation, localizeCategory, localizeMarketMessage } from "../i18n";

export default function RadarPanel({
  game,
  signal,
  onOpenMarketCategory,
}: {
  game: GameState;
  signal: RadarSignal | null;
  onOpenMarketCategory: (category: string) => void;
}) {
  const { t, lang } = useTranslation();

  const getTierCopy = (tier: RadarSignal["tier"]) => {
    if (tier === "HIGH") {
      return {
        badge: t("radar.tierHighBadge"),
        detail: t("radar.tierHighDetail"),
      };
    }
    return {
      badge: t("radar.tierRisingBadge"),
      detail: t("radar.tierRisingDetail"),
    };
  };

  return (
    <>
      <div className="section-title">
        <div>
          <small>{t("radar.heading")}</small>
          <h2>{t("radar.mainTitle")}</h2>
        </div>
      </div>
      {signal ? (
        <section className={`radar-card radar-card--${signal.tier}`}>
          <div className="radar-card-heading">
            <span className="radar-badge" aria-hidden="true">
              <Icon name="radar" />
            </span>
            <div>
              <b>{getTierCopy(signal.tier).badge}</b>
              <small>{localizeMarketMessage(signal.message, lang)}</small>
            </div>
          </div>
          <div className="radar-categories">
            {signal.categories.map((category) => (
              <button
                key={category}
                onClick={() => onOpenMarketCategory(category)}
                aria-label={`${localizeCategory(category, lang)}`}
              >
                <span>{localizeCategory(category, lang)}</span>
                <small>{getTierCopy(signal.tier).detail}</small>
              </button>
            ))}
          </div>
          <p className="radar-effect-note">{t("radar.activeNote")}</p>
        </section>
      ) : (
        <section className="radar-card radar-card--calm">
          <div className="radar-card-heading">
            <span className="radar-badge" aria-hidden="true">
              <Icon name="radar" />
            </span>
            <div>
              <b>{t("radar.balancedTitle")}</b>
              <small>{t("radar.balancedDesc")}</small>
            </div>
          </div>
          <p className="radar-effect-note">{t("radar.calmNote")}</p>
        </section>
      )}
      <p className="radar-footnote">{t("radar.footnote")}</p>
      {game.follow.watchedListingIds.length ? (
        <p className="radar-footnote">
          {t("radar.followHint").replace("{icon}", "")}{" "}
          <Icon name="follow" />
        </p>
      ) : null}
    </>
  );
}

