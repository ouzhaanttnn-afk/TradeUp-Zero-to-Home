import { assetFor, fallbackAssetFor, visualTreatmentFor } from "../assets";
import type { ItemInstance } from "../domain/models";

export function ProductVisual({
  instance,
  className,
  alt = "",
  priority = false,
}: {
  instance: ItemInstance;
  className: string;
  alt?: string;
  priority?: boolean;
}) {
  const visual = visualTreatmentFor(instance);
  return (
    <div
      className={`${className} product-visual product-visual--${visual.conditionBand}${
        visual.fallback ? " product-visual--fallback" : ""
      }`}
    >
      <img
        src={assetFor(instance.family.assetKey, instance.family.category)}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        onError={(event) => {
          const fallback = fallbackAssetFor(instance.family.category);
          if (event.currentTarget.src !== fallback)
            event.currentTarget.src = fallback;
        }}
        alt={alt}
      />
      <span className="condition-overlay" aria-hidden="true" />
      {visual.revealedDefect ? (
        <span
          className="visual-badge visual-badge--defect"
          aria-label="Doğrulanmış kusur"
        >
          !
        </span>
      ) : null}
      {visual.missingAccessory ? (
        <span
          className="visual-badge visual-badge--accessory"
          aria-label="Eksik aksesuar"
        >
          −
        </span>
      ) : null}
      {visual.verifiedEvidence ? (
        <span
          className="visual-badge visual-badge--verified"
          aria-label="Kanıt doğrulandı"
        >
          ✓
        </span>
      ) : null}
    </div>
  );
}
