import { assetFor, fallbackAssetFor, visualTreatmentFor } from "../assets";
import type { ItemInstance } from "../domain/models";
import { useTranslation, localizeVisualCondition } from "../i18n";

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
  const { t, lang } = useTranslation();
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
        title={t("market.conditionTitle", { condition: localizeVisualCondition(instance.condition, lang) })}
        aria-hidden="true"
      />
      <span className="visual-statuses">
        {visual.revealedDefect ? (
          <span
            className="visual-badge visual-badge--defect"
            aria-label={t("visual.defectCount", { count: visual.revealedDefectCount })}
          >
            <b aria-hidden="true">!</b>
            <em>{t("visual.defect")}</em>
          </span>
        ) : null}
        {visual.missingAccessory ? (
          <span
            className="visual-badge visual-badge--accessory"
            aria-label={t("visual.missingAccessory")}
          >
            <b aria-hidden="true">−</b>
            <em>{t("visual.missing")}</em>
          </span>
        ) : null}
        {visual.verifiedEvidence ? (
          <span
            className="visual-badge visual-badge--verified"
            aria-label={t("visual.verifiedCount", { count: visual.verifiedEvidenceCount })}
          >
            <b aria-hidden="true">✓</b>
            <em>{t("visual.verified")}</em>
          </span>
        ) : null}
      </span>
    </div>
  );
}
