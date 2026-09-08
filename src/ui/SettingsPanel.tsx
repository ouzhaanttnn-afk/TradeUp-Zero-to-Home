import { useEffect, useRef, useState } from "react";
import { avatars } from "../content/avatars";
import { marketExpertiseLevel } from "../domain/meta";
import { ownsAnimatedAvatars } from "../domain/profile";
import type {
  AccessibilityPreferences,
  MonetizationProductId,
} from "../domain/models";
import { HOME_GOAL_MINOR, wealth } from "../game";
import { useGameStore } from "../stores/gameStore";
import { AvatarPortrait } from "./AvatarPortrait";
import { Icon } from "./Icon";

type SoundLevel = AccessibilityPreferences["soundLevel"];

const soundLevelLabel: Record<SoundLevel, string> = {
  OFF: "Kapalı",
  LOW: "Düşük",
  NORMAL: "Normal",
};

const nextSoundLevel: Record<SoundLevel, SoundLevel> = {
  OFF: "LOW",
  LOW: "NORMAL",
  NORMAL: "OFF",
};

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

export default function SettingsPanel({ onClose }: { onClose: () => void }) {
  const {
    game,
    storeProducts,
    monetizationBusy,
    setAnalytics,
    setHaptics,
    setReducedMotion,
    setLargeText,
    setSoundLevel,
    setProfileName,
    setProfileAvatar,
    openPurchases,
    purchaseProduct,
    restorePurchases,
    showPrivacyOptions,
    reset,
  } = useGameStore();
  const [profileDraft, setProfileDraft] = useState(game.profile.displayName);
  const [purchasesOpen, setPurchasesOpen] = useState(false);
  const [resetArmed, setResetArmed] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const frame = requestAnimationFrame(() => closeRef.current?.focus());
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", closeOnEscape);
      previousFocus?.focus();
    };
  }, [onClose]);

  const marketLevel = marketExpertiseLevel(game);
  const homeProgress = game.home.purchased
    ? 100
    : Math.min(100, Math.floor((wealth(game) / HOME_GOAL_MINOR) * 100));
  const animatedAvatarsOwned = ownsAnimatedAvatars(game);
  const completedSales = game.transactionJournal.filter(
    (entry) => entry.kind === "SALE",
  ).length;

  return (
    <section
      className="settings-card"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div className="settings-sheet-heading">
        <div>
          <small>HESABIM</small>
          <h2 id="settings-title">Profil ve Ayarlar</h2>
        </div>
        <button
          ref={closeRef}
          className="icon-button"
          aria-label="Ayarları kapat"
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
      </div>
      <form
        className="profile-card"
        onSubmit={(event) => {
          event.preventDefault();
          setProfileName(profileDraft);
          setProfileDraft(
            profileDraft.trim().replace(/\s+/g, " ").slice(0, 20),
          );
        }}
      >
        <AvatarPortrait
          avatarId={game.profile.avatarId}
          className="profile-avatar"
        />
        <div className="profile-identity">
          <span className="profile-kicker">Pazar seviyesi {marketLevel}</span>
          <label>
            <span>Oyuncu adı</span>
            <input
              value={profileDraft}
              maxLength={20}
              autoComplete="nickname"
              onChange={(event) => setProfileDraft(event.target.value)}
            />
          </label>
        </div>
        <button
          className="primary"
          disabled={
            !profileDraft.trim() ||
            profileDraft.trim().replace(/\s+/g, " ") ===
              game.profile.displayName
          }
          type="submit"
        >
          Kaydet
        </button>
        <div className="profile-stats" role="group" aria-label="Profil özeti">
          <span>
            <small>Pazar seviyesi</small>
            <b>{marketLevel}</b>
          </span>
          <span>
            <small>Satış</small>
            <b>{completedSales}</b>
          </span>
          <span>
            <small>Ev hedefi</small>
            <b>%{homeProgress}</b>
          </span>
        </div>
      </form>
      <fieldset className="avatar-picker avatar-picker--settings">
        <legend>Profil avatarı</legend>
        <div className="avatar-options">
          {avatars.map((avatar) => {
            const locked = avatar.premium && !animatedAvatarsOwned;
            return (
              <button
                key={avatar.id}
                type="button"
                disabled={locked}
                aria-pressed={game.profile.avatarId === avatar.id}
                aria-label={`${avatar.name}${locked ? ", canlı avatar paketi gerekli" : ""}`}
                onClick={() => setProfileAvatar(avatar.id)}
              >
                <AvatarPortrait avatarId={avatar.id} />
                <span>
                  <b>{avatar.name}</b>
                  <small>{locked ? "Canlı · Yakında" : avatar.role}</small>
                </span>
                {locked ? <i aria-hidden="true">◇</i> : null}
              </button>
            );
          })}
        </div>
      </fieldset>
      <section
        className="settings-section"
        aria-labelledby="experience-settings-title"
      >
        <div className="settings-section-heading">
          <span className="settings-heading-icon" aria-hidden="true">
            <Icon name="settings" />
          </span>
          <div>
            <h3 id="experience-settings-title">Oyun deneyimi</h3>
            <p>Sana uygun oyun hissi</p>
          </div>
        </div>
        <div className="settings-row">
          <span className="settings-row-icon" aria-hidden="true">
            <Icon name="haptics" />
          </span>
          <span className="settings-row-copy">
            <b>Dokunsal geri bildirim</b>
            <small>Önemli kararlarda titreşim</small>
          </span>
          <button
            className="settings-switch"
            aria-pressed={game.accessibility.hapticsEnabled}
            aria-label={`Dokunsal tepki: ${game.accessibility.hapticsEnabled ? "Açık" : "Kapalı"}`}
            onClick={() => setHaptics(!game.accessibility.hapticsEnabled)}
          >
            <span aria-hidden="true" />
          </button>
        </div>
        <div className="settings-row">
          <span className="settings-row-icon" aria-hidden="true">
            <Icon name="motion" />
          </span>
          <span className="settings-row-copy">
            <b>Azaltılmış hareket</b>
            <small>Geçişleri ve parlamaları sakinleştirir</small>
          </span>
          <button
            className="settings-switch"
            aria-pressed={game.accessibility.reducedMotion}
            aria-label={`Azaltılmış hareket: ${game.accessibility.reducedMotion ? "Açık" : "Kapalı"}`}
            onClick={() => setReducedMotion(!game.accessibility.reducedMotion)}
          >
            <span aria-hidden="true" />
          </button>
        </div>
        <div className="settings-row">
          <span className="settings-row-icon" aria-hidden="true">
            <Icon name="text" />
          </span>
          <span className="settings-row-copy">
            <b>Metin boyutu</b>
            <small>Okuma rahatlığı</small>
          </span>
          <button
            className="settings-value"
            aria-pressed={game.accessibility.largeText}
            onClick={() => setLargeText(!game.accessibility.largeText)}
          >
            {game.accessibility.largeText ? "Büyük" : "Standart"}
          </button>
        </div>
        <div className="settings-row">
          <span className="settings-row-icon" aria-hidden="true">
            <Icon name="sound" />
          </span>
          <span className="settings-row-copy">
            <b>Ses seviyesi</b>
            <small>Efektlerin yüksekliği</small>
          </span>
          <button
            className="settings-value"
            aria-label={`Ses seviyesi: ${soundLevelLabel[game.accessibility.soundLevel]}. Değiştir`}
            onClick={() =>
              setSoundLevel(nextSoundLevel[game.accessibility.soundLevel])
            }
          >
            {soundLevelLabel[game.accessibility.soundLevel]}
          </button>
        </div>
        <div className="settings-row">
          <span className="settings-row-icon" aria-hidden="true">
            <Icon name="analytics" />
          </span>
          <span className="settings-row-copy">
            <b>İsteğe bağlı analitik</b>
            <small>Kişisel bilgi içermez</small>
          </span>
          <button
            className="settings-switch"
            aria-pressed={game.analytics.enabled}
            aria-label={`İsteğe bağlı analitik: ${game.analytics.enabled ? "Açık" : "Kapalı"}`}
            onClick={() => setAnalytics(!game.analytics.enabled)}
          >
            <span aria-hidden="true" />
          </button>
        </div>
      </section>
      <button
        className="settings-link-card"
        aria-label="Satın Almalar ve Görünüm"
        aria-expanded={purchasesOpen}
        onClick={() => {
          const next = !purchasesOpen;
          setPurchasesOpen(next);
          if (next) void openPurchases();
        }}
      >
        <span className="settings-link-icon" aria-hidden="true">
          <Icon name="store" />
        </span>
        <span>
          <b>Satın almalar &amp; görünüm</b>
          <small>Kalıcı paketler ve geri yükleme</small>
        </span>
        <i aria-hidden="true">{purchasesOpen ? "−" : "+"}</i>
      </button>
      {purchasesOpen ? (
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
      ) : null}
      <section className="settings-danger-zone" aria-label="Kayıt yönetimi">
        <div>
          <b>Kayıt yönetimi</b>
          <small>Bu işlem geri alınamaz.</small>
        </div>
        <button
          className={resetArmed ? "danger-confirm" : "text-button"}
          onClick={() => {
            if (resetArmed) {
              setResetArmed(false);
              onClose();
              void reset();
            } else setResetArmed(true);
          }}
        >
          {resetArmed ? "Kalıcı olarak sıfırla" : "Kariyeri sıfırla"}
        </button>
        {resetArmed ? (
          <button className="text-button" onClick={() => setResetArmed(false)}>
            Vazgeç
          </button>
        ) : null}
      </section>
    </section>
  );
}
