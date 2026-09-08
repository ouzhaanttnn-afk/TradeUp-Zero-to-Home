import type { Listing } from "../domain/models";
import { money } from "../game";
import { Icon } from "./Icon";
import { listingAgeLabel } from "./marketCard";
import { ProductVisual } from "./ProductVisual";

type MarketRisk = {
  level: "low" | "medium" | "high" | "critical";
  text: string;
};

type MarketSignal = {
  cls: string;
  text: string;
};

const evidenceLabel = (confidence: number) =>
  confidence >= 0.72 ? "Yüksek" : confidence >= 0.46 ? "Orta" : "Düşük";

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
  const ageLabel = listingAgeLabel(item.createdAtGameMin, gameTimeMin);
  return (
    <button
      className="listing market-card"
      data-listing-id={item.id}
      data-price-minor={item.priceMinor}
      onClick={onSelect}
      aria-label={`${item.instance.family.name}, fiyat ${money(item.priceMinor)}, kondisyon yüzde ${item.instance.condition}, bilgi güveni ${evidenceLabel(item.instance.evidenceConfidence)}, ${ageLabel}, ${itemSignal.text}. İlan detaylarını aç`}
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
          {item.instance.family.category} · Sv. {categoryLevel}
        </small>
        <h3>{item.instance.family.name}</h3>
        <div className="market-price-row">
          <strong>{money(item.priceMinor)}</strong>
          {watched ? (
            <span className="watch-state">
              <Icon name="follow" /> Takipte
            </span>
          ) : null}
        </div>
        <div className="tags">
          <b className={itemSignal.cls}>{itemSignal.text}</b>
          <span>%{item.instance.condition} kondisyon</span>
        </div>
        <div className="market-card-facts">
          <span>Bilgi: {evidenceLabel(item.instance.evidenceConfidence)}</span>
          <span>İlgi %{item.interest}</span>
          <span>{ageLabel}</span>
        </div>
      </div>
    </button>
  );
}
