import { useState } from "react";
import type { GameState } from "../domain/models";
import { getShowcaseAssets, maxShowcaseCapacity } from "../domain/showcase";
import { instanceEstimateBand } from "../domain/decision";
import { categoryExpertiseLevel } from "../domain/meta";
import { formatEstimate } from "./wealthPresentation";
import { useTranslation, localizeProduct } from "../i18n";
import { ProductVisual } from "./ProductVisual";
import { Icon } from "./Icon";
import { careerCopy } from "./careerPresentation";

export default function ShowcaseRoom({
  game,
  showcaseAssetIds,
  onSelectAsset,
  onToggleShowcase,
  onOpenInventory,
}: {
  game: GameState;
  showcaseAssetIds: readonly string[];
  onSelectAsset: (assetId: string) => void;
  onToggleShowcase: (assetId: string) => void;
  onOpenInventory?: () => void;
}) {
  const { t, lang } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const copy = careerCopy(lang);
  const capacity = maxShowcaseCapacity(game.home);
  const activeAssets = getShowcaseAssets(game.ownedAssets, showcaseAssetIds);
  const emptySlotsCount = Math.max(0, capacity - activeAssets.length);
  const estimates = activeAssets.map((asset) =>
    instanceEstimateBand(
      asset.instance,
      categoryExpertiseLevel(game, asset.instance.family.category),
    ),
  );
  const totalEstimate = estimates.reduce(
    (sum, band) => ({
      lowMinor: sum.lowMinor + band.lowMinor,
      highMinor: sum.highMinor + band.highMinor,
    }),
    { lowMinor: 0, highMinor: 0 },
  );

  return (
    <section
      className="showcase-room"
      aria-label={t("showcase.title") || "Koleksiyon Vitrini"}
    >
      <div className="showcase-header">
        <div>
          <small className="showcase-kicker">
            <Icon name="star" /> {t("showcase.kicker") || "ÖZEL KOLEKSİYON"}
          </small>
          <h3>{t("showcase.title") || "Kişisel Vitrin & Müze"}</h3>
        </div>
        <div className="showcase-header-badges">
          {activeAssets.length > 0 ? (
            <span
              className="showcase-value-pill"
              title={t("showcase.totalValue") || "Toplam Değer"}
            >
              ⭐ {formatEstimate(totalEstimate, false, lang)}
            </span>
          ) : null}
          <span className="showcase-capacity-pill">
            {activeAssets.length} / {capacity}
          </span>
        </div>
      </div>
      <button
        className="secondary showcase-disclosure"
        aria-expanded={expanded}
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? copy.collapseShowcase : copy.expandShowcase}
      </button>
      {expanded ? (
        <div className="showcase-grid">
          {activeAssets.map((asset, index) => (
            <article className="showcase-card" key={asset.id}>
              <div className="showcase-card-visual">
                <ProductVisual
                  instance={asset.instance}
                  className="showcase-visual"
                />
                <span className="showcase-badge">
                  <Icon name="star" /> {t("showcase.featured") || "Vitrinde"}
                </span>
              </div>
              <div className="showcase-card-content">
                <h4>
                  {localizeProduct(
                    asset.instance.family.id,
                    asset.instance.family.name,
                    lang,
                  )}
                </h4>
                <div className="showcase-card-meta">
                  <span>
                    {lang === "tr"
                      ? `%${asset.instance.condition}`
                      : `${asset.instance.condition}%`}
                  </span>
                  <strong>
                    {formatEstimate(estimates[index], false, lang)}
                  </strong>
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
            <div
              className={`showcase-slot empty ${onOpenInventory ? "clickable" : ""}`}
              key={`empty-${index}`}
              role={onOpenInventory ? "button" : undefined}
              tabIndex={onOpenInventory ? 0 : undefined}
              onClick={onOpenInventory}
              onKeyDown={
                onOpenInventory
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onOpenInventory();
                      }
                    }
                  : undefined
              }
            >
              <span className="empty-slot-icon">✦</span>
              <b>{t("showcase.emptySlot") || "Boş Vitrin Yuvası"}</b>
              <small>
                {t("showcase.emptyDesc") ||
                  "Portföyünden değerli eşyaları vitrine ekle."}
              </small>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
