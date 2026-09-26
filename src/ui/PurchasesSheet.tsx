import { useRef } from "react";
import { Capacitor } from "@capacitor/core";
import type { GameState, MonetizationProductId } from "../domain/models";
import type { StoreProductMetadata } from "../infrastructure/monetization";
import { Icon } from "./Icon";
import { useModalFocus } from "./useModalFocus";
import { useTranslation, localizeStoreProduct } from "../i18n";
import { useGameStore } from "../stores/gameStore";
import type { HomeInteriorStyle, ShellTheme } from "../domain/appearance";

const themeChoices: { id: ShellTheme; label: string; productId?: MonetizationProductId }[] = [
  { id: "classic", label: "Klasik" },
  { id: "obsidian", label: "Obsidyen", productId: "tradeup_premium_lifetime" },
  { id: "night-market", label: "Gece Pazarı", productId: "tradeup_theme_night_market" },
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
      "Hızlandırmaları video izlemeden kullan; 30 ticaret reklamını atla. Hak sınırları değişmez.",
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
          <section
            className="purchase-panel"
            aria-label={t("store.title")}
          >
            <div className="purchase-panel-heading">
              <div>
                <strong>{t("store.permanentPacks")}</strong>
                <p>{t("store.permanentSub")}</p>
              </div>
              <span>{storeProducts.length ? t("store.ready") : t("store.comingSoon")}</span>
            </div>
            <div className="purchase-list">
              {(Object.keys(storeCopy) as MonetizationProductId[]).map(
                (productId) => {
                  const metadata = storeProducts.find(
                    (product) => product.productId === productId,
                  );
                  const entitlement = game.monetization.entitlements.find(
                    (entry) => entry.productId === productId,
                  );
                  const owned = entitlement?.status === "OWNED";
                  const pending = entitlement?.status === "PENDING";
                  const localizedCopy = localizeStoreProduct(
                    productId,
                    storeCopy[productId].title,
                    storeCopy[productId].detail,
                    lang,
                  );
                  return (
                    <article key={productId}>
                      <div>
                        <strong>
                          {localizedCopy.title || metadata?.title}
                        </strong>
                        <p>{localizedCopy.detail}</p>
                      </div>
                      {owned || pending ? (
                        <span className="entitlement-state">
                          {owned ? t("store.owned") : t("store.pending")}
                        </span>
                      ) : metadata ? (
                        <button
                          disabled={monetizationBusy}
                          onClick={() => void purchaseProduct(productId)}
                        >
                          {t("store.buy", { price: metadata.localizedPrice })}
                        </button>
                      ) : (
                        <span className="store-unavailable">{t("store.comingSoon")}</span>
                      )}
                    </article>
                  );
                },
              )}
            </div>
            <div className="cosmetic-picker" aria-label="Arayüz teması" style={{ display: "grid", gap: 8, marginTop: 8 }}>
              <strong>Arayüz teması</strong>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {themeChoices.map((choice) => {
                  const unlocked = !choice.productId || game.monetization.entitlements.some(
                    (entry) => entry.productId === choice.productId && entry.status === "OWNED",
                  );
                  return (
                    <button
                      key={choice.id}
                      className={appearance.shellTheme === choice.id ? "selected" : "secondary"}
                      style={{ minHeight: 40, color: appearance.shellTheme === choice.id ? "var(--accent)" : undefined }}
                      disabled={!unlocked}
                      aria-pressed={appearance.shellTheme === choice.id}
                      onClick={() => setShellTheme(choice.id)}
                    >
                      {choice.label}{unlocked ? "" : " · Kilitli"}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="cosmetic-picker" aria-label="Ev iç mekân stili" style={{ display: "grid", gap: 8, marginTop: 8 }}>
              <strong>Ev iç mekân stili</strong>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {homeStyleChoices.map((choice) => {
                  const unlocked = choice.id === "classic" || game.monetization.entitlements.some(
                    (entry) => entry.entitlementId === "home_styles_01" && entry.status === "OWNED",
                  );
                  return (
                    <button
                      key={choice.id}
                      className={appearance.homeInteriorStyle === choice.id ? "selected" : "secondary"}
                      style={{ minHeight: 40, color: appearance.homeInteriorStyle === choice.id ? "var(--accent)" : undefined }}
                      disabled={!unlocked || (choice.id !== "classic" && !game.home.purchased)}
                      aria-pressed={appearance.homeInteriorStyle === choice.id}
                      onClick={() => setHomeInteriorStyle(choice.id)}
                    >
                      {choice.label}{unlocked ? "" : " · Kilitli"}
                    </button>
                  );
                })}
              </div>
              {!game.home.purchased ? <small>Ek stiller, ilk ev satın alındığında seçilebilir.</small> : null}
            </div>
            <p className="purchase-note">
              {t("store.note")}
            </p>
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
        </div>
      </section>
    </div>
  );
}
