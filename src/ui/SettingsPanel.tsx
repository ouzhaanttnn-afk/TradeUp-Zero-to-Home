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
import { useTranslation, localizeAvatar } from "../i18n";

type SoundLevel = AccessibilityPreferences["soundLevel"];

const nextSoundLevel: Record<SoundLevel, SoundLevel> = {
  OFF: "LOW",
  LOW: "NORMAL",
  NORMAL: "OFF",
};

export default function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { t, lang, setLanguage, supportedLanguages } = useTranslation();
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

  const currentSoundLabel =
    game.accessibility.soundLevel === "OFF"
      ? t("settings.soundMute")
      : game.accessibility.soundLevel === "LOW"
        ? t("settings.soundLow")
        : t("settings.soundStandard");

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
          <small>{t("settings.heading")}</small>
          <h2 id="settings-title">{t("settings.title")}</h2>
        </div>
        <button
          ref={closeRef}
          className="icon-button"
          aria-label={t("settings.close")}
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
      </div>
      <div className="settings-identity-group">
        <small className="settings-group-label">{t("settings.identity")}</small>
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
            <span className="profile-kicker">{t("settings.level")} {marketLevel}</span>
            <label>
              <span>{t("settings.playerName")}</span>
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
            {t("settings.save")}
          </button>
          <div className="profile-stats" role="group" aria-label="Profil özeti">
            <span>
              <small>{t("settings.level")}</small>
              <b>{marketLevel}</b>
            </span>
            <span>
              <small>{t("settings.sales")}</small>
              <b>{completedSales}</b>
            </span>
            <span>
              <small>{t("settings.homeGoal")}</small>
              <b>%{homeProgress}</b>
            </span>
          </div>
        </form>
        <fieldset className="avatar-picker avatar-picker--settings">
          <legend>{t("settings.avatars")}</legend>
          <div className="avatar-options">
            {avatars.map((avatar) => {
              const locked = avatar.premium && !animatedAvatarsOwned;
              const localized = localizeAvatar(
                avatar.id,
                avatar.name,
                avatar.role,
                lang,
              );
              return (
                <button
                  key={avatar.id}
                  type="button"
                  disabled={locked}
                  aria-pressed={game.profile.avatarId === avatar.id}
                  aria-label={`${localized.name}${locked ? ", " + (t("onboarding.comingSoon") || "canlı avatar paketi gerekli") : ""}`}
                  onClick={() => setProfileAvatar(avatar.id)}
                >
                  <AvatarPortrait avatarId={avatar.id} />
                  <span>
                    <b>{localized.name}</b>
                    <small>{locked ? (t("onboarding.comingSoon") || "Canlı · Yakında") : localized.role}</small>
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
            <h3 id="experience-settings-title">{t("settings.experience")}</h3>
            <p>{t("settings.experienceSub")}</p>
          </div>
        </div>
        <div className="settings-row">
          <span className="settings-row-icon" aria-hidden="true">
            <Icon name="haptics" />
          </span>
          <span className="settings-row-copy">
            <b>{t("settings.haptics")}</b>
            <small>{t("settings.hapticsSub")}</small>
          </span>
          <button
            className="settings-switch"
            aria-pressed={game.accessibility.hapticsEnabled}
            aria-label={`${t("settings.haptics")}: ${game.accessibility.hapticsEnabled ? t("settings.on") : t("settings.off")}`}
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
            <b>{t("settings.motion")}</b>
            <small>{t("settings.motionSub")}</small>
          </span>
          <button
            className="settings-switch"
            aria-pressed={game.accessibility.reducedMotion}
            aria-label={`${t("settings.motion")}: ${game.accessibility.reducedMotion ? t("settings.on") : t("settings.off")}`}
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
            <b>{t("settings.textSize")}</b>
            <small>{t("settings.textSizeSub")}</small>
          </span>
          <button
            className="settings-value"
            aria-pressed={game.accessibility.largeText}
            onClick={() => setLargeText(!game.accessibility.largeText)}
          >
            {game.accessibility.largeText ? t("settings.textSizeLarge") : t("settings.textSizeStandard")}
          </button>
        </div>
        <div className="settings-row">
          <span className="settings-row-icon" aria-hidden="true">
            <Icon name="sound" />
          </span>
          <span className="settings-row-copy">
            <b>{t("settings.sound")}</b>
            <small>{t("settings.soundSub")}</small>
          </span>
          <button
            className="settings-value"
            aria-label={`${t("settings.sound")}: ${currentSoundLabel}`}
            onClick={() =>
              setSoundLevel(nextSoundLevel[game.accessibility.soundLevel])
            }
          >
            {currentSoundLabel}
          </button>
        </div>
        <div className="settings-row">
          <span className="settings-row-icon" aria-hidden="true">
            <Icon name="language" />
          </span>
          <span className="settings-row-copy">
            <b>{t("settings.language")}</b>
            <small>{t("settings.languageSub")}</small>
          </span>
          <div className="language-selector" role="group" aria-label={t("settings.language")}>
            {supportedLanguages.map((option) => (
              <button
                key={option.code}
                type="button"
                className={`lang-pill ${lang === option.code ? "active" : ""}`}
                aria-pressed={lang === option.code}
                onClick={() => setLanguage(option.code)}
              >
                {option.code.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="settings-row">
          <span className="settings-row-icon" aria-hidden="true">
            <Icon name="analytics" />
          </span>
          <span className="settings-row-copy">
            <b>{t("settings.analytics")}</b>
            <small>{t("settings.analyticsSub")}</small>
          </span>
          <button
            className="settings-switch"
            aria-pressed={game.analytics.enabled}
            aria-label={`${t("settings.analytics")}: ${game.analytics.enabled ? t("settings.on") : t("settings.off")}`}
            onClick={() => setAnalytics(!game.analytics.enabled)}
          >
            <span aria-hidden="true" />
          </button>
        </div>
      </section>
      <button
        className="settings-link-card"
        aria-label={t("settings.purchases")}
        onClick={() => {
          setPurchasesOpen(true);
          void openPurchases();
        }}
      >
        <span className="settings-link-icon" aria-hidden="true">
          <Icon name="store" />
        </span>
        <span>
          <b>{t("settings.purchases")}</b>
          <small>{t("settings.purchasesSub")}</small>
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
      <section className="settings-section" aria-label={t("settings.helpLegal")}>
        <div className="settings-section-heading">
          <div>
            <h3>{t("settings.helpLegal")}</h3>
            <p>{t("settings.helpLegalSub")}</p>
          </div>
        </div>
        <div className="settings-document-links">
          <a href="/support.html">
            {t("settings.support")} <span aria-hidden="true">↗</span>
          </a>
          <a href="/privacy.html">
            {t("settings.privacy")} <span aria-hidden="true">↗</span>
          </a>
          <a href="/terms.html">
            {t("settings.terms")} <span aria-hidden="true">↗</span>
          </a>
        </div>
      </section>
      <section className="settings-danger-zone" aria-label={t("settings.saveManagement")}>
        <div>
          <b>{t("settings.saveManagement")}</b>
          <small>{t("settings.saveManagementSub")}</small>
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
          {resetArmed ? t("settings.resetConfirm") : t("settings.resetCareer")}
        </button>
        {resetArmed ? (
          <button className="text-button" onClick={() => setResetArmed(false)}>
            {t("settings.cancel")}
          </button>
        ) : null}
      </section>
    </section>
  );
}
