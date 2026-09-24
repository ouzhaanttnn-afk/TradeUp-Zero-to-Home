import {
  SPECIALIZATIONS,
  SPEC_ICONS,
  type SpecializationId,
} from "../domain/specialization";
import { useTranslation } from "../i18n";

export default function SpecializationPanel({
  activeSpecialization,
  onSelectSpecialization,
}: {
  activeSpecialization: SpecializationId | null;
  onSelectSpecialization: (spec: SpecializationId) => void;
}) {
  const { t, lang } = useTranslation();
  const specList = Object.values(SPECIALIZATIONS);

  return (
    <section className="specialization-panel" aria-label={t("specialization.heading") || "Kariyer Uzmanlığı"}>
      <div className="section-title">
        <div>
          <small>{t("specialization.kicker") || "KARİYER YOLU"}</small>
          <h3>{t("specialization.heading") || "Ticaret Uzmanlığı"}</h3>
        </div>
      </div>
      <p className="specialization-lead">
        {t("specialization.lead") || "Kariyer tarzına uygun uzmanlığı seçerek ticaret avantajları kazan."}
      </p>

      <div className="specialization-grid">
        {specList.map((spec) => {
          const isSelected = activeSpecialization === spec.id;
          return (
            <article
              key={spec.id}
              className={`specialization-card ${isSelected ? "selected" : ""}`}
            >
              <div className="specialization-card-header">
                <div>
                  <h4>
                    <span className="spec-icon-emoji">{SPEC_ICONS[spec.id]}</span>
                    {spec.title[lang]}
                  </h4>
                  <small>{spec.subtitle[lang]}</small>
                </div>
                {isSelected ? (
                  <span className="spec-active-badge">
                    {t("specialization.active") || "AKTİF"}
                  </span>
                ) : null}
              </div>

              <ul className="spec-perk-list">
                {spec.perks[lang].map((perk, idx) => (
                  <li key={idx}>
                    <span className="perk-bullet">✓</span> {perk}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                className={isSelected ? "spec-btn-active" : "primary"}
                disabled={isSelected}
                onClick={() => onSelectSpecialization(spec.id)}
              >
                {isSelected
                  ? t("specialization.currentSelection") || "Seçili Yol"
                  : t("specialization.select") || "Bu Yolu Seç"}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
