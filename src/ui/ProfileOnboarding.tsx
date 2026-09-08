import { useState } from "react";
import { avatars, freeAvatars } from "../content/avatars";
import { ownsAnimatedAvatars } from "../domain/profile";
import type { AvatarId, GameState } from "../domain/models";
import { AvatarPortrait } from "./AvatarPortrait";

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
            <small>TRADEUP · YENİ KARİYER</small>
            <b>Zero to Home</b>
          </span>
        </header>
        <div className="onboarding-copy">
          <span>OYUNCU PROFİLİ</span>
          <h1 id="profile-onboarding-title">Pazara kendi tarzınla gir.</h1>
          <p>Adını belirle, seni temsil edecek karakteri seç.</p>
        </div>
        <label className="onboarding-name">
          <span>Oyuncu adı</span>
          <input
            autoFocus
            autoComplete="nickname"
            maxLength={20}
            value={name}
            placeholder="Örn. Pazar Ustası"
            onChange={(event) => setName(event.target.value)}
          />
          <small>{name.trim().length}/20</small>
        </label>
        <fieldset className="avatar-picker avatar-picker--onboarding">
          <legend>
            {animatedAvatarsOwned ? "Karakterin" : "Ücretsiz karakterin"}
          </legend>
          <div className="avatar-options">
            {(animatedAvatarsOwned ? avatars : freeAvatars).map((avatar) => (
              <button
                key={avatar.id}
                type="button"
                aria-pressed={avatarId === avatar.id}
                aria-label={`${avatar.name}, ${avatar.role}`}
                onClick={() => setAvatarId(avatar.id)}
              >
                <AvatarPortrait avatarId={avatar.id} />
                <span>
                  <b>{avatar.name}</b>
                  <small>{avatar.role}</small>
                </span>
                <i aria-hidden="true">✓</i>
              </button>
            ))}
          </div>
        </fieldset>
        {!animatedAvatarsOwned ? (
          <div
            className="premium-avatar-preview"
            aria-label="Canlı avatar ön izlemesi"
          >
            <div>
              <span>CANLI KOLEKSİYON</span>
              <b>Hareketli avatarlar</b>
              <small>Yalnız görünüm · oynanış avantajı yok</small>
            </div>
            <div className="premium-avatar-stack" aria-hidden="true">
              {avatars.slice(3).map((avatar) => (
                <AvatarPortrait key={avatar.id} avatarId={avatar.id} />
              ))}
            </div>
            <span className="premium-avatar-status">Yakında</span>
          </div>
        ) : null}
        <button
          className="primary onboarding-start"
          disabled={!name.trim()}
          onClick={() => onComplete(name, avatarId)}
        >
          Kariyere başla <span aria-hidden="true">→</span>
        </button>
        <button
          className="onboarding-restore"
          disabled={monetizationBusy}
          onClick={() => {
            setRestoreRequested(true);
            void onRestorePurchases();
          }}
        >
          Satın alımları geri yükle
        </button>
        {restoreRequested ? (
          <p className="onboarding-restore-status" role="status">
            {monetizationBusy ? "Mağaza kontrol ediliyor…" : notice}
          </p>
        ) : null}
      </section>
    </main>
  );
}
