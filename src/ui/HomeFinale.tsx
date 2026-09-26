import { useRef, type CSSProperties, type RefObject } from "react";
import { money } from "../game";
import { Icon } from "./Icon";
import { simplifyLegacyPlayerCopy } from "./playerLanguage";
import { useModalFocus } from "./useModalFocus";
import { homeOptionById } from "../content/homes";
import { homeAssets } from "./homeAssets";
import { useTranslation, localizeHome } from "../i18n";
import type { HomeInteriorStyle } from "../domain/appearance";

type FinaleHighlight = {
  id: string;
  label: string;
  amountMinor?: number;
};

const interiorStyles: Record<HomeInteriorStyle, CSSProperties> = {
  classic: {},
  modern: { color: "#eaf4f6", background: "radial-gradient(circle at 50% 22%,rgba(185,239,245,.28),transparent 28%),linear-gradient(150deg,#34484e,#17272e 54%,#091217)" },
  heritage: { color: "#fff3d8", background: "radial-gradient(circle at 50% 20%,rgba(255,213,138,.3),transparent 28%),linear-gradient(150deg,#6d3424,#341c1a 55%,#160e0d)" },
  coastal: { color: "#14313b", background: "radial-gradient(circle at 50% 20%,rgba(255,255,255,.8),transparent 28%),linear-gradient(155deg,#cfece8,#7fc3c3 52%,#367a8b)" },
};

export default function HomeFinale({
  highlights,
  homeId,
  interiorStyle,
  buttonRef,
  onClose,
}: {
  highlights: FinaleHighlight[];
  homeId?: string;
  interiorStyle: HomeInteriorStyle;
  buttonRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}) {
  const { t, lang } = useTranslation();
  const panelRef = useRef<HTMLElement>(null);
  const home = homeOptionById(homeId);
  useModalFocus(true, panelRef, buttonRef, onClose);
  return (
    <section
      ref={panelRef}
      className={`home-finale home-finale--${interiorStyle}`}
      style={interiorStyles[interiorStyle]}
      role="dialog"
      aria-modal="true"
      aria-labelledby="home-finale-title"
    >
      <div className="home-finale-glow" aria-hidden="true" />
      <div className="home-finale-house" aria-hidden="true">
        {home ? (
          <img src={homeAssets[home.assetKey]} alt="" />
        ) : (
          <Icon name="home" />
        )}
      </div>
      <small>{t("finale.kicker")}</small>
      <h2 id="home-finale-title">{t("finale.headline")}</h2>
      <p>
        {t("finale.desc", {
          home: home ? localizeHome(home.id, home.name, "", "", lang).name : t("finale.homeDefault"),
        })}
      </p>
      {highlights.length ? (
        <div
          className="home-finale-highlights"
          aria-label={t("finale.highlights")}
        >
          {highlights.map((event) => (
            <span key={event.id}>
              <b>{simplifyLegacyPlayerCopy(event.label, lang)}</b>
              {event.amountMinor !== undefined
                ? money(event.amountMinor, lang)
                : null}
            </span>
          ))}
        </div>
      ) : null}
      <button ref={buttonRef} onClick={onClose}>
        {t("finale.continue")}
      </button>
    </section>
  );
}
