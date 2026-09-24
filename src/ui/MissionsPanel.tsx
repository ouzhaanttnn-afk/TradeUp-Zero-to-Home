import { getActiveMissions } from "../domain/missions";
import type { GameState } from "../domain/models";
import { useTranslation } from "../i18n";

export default function MissionsPanel({ game }: { game: GameState }) {
  const { t, lang } = useTranslation();
  const missions = getActiveMissions(game);

  return (
    <section className="missions-panel" aria-label={t("missions.title") || "Ticaret Görevleri"}>
      <div className="section-title">
        <div>
          <small>{t("missions.kicker") || "GÜNLÜK HEDEFLER"}</small>
          <h3>{t("missions.title") || "Ticaret Görevleri"}</h3>
        </div>
      </div>

      <div className="missions-list">
        {missions.map((mission) => {
          const progressPercent = Math.min(
            100,
            Math.round((mission.current / mission.target) * 100),
          );
          return (
            <article
              key={mission.id}
              className={`mission-card ${mission.completed ? "completed" : ""}`}
            >
              <div className="mission-card-header">
                <div>
                  <small className="mission-badge">{mission.badge[lang]}</small>
                  <h4>{mission.title[lang]}</h4>
                </div>
                <span className={`mission-reward-pill ${mission.completed ? "claimed" : ""}`}>
                  {mission.completed ? "✓ " : "+"}{mission.rewardXp} XP
                </span>
              </div>
              <p>{mission.description[lang]}</p>
              <div className="mission-progress-row">
                <div className="mission-progress-bar">
                  <div
                    className="mission-progress-fill"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="mission-count">
                  {mission.current} / {mission.target}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
