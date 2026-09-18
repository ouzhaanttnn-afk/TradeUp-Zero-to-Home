import { useRef } from "react";
import type { GameState, MonetizationProductId } from "../domain/models";
import type { StoreProductMetadata } from "../infrastructure/monetization";
import { Icon } from "./Icon";
import { useModalFocus } from "./useModalFocus";

const storeCopy: Record<
  MonetizationProductId,
  { title: string; detail: string }
> = {
  tradeup_premium_lifetime: {
    title: "TradeUp Premium",
    detail: "Uygun hızlandırmaları video izlemeden kullan; limitler değişmez.",
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
            aria-label="Kapat"
          >
            <Icon name="close" />
          </button>
          <div className="settings-sheet-heading">
            <div>
              <small>MAĞAZA</small>
              <h2 id="purchases-sheet-title">Satın Almalar &amp; Görünüm</h2>
            </div>
          </div>
          <section
            className="purchase-panel"
            aria-label="Satın Almalar ve Görünüm"
          >
            <div className="purchase-panel-heading">
              <div>
                <strong>Kalıcı paketler</strong>
                <p>Oynanış ekonomisini değiştirmez.</p>
              </div>
              <span>{storeProducts.length ? "Mağaza hazır" : "Yakında"}</span>
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
                  return (
                    <article key={productId}>
                      <div>
                        <strong>{storeCopy[productId].title}</strong>
                        <p>{storeCopy[productId].detail}</p>
                      </div>
                      {owned || pending ? (
                        <span className="entitlement-state">
                          {owned ? "Sahipsin" : "Ödeme beklemede"}
                        </span>
                      ) : metadata ? (
                        <button
                          disabled={monetizationBusy}
                          onClick={() => void purchaseProduct(productId)}
                        >
                          Satın al · {metadata.localizedPrice}
                        </button>
                      ) : (
                        <span className="store-unavailable">Yakında</span>
                      )}
                    </article>
                  );
                },
              )}
            </div>
            <p className="purchase-note">
              Paketler mobil mağaza bağlantısı tamamlandığında açılır. O zamana
              kadar oynanışın ve ilerlemen değişmez.
            </p>
            <div className="purchase-footer-actions">
              <button
                className="secondary"
                disabled={monetizationBusy || !storeProducts.length}
                onClick={() => void restorePurchases()}
              >
                Satın alımları geri yükle
              </button>
              <button
                className="text-button"
                onClick={() => void showPrivacyOptions()}
              >
                Gizlilik
              </button>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
