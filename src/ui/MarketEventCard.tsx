import { useRef, useState } from "react";
import type { MarketEventDefinition } from "../domain/marketEvents";
import { localizeMarketEvent, useTranslation } from "../i18n";
import { Icon } from "./Icon";
import { useModalFocus } from "./useModalFocus";

export default function MarketEventCard({
  event,
}: {
  event: MarketEventDefinition;
}) {
  const { lang, t } = useTranslation();
  const [selected, setSelected] = useState<MarketEventDefinition | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useModalFocus(selected !== null, panelRef, closeRef, () => setSelected(null));
  const copy = localizeMarketEvent(event, lang);
  const detail = selected ? localizeMarketEvent(selected, lang) : null;
  return (
    <>
      <button
        className="market-event market-event--compact"
        aria-label={`${t("market.eventAria")}: ${copy.title}`}
        aria-haspopup="dialog"
        onClick={() => setSelected(event)}
      >
        <span aria-hidden="true">↗</span>
        <b>{copy.title}</b>
        <i aria-hidden="true">ⓘ</i>
      </button>
      {detail ? (
        <div className="scrim" onClick={() => setSelected(null)}>
          <section
            className="sheet market-event-dialog"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="market-event-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              ref={closeRef}
              className="close"
              onClick={() => setSelected(null)}
              aria-label={t("common.close")}
            >
              <Icon name="close" />
            </button>
            <small>{t("market.eventBadge")}</small>
            <h2 id="market-event-title">{detail.title}</h2>
            <p>{detail.message}</p>
          </section>
        </div>
      ) : null}
    </>
  );
}
