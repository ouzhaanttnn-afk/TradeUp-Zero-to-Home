import { useRef } from "react";
import { Capacitor } from "@capacitor/core";
import type { GameState, MonetizationProductId } from "../domain/models";
import type { StoreProductMetadata } from "../infrastructure/monetization";
import { Icon } from "./Icon";
import { useModalFocus } from "./useModalFocus";
import { useTranslation, localizeStoreProduct } from "../i18n";
import { useGameStore } from "../stores/gameStore";
import {
  canUseHomeInteriorStyle,
  canUseShellTheme,
  type HomeInteriorStyle,
  type ShellTheme,
} from "../domain/appearance";
import { hasPremiumEntitlement } from "../domain/monetization";
import { getMonetizationAdapters } from "../services/monetization";

const themeChoices: {
  id: ShellTheme;
  label: string;
  productId?: MonetizationProductId;
}[] = [
  { id: "classic", label: "Klasik" },
  { id: "obsidian", label: "Obsidyen", productId: "tradeup_premium_lifetime" },
  {
    id: "night-market",
    label: "Gece Pazarı",
    productId: "tradeup_theme_night_market",
  },
  { id: "workshop", label: "Atölye", productId: "tradeup_theme_workshop" },
];

const homeStyleChoices: { id: HomeInteriorStyle; label: string }[] = [
  { id: "classic", label: "Klasik" },
  { id: "modern", label: "Modern" },
  { id: "heritage", label: "Miras" },
  { id: "coastal", label: "Sahil" },
];

const storeCopy: Record<
  MonetizationProductId,
  { title: string; detail: string }
> = {
  tradeup_premium_lifetime: {
    title: "TradeUp Premium",
    detail:
      "Reklamsız oyna; tüm temalar, ev stilleri ve canlı avatarlar da açık. Hak sınırları değişmez.",
  },
  tradeup_no_ads_lifetime: {
    title: "Reklamsız",
    detail:
      "Videoları ve 30 ticaret reklamını atla; kozmetik içermez. Hak sınırları değişmez.",
  },
  tradeup_theme_night_market: {
    title: "Gece Pazarı teması",
    detail: "Yalnız arayüz görünümünü kişiselleştirir.",
  },
  tradeup_theme_workshop: {
    title: "Endüstriyel Atölye teması",
    detail: "Yalnız arayüz görünümünü kişiselleştirir.",
  },
  tradeup_home_styles_01: {
    title: "Ev stilleri paketi",
    detail: "Ev finali için üç görsel stil; ilerlemeye para eklemez.",
  },
  tradeup_animated_avatars_01: {
    title: "Canlı avatar koleksiyonu",
    detail: "Üç hareketli profil görünümü; yalnız kozmetiktir.",
  },
};

export default function PurchasesSheet({
  game,
  storeProducts,
  monetizationBusy,
  purchaseProduct,
  restorePurchases,
  showPrivacyOptions,
  onClose,
}: {
  game: GameState;
  storeProducts: readonly StoreProductMetadata[];
  monetizationBusy: boolean;
  purchaseProduct: (productId: MonetizationProductId) => Promise<void>;
  restorePurchases: () => Promise<void>;
  showPrivacyOptions: () => Promise<void>;
  onClose: () => void;
}) {
  const { t, lang } = useTranslation();
  const closeRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLElement>(null);
  const { appearance, setShellTheme, setHomeInteriorStyle } = useGameStore();
  const premiumOwned = hasPremiumEntitlement(game);
  const entries = (Object.keys(storeCopy) as MonetizationProductId[]).map(
    (productId) => {
      const metadata = storeProducts.find(
        (product) => product.productId === productId,
      );
      const entitlement = game.monetization.entitlements.find(
        (entry) => entry.productId === productId,
      );
      const owned = entitlement?.status === "OWNED";
      return {
        productId,
        metadata,
        owned,
        pending: entitlement?.status === "PENDING",
        includedWithPremium:
          premiumOwned &&
          productId !== "tradeup_premium_lifetime" &&
          !owned &&
          entitlement?.status !== "PENDING",
        copy: localizeStoreProduct(
          productId,
          storeCopy[productId].title,
          storeCopy[productId].detail,
          lang,
        ),
      };
    },
  );
  const openPacks = entries.filter(
    (entry) => entry.owned || entry.includedWithPremium,
  );
  const availablePacks = entries.filter(
    (entry) => !entry.owned && !entry.includedWithPremium,
  );
  const mainPackIds: MonetizationProductId[] = [
    "tradeup_no_ads_lifetime",
    "tradeup_premium_lifetime",
  ];
  const mainPacks = mainPackIds.flatMap((id) =>
    availablePacks.filter((entry) => entry.productId === id),
  );
  const cosmeticPacks = availablePacks.filter(
    (entry) => !mainPackIds.includes(entry.productId),
  );
  const noAdsOwned = entries.some(
    (entry) => entry.productId === "tradeup_no_ads_lifetime" && entry.owned,
  );
  const activePackLabel = premiumOwned
    ? t("store.premiumActive")
    : noAdsOwned
      ? t("store.noAdsActive")
      : t("store.packsActive");
  const renderAvailablePack = (entry: (typeof entries)[number], main = false) => (
    <article
      key={entry.productId}
      data-product-id={entry.productId}
      className={
        entry.productId === "tradeup_premium_lifetime"
          ? "purchase-item purchase-item--premium"
          : "purchase-item"
      }
    >
      <div className="purchase-item__copy">
        {main ? (
          <small className="purchase-item__eyebrow">
            {entry.productId === "tradeup_premium_lifetime"
              ? t("store.allIncluded")
              : t("store.adsOnly")}
          </small>
        ) : null}
        <strong>{entry.copy.title || entry.metadata?.title}</strong>
        <p>{main
          ? t(entry.productId === "tradeup_premium_lifetime" ? "store.premiumSummary" : "store.noAdsSummary")
          : entry.copy.detail}</p>
      </div>
      {entry.pending ? (
        <span className="entitlement-state purchase-item-status">
          {t("store.pending")}
        </span>
      ) : entry.metadata?.available && entry.metadata.localizedPrice ? (
        <button
          disabled={monetizationBusy}
          aria-label={`${entry.copy.title} · ${t("store.buy", { price: entry.metadata.localizedPrice })}`}
          onClick={() => void purchaseProduct(entry.productId)}
        >
          {t("store.buy", { price: entry.metadata.localizedPrice })}
        </button>
      ) : (
        <span className="store-unavailable">{t("store.unavailable")}</span>
      )}
    </article>
  );

  useModalFocus(true, sheetRef, closeRef, onClose);

  return (
    <div className="scrim" onClick={onClose}>
      <section
        ref={sheetRef}
        className="sheet purchases-sheet"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="purchases-sheet-title"
      >
        <div className="sheet-scroll">
          <div className="grab" aria-hidden="true" />
          <button
            ref={closeRef}
            className="close"
            onClick={onClose}
            aria-label={t("sheet.close")}
          >
            <Icon name="close" />
          </button>
          <div className="settings-sheet-heading">
            <div>
              <small>{t("store.badge")}</small>
              <h2 id="purchases-sheet-title">{t("store.title")}</h2>
            </div>
          </div>
          {openPacks.length > 0 ? (
            <section className="purchase-status" aria-label={t("store.openPacks")}>
              <div className="purchase-status__headline">
                <span className="purchase-status__mark" aria-hidden="true">✓</span>
                <div>
                  <small>{t("store.permanentPacks")}</small>
                  <strong>{activePackLabel}</strong>
                </div>
                <span className="purchase-status__count">{openPacks.length}/{entries.length}</span>
              </div>
              <details className="owned-purchases">
                <summary>
                  <span>{t("store.openPacks")}</span>
                </summary>
                <div className="owned-purchases__list">
                  {openPacks.map((entry) => (
                    <div
                      key={entry.productId}
                      className="owned-purchases__item"
                    >
                      <strong>{entry.copy.title}</strong>
                      <small>
                        {entry.owned
                          ? t("store.owned")
                          : t("store.includedWithPremium")}
                      </small>
                    </div>
                  ))}
                </div>
              </details>
            </section>
          ) : null}
          {availablePacks.length > 0 ? (
            <section className="purchase-panel" aria-label={t("store.permanentPacks")}>
              <div className="purchase-panel-heading">
                <div>
                  <strong>{t("store.permanentPacks")}</strong>
                  <p>{t("store.oneTime")}</p>
                </div>
              </div>
              {mainPacks.length > 0 ? (
                <div className="purchase-list purchase-list--main">
                  {mainPacks.map((entry) => renderAvailablePack(entry, true))}
                </div>
              ) : null}
              {cosmeticPacks.length > 0 ? (
                <details className="extra-purchases">
                  <summary>
                    <span>
                      <strong>{t("store.cosmeticPacks")}</strong>
                      <small>{t("store.cosmeticSub")}</small>
                    </span>
                  </summary>
                  <div className="purchase-list">
                    {cosmeticPacks.map((entry) => renderAvailablePack(entry))}
                  </div>
                </details>
              ) : null}
            </section>
          ) : null}
          <section
            className="appearance-panel"
            aria-label={t("store.appearance")}
          >
            <h3>{t("store.appearance")}</h3>
            <div className="cosmetic-picker" aria-label="Arayüz teması">
              <strong>Arayüz teması</strong>
              <div className="cosmetic-picker__choices">
                {themeChoices.map((choice) => {
                  const unlocked = canUseShellTheme(
                    choice.id,
                    game.monetization.entitlements,
                  );
                  return (
                    <button
                      key={choice.id}
                      className={
                        appearance.shellTheme === choice.id
                          ? "selected"
                          : "secondary"
                      }
                      style={{
                        minHeight: 44,
                        color:
                          appearance.shellTheme === choice.id
                            ? "var(--accent)"
                            : undefined,
                      }}
                      disabled={!unlocked}
                      aria-pressed={appearance.shellTheme === choice.id}
                      onClick={() => setShellTheme(choice.id)}
                    >
                      {choice.label}
                      {unlocked ? "" : " · Kilitli"}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="cosmetic-picker" aria-label="Ev iç mekân stili">
              <strong>Ev iç mekân stili</strong>
              <div className="cosmetic-picker__choices">
                {homeStyleChoices.map((choice) => {
                  const unlocked = canUseHomeInteriorStyle(
                    choice.id,
                    game.monetization.entitlements,
                  );
                  return (
                    <button
                      key={choice.id}
                      className={
                        appearance.homeInteriorStyle === choice.id
                          ? "selected"
                          : "secondary"
                      }
                      style={{
                        minHeight: 44,
                        color:
                          appearance.homeInteriorStyle === choice.id
                            ? "var(--accent)"
                            : undefined,
                      }}
                      disabled={
                        !unlocked ||
                        (choice.id !== "classic" && !game.home.purchased)
                      }
                      aria-pressed={appearance.homeInteriorStyle === choice.id}
                      onClick={() => setHomeInteriorStyle(choice.id)}
                    >
                      {choice.label}
                      {unlocked ? "" : " · Kilitli"}
                    </button>
                  );
                })}
              </div>
              {!game.home.purchased ? (
                <small>Ek stiller, ilk ev satın alındığında seçilebilir.</small>
              ) : null}
            </div>
          </section>
          <div className="purchase-utilities">
            <p>{t("store.shortNote")}</p>
            <div>
              <button
                className="text-button"
                disabled={monetizationBusy || Capacitor.getPlatform() !== "ios"}
                onClick={() => void restorePurchases()}
              >
                {t("store.restore")}
              </button>
              {getMonetizationAdapters().consent.available !== false ? (
                <button className="text-button" onClick={() => void showPrivacyOptions()}>
                  {t("store.privacy")}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
