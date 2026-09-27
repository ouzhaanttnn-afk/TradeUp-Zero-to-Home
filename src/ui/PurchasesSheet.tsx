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
  const mainPacks = availablePacks.filter(
    (entry) =>
      entry.productId === "tradeup_premium_lifetime" ||
      entry.productId === "tradeup_no_ads_lifetime",
  );
  const cosmeticPacks = availablePacks.filter(
    (entry) =>
      entry.productId !== "tradeup_premium_lifetime" &&
      entry.productId !== "tradeup_no_ads_lifetime",
  );
  const renderAvailablePack = (entry: (typeof entries)[number]) => (
    <article
      key={entry.productId}
      className={
        entry.productId === "tradeup_premium_lifetime"
          ? "purchase-item purchase-item--premium"
          : "purchase-item"
      }
    >
      <div>
        <strong>{entry.copy.title || entry.metadata?.title}</strong>
        <p>{entry.copy.detail}</p>
      </div>
      {entry.pending ? (
        <span className="entitlement-state purchase-item-status">
          {t("store.pending")}
        </span>
      ) : entry.metadata ? (
        <button
          disabled={monetizationBusy}
          onClick={() => void purchaseProduct(entry.productId)}
        >
          {t("store.buy", { price: entry.metadata.localizedPrice })}
        </button>
      ) : (
        <span className="store-unavailable">{t("store.comingSoon")}</span>
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
          <section className="purchase-panel" aria-label={t("store.title")}>
            <div className="purchase-panel-heading">
              <div>
                <strong>{t("store.permanentPacks")}</strong>
                <p>{t("store.permanentSub")}</p>
              </div>
              <span>
                {storeProducts.length
                  ? t("store.ready")
                  : t("store.comingSoon")}
              </span>
            </div>
            {openPacks.length > 0 ? (
              <details className="owned-purchases">
                <summary>
                  <span>{t("store.openPacks")}</span>
                  <b>{openPacks.length}</b>
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
            ) : null}
            {mainPacks.length > 0 ? (
              <div className="purchase-list">
                {mainPacks.map(renderAvailablePack)}
              </div>
            ) : null}
            {cosmeticPacks.length > 0 ? (
              <details className="extra-purchases">
                <summary>
                  <span>{t("store.cosmeticPacks")}</span>
                  <b>{cosmeticPacks.length}</b>
                </summary>
                <div className="purchase-list">
                  {cosmeticPacks.map(renderAvailablePack)}
                </div>
              </details>
            ) : null}
            <p className="purchase-note">{t("store.note")}</p>
            <div className="purchase-footer-actions">
              <button
                className="secondary"
                disabled={monetizationBusy || Capacitor.getPlatform() !== "ios"}
                onClick={() => void restorePurchases()}
              >
                {t("store.restore")}
              </button>
              <button
                className="text-button"
                onClick={() => void showPrivacyOptions()}
              >
                {t("store.privacy")}
              </button>
            </div>
          </section>
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
        </div>
      </section>
    </div>
  );
}
