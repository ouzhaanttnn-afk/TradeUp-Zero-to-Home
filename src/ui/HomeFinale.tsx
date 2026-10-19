import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import { createHomeCard, shareHomeCard } from "./homeShare";
import { useGameStore } from "../stores/gameStore";
import "./firstHome.css";
import { money } from "../game";
import { Icon } from "./Icon";
import { useModalFocus } from "./useModalFocus";
import { homeOptionById } from "../content/homes";
import { homeAssets } from "./homeAssets";
import { useTranslation, localizeHome, localizeProduct } from "../i18n";
import type { HomeInteriorStyle } from "../domain/appearance";
import type { FirstHomeSummary } from "../domain/models";
import { assetFor, fallbackAssetFor } from "../assets";
import { familyById } from "../content/families";
import { careerCopy } from "./careerPresentation";

const interiorStyles: Record<HomeInteriorStyle, CSSProperties> = {
  classic: {},
  modern: {
    color: "#eaf4f6",
    background:
      "radial-gradient(circle at 50% 22%,rgba(185,239,245,.28),transparent 28%),linear-gradient(150deg,#34484e,#17272e 54%,#091217)",
  },
  heritage: {
    color: "#fff3d8",
    background:
      "radial-gradient(circle at 50% 20%,rgba(255,213,138,.3),transparent 28%),linear-gradient(150deg,#6d3424,#341c1a 55%,#160e0d)",
  },
  coastal: {
    color: "#14313b",
    background:
      "radial-gradient(circle at 50% 20%,rgba(255,255,255,.8),transparent 28%),linear-gradient(155deg,#cfece8,#7fc3c3 52%,#367a8b)",
  },
};

export default function HomeFinale({
  summary,
  interiorStyle,
  buttonRef,
  onClose,
}: {
  summary: FirstHomeSummary;
  interiorStyle: HomeInteriorStyle;
  buttonRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}) {
  const { t, lang } = useTranslation();
  const copy = careerCopy(lang);
  const [includeName, setIncludeName] = useState(false);
  const [card, setCard] = useState<{ blob: Blob; url: string } | null>(null);
  const [sharing, setSharing] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const shareLock = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(
    () => () => {
      if (card) URL.revokeObjectURL(card.url);
    },
    [card],
  );
  const preview = async () => {
    if (shareLock.current) return;
    shareLock.current = true;
    setSharing(true);
    setShareMessage("");
    try {
      const profile = useGameStore.getState().game.profile;
      const blob = await createHomeCard(
        summary,
        lang,
        profile.avatarId,
        includeName ? profile.displayName : undefined,
      );
      if (mounted.current) setCard({ blob, url: URL.createObjectURL(blob) });
    } catch {
      if (mounted.current)
        setShareMessage(
          lang === "tr"
            ? "Görsel hazırlanamadı. Yeniden deneyebilirsin."
            : "Could not prepare the image. Please retry.",
        );
    } finally {
      shareLock.current = false;
      if (mounted.current) setSharing(false);
    }
  };
  const panelRef = useRef<HTMLElement>(null);
  const home = homeOptionById(summary.homeId);
  const memories = [summary.firstProfitableSale, summary.bestSale].filter(
    (sale, index, all) =>
      sale &&
      all.findIndex((other) => other?.transactionId === sale.transactionId) ===
        index,
  );
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
      <h2 id="home-finale-title">{copy.title}</h2>
      <p>
        {t("finale.desc", {
          home: home
            ? localizeHome(home.id, home.name, "", "", lang).name
            : t("finale.homeDefault"),
        })}
      </p>
      {summary.completeness === "PARTIAL" ? (
        <p className="career-partial">{copy.partial}</p>
      ) : null}
      <div className="home-finale-highlights">
        {summary.marketTradeCount !== undefined ? (
          <span>
            <b>{copy.trades}</b>
            {summary.marketTradeCount}
          </span>
        ) : null}
        {summary.marketProfitMinor !== undefined ? (
          <span>
            <b>{copy.profit}</b>
            {money(summary.marketProfitMinor, lang)}
          </span>
        ) : null}
      </div>
      <div className="home-sale-memories">
        {memories.map((sale) =>
          sale ? (
            <article key={sale.transactionId}>
              <img
                src={assetFor(sale.assetKey, sale.categoryId)}
                alt=""
                onError={(event) => {
                  if (event.currentTarget.dataset.fallbackApplied) {
                    event.currentTarget.hidden = true;
                    return;
                  }
                  event.currentTarget.dataset.fallbackApplied = "true";
                  event.currentTarget.src = fallbackAssetFor(sale.categoryId);
                }}
              />
              <div>
                <small>
                  {[
                    sale.transactionId ===
                    summary.firstProfitableSale?.transactionId
                      ? copy.first
                      : undefined,
                    sale.transactionId === summary.bestSale?.transactionId
                      ? copy.best
                      : undefined,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </small>
                <b>
                  {localizeProduct(
                    sale.familyId,
                    familyById(sale.familyId)?.name ?? sale.categoryId,
                    lang,
                  )}
                </b>
                <strong>{money(sale.profitMinor, lang)}</strong>
              </div>
            </article>
          ) : null,
        )}
      </div>
      <button ref={buttonRef} onClick={onClose}>
        {t("finale.continue")}
      </button>
      <div className="home-share-controls">
        <label>
          <input
            type="checkbox"
            checked={includeName}
            disabled={sharing}
            onChange={(event) => {
              setIncludeName(event.target.checked);
              setCard(null);
            }}
          />
          {lang === "tr" ? "İsmimi göster" : "Include my name"}
        </label>
        <button
          className="secondary"
          disabled={sharing}
          onClick={() => void preview()}
        >
          {sharing
            ? lang === "tr"
              ? "Hazırlanıyor…"
              : "Preparing…"
            : lang === "tr"
              ? "Başarı kartımı hazırla"
              : "Preview my achievement card"}
        </button>
        {card ? (
          <>
            <img
              className="home-share-preview"
              src={card.url}
              alt={
                lang === "tr"
                  ? "Paylaşılacak ilk ev başarı kartı"
                  : "First-home achievement card preview"
              }
            />
            <button
              disabled={sharing}
              onClick={async () => {
                if (shareLock.current) return;
                shareLock.current = true;
                setSharing(true);
                try {
                  const result = await shareHomeCard(card.blob);
                  if (mounted.current)
                    setShareMessage(
                      result === "DOWNLOAD"
                        ? lang === "tr"
                          ? "Aşağıdaki bağlantıdan görseli indirebilirsin."
                          : "Download the image using the link below."
                        : "",
                    );
                } catch {
                  if (mounted.current)
                    setShareMessage(
                      lang === "tr"
                        ? "Paylaşım açılamadı; görseli indirebilirsin."
                        : "Sharing unavailable; you can download the image.",
                    );
                } finally {
                  shareLock.current = false;
                  if (mounted.current) setSharing(false);
                }
              }}
            >
              {lang === "tr" ? "Kartımı paylaş" : "Share my card"}
            </button>
            <a href={card.url} download="tradeup-ilk-evim.png">
              {lang === "tr" ? "Görseli indir" : "Download image"}
            </a>
          </>
        ) : null}
        <p role="status">{shareMessage}</p>
      </div>
    </section>
  );
}
