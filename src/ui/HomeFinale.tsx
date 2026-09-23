import { useRef, type RefObject } from "react";
import { money } from "../game";
import { Icon } from "./Icon";
import { simplifyLegacyPlayerCopy } from "./playerLanguage";
import { useModalFocus } from "./useModalFocus";
import { homeOptionById } from "../content/homes";
import { homeAssets } from "./homeAssets";
import { useTranslation } from "../i18n";

type FinaleHighlight = {
  id: string;
  label: string;
  amountMinor?: number;
};

export default function HomeFinale({
  highlights,
  homeId,
  buttonRef,
  onClose,
}: {
  highlights: FinaleHighlight[];
  homeId?: string;
  buttonRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const panelRef = useRef<HTMLElement>(null);
  const home = homeOptionById(homeId);
  useModalFocus(true, panelRef, buttonRef, onClose);
  return (
    <section
      ref={panelRef}
      className="home-finale"
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
          home: home?.name ?? t("finale.homeDefault"),
        })}
      </p>
      {highlights.length ? (
        <div
          className="home-finale-highlights"
          aria-label={t("finale.highlights")}
        >
          {highlights.map((event) => (
            <span key={event.id}>
              <b>{simplifyLegacyPlayerCopy(event.label)}</b>
              {event.amountMinor !== undefined
                ? money(event.amountMinor)
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

