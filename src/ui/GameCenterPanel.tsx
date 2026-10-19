import { useRef, useState } from "react";
import {
  leaderboardScores,
  type LeaderboardKind,
} from "../domain/leaderboards";
import {
  connectGameCenter,
  loadGameCenterBoard,
  submitCareerScores,
  type GameCenterBoard,
  type GameCenterIdentity,
} from "../infrastructure/gameCenter";
import { useGameStore } from "../stores/gameStore";
import { useTranslation } from "../i18n";
import { money } from "../game";
import "./firstHome.css";

export default function GameCenterPanel() {
  const { lang } = useTranslation();
  const tr = lang === "tr";
  const [identity, setIdentity] = useState<GameCenterIdentity | null>(null);
  const [kind, setKind] = useState<LeaderboardKind>("wealth");
  const [board, setBoard] = useState<GameCenterBoard | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [permission, setPermission] = useState(false);
  const lock = useRef(false);
  const titles: Record<LeaderboardKind, string> = {
    wealth: tr ? "En Zenginler" : "Wealthiest",
    profit100: tr ? "100 Ticarette Kâr" : "Profit in 100 Trades",
    homebudget: tr ? "En Az Ticaret" : "Fewest Trades",
  };
  const run = async (next: LeaderboardKind, submit = false) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setMessage("");
    setBoard(null);
    try {
      // Each explicit operation checks the current Apple account; never reuse a
      // persisted identifier or silently submit on behalf of a switched account.
      const current = await connectGameCenter();
      if (identity && identity.playerId !== current.playerId)
        setPermission(false);
      if (submit && identity?.playerId !== current.playerId) {
        setIdentity(current);
        setPermission(false);
        setMessage(
          tr
            ? "Game Center hesabı değişti. Göndermeden önce yeniden onayla."
            : "Game Center account changed. Confirm again before submitting.",
        );
        return;
      }
      setIdentity(current);
      if (submit) {
        const careerId = useGameStore.getState().game.careerId;
        await useGameStore.getState().flush();
        if (useGameStore.getState().game.careerId !== careerId)
          throw new Error("CAREER_CHANGED");
        const scores = leaderboardScores(useGameStore.getState().game);
        if (!scores.length) throw new Error("INVALID_SCORES");
        await submitCareerScores(scores, current.playerId);
        setMessage(
          tr
            ? "Uygun sonuçların gönderildi. Apple listesi gecikmeli güncellenebilir."
            : "Eligible scores submitted. Apple's list may take time to update.",
        );
      }
      setBoard(await loadGameCenterBoard(next, current.playerId));
    } catch (error) {
      const reason = error instanceof Error ? error.message : "";
      setMessage(
        reason === "INVALID_SCORES"
          ? tr
            ? "Bu kayıttan kesin sıralama skoru hesaplanamıyor. Yerel kariyerin ve rekorların korunuyor."
            : "This save does not contain sufficient records for a leaderboard score. Your local career and records are preserved."
          : tr
            ? "Game Center işlemi tamamlanamadı. Bağlantını ve Game Center girişini kontrol edip yeniden dene. Kariyerin değişmedi."
            : "Game Center operation could not complete. Check your connection and sign-in, then retry. Your career is unchanged.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const format = (score: string) =>
    kind === "homebudget" ? score : money(Number(score), lang);
  return (
    <section className="game-center-panel">
      <h3>Game Center · Top 100</h3>
      <p>
        {tr
          ? "İsteğe bağlı serbest kariyer sıralaması. Apple takma adın ve skorun görünür; yerel profil adın ve kaydın yüklenmez. Sunucu doğrulamalı veya eşit şartlı bir turnuva değildir."
          : "Optional free-career rankings. Your Apple alias and score are visible; your local name and save are not uploaded. Not a server-verified or equal-conditions tournament."}
      </p>
      <div
        className="chips"
        role="group"
        aria-label={tr ? "Sıralama türü" : "Leaderboard type"}
      >
        {(Object.keys(titles) as LeaderboardKind[]).map((item) => (
          <button
            key={item}
            disabled={busy}
            aria-pressed={kind === item}
            className={kind === item ? "active" : ""}
            onClick={() => {
              setKind(item);
              setBoard(null);
              if (identity) void run(item);
            }}
          >
            {titles[item]}
          </button>
        ))}
      </div>
      <p>
        {kind === "wealth"
          ? tr
            ? "En iyi gönderilen servet: nakit + eldeki ürünlerin oyun değeri + mevcut ev. İlan fiyatları sayılmaz."
            : "Best submitted wealth: cash + owned items' game value + current home. Asking prices do not count."
          : kind === "profit100"
            ? tr
              ? "İlk 100 piyasa satışında masraf ve zararlar dahil net kâr. Hediye defter sayılmaz."
              : "Net profit in the first 100 market sales, including costs and losses. Gifted notebook excluded."
            : tr
              ? "İlk ₺3.750.000 nakde ulaşırken tamamlanan piyasa ticareti. Daha azı daha iyi."
              : "Completed market trades when first reaching ₺3,750,000 cash. Lower is better."}
      </p>
      <button disabled={busy} onClick={() => void run(kind)}>
        {busy
          ? tr
            ? "Bağlanıyor…"
            : "Connecting…"
          : identity
            ? tr
              ? "Listeyi yenile"
              : "Refresh list"
            : tr
              ? "Game Center'a bağlan"
              : "Connect to Game Center"}
      </button>
      {identity ? (
        <>
          <p>{identity.alias}</p>
          <label className="leaderboard-consent">
            <input
              type="checkbox"
              checked={permission}
              disabled={busy}
              onChange={(event) => setPermission(event.target.checked)}
            />
            {tr
              ? "Bu kariyerin uygun skorlarını Game Center hesabımla paylaşmayı onaylıyorum."
              : "I agree to share eligible scores from this career with my Game Center account."}
          </label>
          <button
            disabled={busy || !permission}
            onClick={() => void run(kind, true)}
          >
            {tr ? "Sonuçlarımı gönder" : "Submit my scores"}
          </button>
        </>
      ) : null}
      <p role="status" aria-live="polite">
        {message}
      </p>
      {board ? (
        <>
          {board.local ? (
            <p>
              <strong>
                {tr ? "Senin sıran" : "Your rank"}: {board.local.rank} ·{" "}
                {format(board.local.score)}
              </strong>
            </p>
          ) : null}
          {board.entries.length ? (
            <ol className="leaderboard-entries">
              {board.entries.map((entry, index) => (
                <li
                  key={`${entry.rank}:${index}`}
                  className={entry.isLocal ? "is-local" : ""}
                >
                  <span>
                    {entry.rank}. {entry.alias}
                  </span>
                  <strong>{format(entry.score)}</strong>
                </li>
              ))}
            </ol>
          ) : (
            <p>{tr ? "Henüz sonuç yok." : "No scores yet."}</p>
          )}
        </>
      ) : null}
    </section>
  );
}
