import { useState } from "react";
import { avatars, freeAvatars } from "../content/avatars";
import { ownsAnimatedAvatars } from "../domain/profile";
import type { AvatarId, GameState } from "../domain/models";
import { AvatarPortrait } from "./AvatarPortrait";
import { useTranslation, localizeAvatar, localizeNotice } from "../i18n";

type ProfileOnboardingProps = {
  game: GameState;
  monetizationBusy: boolean;
  notice: string;
  onComplete: (displayName: string, avatarId: AvatarId) => void;
  onRestorePurchases: () => Promise<void>;
};

export default function ProfileOnboarding({
  game,
  monetizationBusy,
  notice,
  onComplete,
  onRestorePurchases,
}: ProfileOnboardingProps) {
  const { t, lang } = useTranslation();
  const [name, setName] = useState("");
  const [avatarId, setAvatarId] = useState<AvatarId>("pazar-kasifi");
  const [restoreRequested, setRestoreRequested] = useState(false);
  const animatedAvatarsOwned = ownsAnimatedAvatars(game);

  return (
    <main
      className={`profile-onboarding${game.accessibility.reducedMotion ? " reduced-motion" : ""}`}
    >
      <div className="onboarding-atmosphere" aria-hidden="true" />
      <section
        className="onboarding-card"
        aria-labelledby="profile-onboarding-title"
      >
        <header className="onboarding-brand">
          <span className="brand-mark" aria-hidden="true">
            ↑
          </span>
          <span>
            <small>{t("onboarding.kicker")}</small>
            <b>{t("onboarding.brand")}</b>
          </span>
        </header>
        <div className="onboarding-copy">
          <span>{t("onboarding.subtitle")}</span>
          <h1 id="profile-onboarding-title">{t("onboarding.headline")}</h1>
          <p>{t("onboarding.desc")}</p>
        </div>
        <label className="onboarding-name">
          <span>{t("onboarding.nameLabel")}</span>
          <input
            autoFocus
            autoComplete="nickname"
            maxLength={20}
            value={name}
            placeholder={t("onboarding.placeholder")}
            onChange={(event) => setName(event.target.value)}
          />
          <small>{name.trim().length}/20</small>
        </label>
        <fieldset className="avatar-picker avatar-picker--onboarding">
          <legend>
            {animatedAvatarsOwned
              ? t("onboarding.avatarLegend")
              : t("onboarding.avatarLegendFree")}
          </legend>
          <div className="avatar-options">
            {(animatedAvatarsOwned ? avatars : freeAvatars).map((avatar) => {
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
                  aria-pressed={avatarId === avatar.id}
                  aria-label={`${localized.name}, ${localized.role}`}
                  onClick={() => setAvatarId(avatar.id)}
                >
                  <AvatarPortrait avatarId={avatar.id} />
                  <span>
                    <b>{localized.name}</b>
                    <small>{localized.role}</small>
                  </span>
                  <i aria-hidden="true">✓</i>
                </button>
              );
            })}
          </div>
        </fieldset>
        {!animatedAvatarsOwned ? (
          <div
            className="premium-avatar-preview"
            aria-label={t("onboarding.liveAvatarPreview")}
          >
            <div>
              <span>{t("onboarding.liveAvatars")}</span>
              <b>{t("onboarding.animatedAvatars")}</b>
              <small>{t("onboarding.cosmeticOnly")}</small>
            </div>
            <div className="premium-avatar-stack" aria-hidden="true">
              {avatars.slice(3).map((avatar) => (
                <AvatarPortrait key={avatar.id} avatarId={avatar.id} />
              ))}
            </div>
            <span className="premium-avatar-status">{t("onboarding.comingSoon")}</span>
          </div>
        ) : null}
        <button
          className="primary onboarding-start"
          disabled={!name.trim()}
          onClick={() => onComplete(name, avatarId)}
        >
          {t("onboarding.start")} <span aria-hidden="true">→</span>
        </button>
        <button
          className="onboarding-restore"
          disabled={monetizationBusy}
          onClick={() => {
            setRestoreRequested(true);
            void onRestorePurchases();
          }}
        >
          {t("onboarding.restore")}
        </button>
        {restoreRequested ? (
          <p className="onboarding-restore-status" role="status">
            {monetizationBusy ? t("onboarding.checking") : localizeNotice(notice, lang)}
          </p>
        ) : null}
      </section>
    </main>
  );
}

