import { useRef } from "react";
import { Capacitor } from "@capacitor/core";
import type { GameState, MonetizationProductId } from "../domain/models";
import type { StoreProductMetadata } from "../infrastructure/monetization";
import { Icon } from "./Icon";
import { useModalFocus } from "./useModalFocus";
import { useTranslation, localizeStoreProduct } from "../i18n";

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
  const { t } = useTranslation();
  const closeRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLElement>(null);

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
                  );
                  return (
                    <article key={productId}>
                      <div>
                        <strong>
                          {metadata?.title || localizedCopy.title}
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
