import type { Listing } from "../domain/models";
import { money } from "../game";
import { Icon } from "./Icon";
import { listingAgeLabel } from "./marketCard";
import { ProductVisual } from "./ProductVisual";
import {
  useTranslation,
  localizeProduct,
  localizeCategory,
  localizeConfidence,
  localizeSignal,
} from "../i18n";

type MarketRisk = {
  level: "low" | "medium" | "high" | "critical";
  text: string;
};

type MarketSignal = {
  cls: string;
  text: string;
};

export function MarketListingCard({
  item,
  categoryLevel,
  itemSignal,
  risk,
  watched,
  gameTimeMin,
  priority,
  onSelect,
}: {
  item: Listing;
  categoryLevel: number;
  itemSignal: MarketSignal;
  risk: MarketRisk;
  watched: boolean;
  gameTimeMin: number;
  priority: boolean;
  onSelect: () => void;
}) {
  const { lang, t } = useTranslation();
  const ageLabel = listingAgeLabel(item.createdAtGameMin, gameTimeMin, lang);
  const upperMarket = item.instance.family.tier >= 4;
  const productName = localizeProduct(item.instance.family.id, item.instance.family.name, lang);
  const categoryName = localizeCategory(item.instance.family.category, lang);
  const confidence = localizeConfidence(item.instance.evidenceConfidence, lang);
  const signalText = localizeSignal(itemSignal.text, lang);

  return (
    <button
      className={`listing market-card${upperMarket ? " market-card--upper-market" : ""}`}
      data-listing-id={item.id}
      data-price-minor={item.priceMinor}
      data-market-tier={item.instance.family.tier}
      onClick={onSelect}
      aria-label={`${productName}, ${money(item.priceMinor, lang)}, %${item.instance.condition}, ${confidence}, ${ageLabel}, ${signalText}. ${t("market.openDetail")}`}
    >
      <div className="market-visual-frame">
        <ProductVisual
          instance={item.instance}
          className="product-art"
          priority={priority}
        />
        <span className="market-condition-signal">
          %{item.instance.condition}
        </span>
      </div>
      {risk.level !== "low" ? (
        <span className={`market-heat market-heat--${risk.level}`}>
          {risk.text}
        </span>
      ) : null}
      <div className="listing-copy">
        <small className="market-category">
          {categoryName} · {t("journey.categoryLevel")} {categoryLevel}
        </small>
        <h3>{productName}</h3>
        <div className="market-price-row">
          <strong>{money(item.priceMinor, lang)}</strong>
          {watched ? (
            <span className="watch-state">
              <Icon name="follow" /> {t("follow.badge") || "Takipte"}
            </span>
          ) : null}
        </div>
        <div className="tags">
          <b className={itemSignal.cls}>{signalText}</b>
          <span>%{item.instance.condition} {t("market.conditionBadge") || "kondisyon"}</span>
        </div>
        <div className="market-card-facts">
          <span>{confidence}</span>
          <span>{ageLabel}</span>
        </div>
      </div>
    </button>
  );
}

