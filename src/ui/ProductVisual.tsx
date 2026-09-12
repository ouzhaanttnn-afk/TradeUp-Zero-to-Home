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
      <span
        className="visual-condition-bar"
        title={`Kondisyon: ${visual.conditionLabel}`}
        aria-hidden="true"
      />
      <span className="visual-statuses">
        {visual.revealedDefect ? (
          <span
            className="visual-badge visual-badge--defect"
            aria-label={`${visual.revealedDefectCount} doğrulanmış kusur`}
          >
            <b aria-hidden="true">!</b>
            <em>Kusur</em>
          </span>
        ) : null}
        {visual.missingAccessory ? (
          <span
            className="visual-badge visual-badge--accessory"
            aria-label="Eksik aksesuar"
          >
            <b aria-hidden="true">−</b>
            <em>Eksik</em>
          </span>
        ) : null}
        {visual.verifiedEvidence ? (
          <span
            className="visual-badge visual-badge--verified"
            aria-label={`${visual.verifiedEvidenceCount} kanıt doğrulandı`}
          >
            <b aria-hidden="true">✓</b>
            <em>Kontrollü</em>
          </span>
        ) : null}
      </span>
    </div>
  );
}
