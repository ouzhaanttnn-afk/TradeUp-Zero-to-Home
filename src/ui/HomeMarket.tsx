import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { GameState } from "../domain/models";
import {
  homeOptionById,
  marketHomeOptions,
  type HomeOption,
} from "../content/homes";
import { homeAssets } from "./homeAssets";
import { useModalFocus } from "./useModalFocus";
import { useTranslation, localizeHome } from "../i18n";
import { money } from "../game";
import { Icon } from "./Icon";
import "./firstHome.css";

export default function HomeMarket({
  game,
  mode,
  onBuy,
}: {
  game: GameState;
  mode: "featured" | "all" | "owned";
  onBuy?: (id: string) => boolean;
}) {
  const { lang, t } = useTranslation();
  const tr = lang === "tr";
  const [selected, setSelected] = useState<HomeOption | null>(null);
  const [error, setError] = useState("");
  const panel = useRef<HTMLElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const lock = useRef(false);
  useModalFocus(selected !== null, panel, close, () => setSelected(null));
  const options = marketHomeOptions(game);
  const owned = game.home.purchased
    ? homeOptionById(game.home.purchasedHomeId)
    : undefined;
  const homes =
    mode === "owned"
      ? owned
        ? [owned]
        : []
      : mode === "all"
        ? options
        : options.slice(0, 1);
  if (!homes.length)
    return mode === "all" ? (
      <p className="home-market-empty" role="status">
        {tr
          ? "Yeni ev ilanları araştırma sonuçlandıkça burada görünür. Yenileme ilanları silmez veya araştırmayı sıfırlamaz."
          : "Home listings appear here as research progresses. Refreshing does not remove listings or reset research."}
      </p>
    ) : null;
  const localized = selected
    ? localizeHome(
        selected.id,
        selected.name,
        selected.location,
        selected.summary,
        lang,
      )
    : null;
  return (
    <>
      {homes.map((home) => {
        const copy = localizeHome(
          home.id,
          home.name,
          home.location,
          home.summary,
          lang,
        );
        return (
          <article
            className={`home-market-tile ${mode === "owned" ? "home-market-tile--owned" : ""}`}
            key={home.id}
          >
            <button
              className="home-market-open"
              onClick={() => {
                setError("");
                setSelected(home);
              }}
            >
              <div className="home-market-art">
                <Icon name="home" />
                <img
                  src={homeAssets[home.assetKey]}
                  alt=""
                  onError={(event) => {
                    event.currentTarget.hidden = true;
                  }}
                />
              </div>
              <small>
                {mode === "owned"
                  ? tr
                    ? "EVİM · SAHİPSİN"
                    : "MY HOME · OWNED"
                  : tr
                    ? "EMLAK"
                    : "REAL ESTATE"}{" "}
                · {copy.location}
              </small>
              <strong>{copy.name}</strong>
              <span>
                {mode === "owned"
                  ? tr
                    ? "Evimi görüntüle"
                    : "View my home"
                  : money(home.priceMinor, lang)}
              </span>
            </button>
          </article>
        );
      })}
      {selected && localized
        ? createPortal(
            <div className="scrim" onClick={() => setSelected(null)}>
              <section
                ref={panel}
                className="sheet home-detail-sheet"
                role="dialog"
                aria-modal="true"
                aria-labelledby="home-market-title"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  ref={close}
                  className="close"
                  onClick={() => setSelected(null)}
                  aria-label={t("common.close")}
                >
                  <Icon name="close" />
                </button>
                <div className="home-market-art">
                  <Icon name="home" />
                  <img
                    src={homeAssets[selected.assetKey]}
                    alt=""
                    onError={(event) => {
                      event.currentTarget.hidden = true;
                    }}
                  />
                </div>
                <small>{localized.location}</small>
                <h2 id="home-market-title">{localized.name}</h2>
                <p>{localized.summary}</p>
                {mode === "owned" ? (
                  <p>
                    {tr
                      ? "Bu ev senin. İlk ev anın, sonraki yükseltmelerden bağımsız saklanır."
                      : "This is your home. Your first-home memory stays separate from future upgrades."}
                  </p>
                ) : (
                  <>
                    <strong>{money(selected.priceMinor, lang)}</strong>
                    <p>
                      {tr
                        ? "Alımda bedelin tamamı nakdinden düşer. Varsa önceki evin için takas ödemesi yapılmaz."
                        : "The full price is paid from cash. There is no trade-in credit for a previous home."}
                    </p>
                    {game.cashMinor < selected.priceMinor ? (
                      <p>
                        {t("journey.cashShortfallDesc", {
                          amount: money(
                            selected.priceMinor - game.cashMinor,
                            lang,
                          ),
                        })}
                      </p>
                    ) : null}
                    <button
                      disabled={game.cashMinor < selected.priceMinor}
                      onClick={() => {
                        if (lock.current) return;
                        lock.current = true;
                        try {
                          if (onBuy?.(selected.id)) setSelected(null);
                          else
                            setError(
                              tr
                                ? "Alım tamamlanamadı; nakit ve ilanın durumunu kontrol et."
                                : "Purchase could not complete; check cash and listing availability.",
                            );
                        } finally {
                          lock.current = false;
                        }
                      }}
                    >
                      {tr ? "Onayla ve evi satın al" : "Confirm home purchase"}{" "}
                      · {money(selected.priceMinor, lang)}
                    </button>
                  </>
                )}
                {error ? <p role="alert">{error}</p> : null}
              </section>
            </div>,
            document.querySelector(".app-shell") ?? document.body,
          )
        : null}
    </>
  );
}
