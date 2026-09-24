import type { GameState } from "../domain/models";
import { getActiveHomePerk } from "../domain/homePerks";
import {
  getShowcaseAssets,
  maxShowcaseCapacity,
} from "../domain/showcase";
import { money } from "../game";
import { useTranslation, localizeProduct } from "../i18n";
import { ProductVisual } from "./ProductVisual";
import { Icon } from "./Icon";

export default function ShowcaseRoom({
  game,
  showcaseAssetIds,
  onSelectAsset,
  onToggleShowcase,
}: {
  game: GameState;
  showcaseAssetIds: readonly string[];
  onSelectAsset: (assetId: string) => void;
  onToggleShowcase: (assetId: string) => void;
}) {
  const { t, lang } = useTranslation();
  const capacity = maxShowcaseCapacity(game.home);
  const activeAssets = getShowcaseAssets(game.ownedAssets, showcaseAssetIds);
  const emptySlotsCount = Math.max(0, capacity - activeAssets.length);
  const homePerk = getActiveHomePerk(game.home);

  return (
    <section className="showcase-room" aria-label={t("showcase.title") || "Koleksiyon Vitrini"}>
      <div className="showcase-header">
        <div>
          <small className="showcase-kicker">
            <Icon name="star" /> {t("showcase.kicker") || "ÖZEL KOLEKSİYON"}
          </small>
          <h3>{t("showcase.title") || "Kişisel Vitrin & Müze"}</h3>
        </div>
        <span className="showcase-capacity-pill">
          {activeAssets.length} / {capacity}
        </span>
      </div>

      {homePerk ? (
        <div className="home-hq-banner">
          <Icon name="home" />
          <div>
            <strong>{homePerk.badge[lang]}</strong>
            <p>{homePerk.description[lang]}</p>
          </div>
        </div>
      ) : null}

      <div className="showcase-grid">
        {activeAssets.map((asset) => (
          <article className="showcase-card" key={asset.id}>
            <div className="showcase-card-visual">
              <ProductVisual instance={asset.instance} className="showcase-visual" />
              <span className="showcase-badge">
                <Icon name="star" /> {t("showcase.featured") || "Vitrinde"}
              </span>
            </div>
            <div className="showcase-card-content">
              <h4>{localizeProduct(asset.instance.family.id, asset.instance.family.name, lang)}</h4>
              <div className="showcase-card-meta">
                <span>{lang === "tr" ? `%${asset.instance.condition}` : `${asset.instance.condition}%`}</span>
                <strong>{money(asset.instance.fairValueMinor, lang)}</strong>
              </div>
              <div className="showcase-card-actions">
                <button
                  type="button"
                  className="showcase-inspect-btn"
                  onClick={() => onSelectAsset(asset.id)}
                >
                  {t("common.detail") || "İncele"}
                </button>
                <button
                  type="button"
                  className="showcase-remove-btn"
                  aria-label={t("showcase.remove") || "Vitrinden Kaldır"}
                  onClick={() => onToggleShowcase(asset.id)}
                >
                  <Icon name="close" />
                </button>
              </div>
            </div>
          </article>
        ))}

        {Array.from({ length: emptySlotsCount }).map((_, index) => (
          <div className="showcase-slot empty" key={`empty-${index}`}>
            <span className="empty-slot-icon">✦</span>
            <b>{t("showcase.emptySlot") || "Boş Vitrin Yuvası"}</b>
            <small>{t("showcase.emptyDesc") || "Portföyünden değerli eşyaları vitrine ekle."}</small>
          </div>
        ))}
      </div>
    </section>
  );
}
