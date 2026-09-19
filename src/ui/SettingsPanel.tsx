import { useRef, useState } from "react";
import { avatars } from "../content/avatars";
import { nextLadderHome } from "../content/homes";
import { marketExpertiseLevel } from "../domain/meta";
import { ownsAnimatedAvatars } from "../domain/profile";
import type { AccessibilityPreferences } from "../domain/models";
import { HOME_GOAL_MINOR, wealth } from "../game";
import { useGameStore } from "../stores/gameStore";
import { AvatarPortrait } from "./AvatarPortrait";
import { Icon } from "./Icon";
import PurchasesSheet from "./PurchasesSheet";
import { useModalFocus } from "./useModalFocus";

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
  const panelRef = useRef<HTMLElement>(null);

  useModalFocus(true, panelRef, closeRef, onClose);

  const marketLevel = marketExpertiseLevel(game);
  const settingsLadderTarget = nextLadderHome(game.home);
  const homeProgress = !game.home.purchased
    ? Math.min(100, Math.floor((wealth(game) / HOME_GOAL_MINOR) * 100))
    : settingsLadderTarget
      ? Math.min(
          100,
          Math.floor((wealth(game) / settingsLadderTarget.priceMinor) * 100),
        )
      : 100;
  const animatedAvatarsOwned = ownsAnimatedAvatars(game);
  const completedSales = game.transactionJournal.filter(
    (entry) => entry.kind === "SALE",
  ).length;

  return (
    <section
      ref={panelRef}
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
      <div className="settings-identity-group">
        <small className="settings-group-label">OYUNCU KİMLİĞİ</small>
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
      </div>
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
        onClick={() => {
          setPurchasesOpen(true);
          void openPurchases();
        }}
      >
        <span className="settings-link-icon" aria-hidden="true">
          <Icon name="store" />
        </span>
        <span>
          <b>Satın almalar &amp; görünüm</b>
          <small>Kalıcı paketler ve geri yükleme</small>
        </span>
        <i aria-hidden="true">→</i>
      </button>
      {purchasesOpen ? (
        <PurchasesSheet
          game={game}
          storeProducts={storeProducts}
          monetizationBusy={monetizationBusy}
          purchaseProduct={purchaseProduct}
          restorePurchases={restorePurchases}
          showPrivacyOptions={showPrivacyOptions}
          onClose={() => setPurchasesOpen(false)}
        />
      ) : null}
      <section className="settings-section" aria-label="Yardım ve belgeler">
        <div className="settings-section-heading">
          <div>
            <h3>Yardım ve belgeler</h3>
            <p>Destek ve açık kullanım bilgileri</p>
          </div>
        </div>
        <div className="settings-document-links">
          <a href="/support.html">
            Destek <span aria-hidden="true">↗</span>
          </a>
          <a href="/privacy.html">
            Gizlilik <span aria-hidden="true">↗</span>
          </a>
          <a href="/terms.html">
            Kullanım koşulları <span aria-hidden="true">↗</span>
          </a>
        </div>
      </section>
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
