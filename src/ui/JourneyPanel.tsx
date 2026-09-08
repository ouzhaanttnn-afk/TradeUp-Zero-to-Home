import { useMemo, useState } from "react";
import { activeBookCostMinor, activeOwnedAssets } from "../domain/economy";
import {
  categoryExpertiseLevel,
  marketExpertiseLevel,
  nextExpertiseThreshold,
} from "../domain/meta";
import type { GameState } from "../domain/models";
import { HOME_GOAL_MINOR, money } from "../game";
import { Icon } from "./Icon";
import {
  careerEventPresentation,
  completedSalesPresentation,
  timelineFilterLabel,
  type TimelineFilter,
} from "./journeyPresentation";
import { simplifyLegacyPlayerCopy } from "./playerLanguage";
import { saleHistoryCopy } from "./saleHistory";
import { formatEstimate, wealthPresentation } from "./wealthPresentation";

export default function JourneyPanel({
  game,
  homeProgress,
  onBuyHome,
  onOpenPortfolio,
}: {
  game: GameState;
  homeProgress: number;
  onBuyHome: () => void;
  onOpenPortfolio: () => void;
}) {
  const [timelineFilter, setTimelineFilter] = useState<TimelineFilter>("ALL");
  const timeline = useMemo(
    () =>
      game.career
        .filter(
          (event) => timelineFilter === "ALL" || event.group === timelineFilter,
        )
        .toReversed(),
    [game.career, timelineFilter],
  );
  const completedSales = completedSalesPresentation(game.realizedProfitMinor);
  const estimates = wealthPresentation(game);
  const marketLevel = marketExpertiseLevel(game);
  const marketXpTarget = nextExpertiseThreshold(game.expertise.marketXp);

  return (
    <>
      <div className="section-title">
        <div>
          <small>KİŞİSEL KAYIT</small>
          <h2>Yolculuk</h2>
        </div>
      </div>
      <section className={`score-card journey-score ${completedSales.tone}`}>
        <div className="journey-score-heading">
          <small>{completedSales.label}</small>
          <span>Gerçekleşen sonuç</span>
        </div>
        <strong className={game.realizedProfitMinor < 0 ? "loss" : ""}>
          {money(game.realizedProfitMinor)}
        </strong>
        <p>
          Bu tutar yalnız tamamlanan satışlardan gelir; elindeki ürünlerin
          tahmini değeri aşağıda ayrı gösterilir.
        </p>
      </section>
      <div className="journey-block-heading">
        <div>
          <small>PARAN VE ÜRÜNLERİN</small>
          <h3>Bugünkü durum</h3>
        </div>
        <span>{activeOwnedAssets(game).length} ürün</span>
      </div>
      <div className="metric-grid journey-metrics">
        <div>
          <span>Nakit</span>
          <b>{money(game.cashMinor)}</b>
        </div>
        <div>
          <span>Toplam tahmini değer</span>
          <b>{formatEstimate(estimates.total)}</b>
        </div>
        <div>
          <span>Ürünlerin tahmini değeri</span>
          <b>{formatEstimate(estimates.portfolio)}</b>
        </div>
        <div>
          <span>Ürünlere harcanan toplam</span>
          <b>{money(activeBookCostMinor(game))}</b>
        </div>
        <div>
          <span>Ürünlerdeki tahmini fark</span>
          <b className={estimates.difference.highMinor < 0 ? "loss" : ""}>
            {formatEstimate(estimates.difference, true)}
          </b>
        </div>
        <div>
          <span>Toplam değerin nakit kısmı</span>
          <b>
            %{estimates.cashShare.low}–%{estimates.cashShare.high}
          </b>
        </div>
      </div>
      <section className="expertise-card">
        <div className="expertise-heading">
          <div>
            <small>PAZAR DENEYİMİ</small>
            <h3>Seviye {marketLevel}</h3>
          </div>
          <span>
            {game.expertise.marketXp} / {marketXpTarget} deneyim
          </span>
        </div>
        <div className="xp-bar">
          <i
            style={{
              width: `${Math.min(
                100,
                (game.expertise.marketXp / marketXpTarget) * 100,
              )}%`,
            }}
          />
        </div>
        <p>
          {marketLevel < 3
            ? "Seviye 3: ürün alarmları ve fiyat eğilimi"
            : marketLevel < 6
              ? "Seviye 6: bilgi güveni ve kusur ihtimali"
              : "Bilgi araçların kararını netleştirir; fiyat bonusu vermez."}
        </p>
        <div className="category-levels">
          {Object.entries(game.expertise.categoryXp)
            .sort((left, right) => right[1] - left[1])
            .map(([category, xp]) => (
              <span key={category}>
                {category} · Seviye {categoryExpertiseLevel(game, category)}{" "}
                <small>{xp} deneyim</small>
              </span>
            ))}
        </div>
      </section>
      {game.home.unlocked ? (
        <section className="home-card">
          <div className="home-silhouette" aria-hidden="true">
            <span>
              <Icon name="home" />
            </span>
          </div>
          <div>
            <small>EV YOLCULUĞU · %{homeProgress}</small>
            <h3>
              {game.home.purchased
                ? "Evin artık senin"
                : "Kendi alanına giden yol"}
            </h3>
            <p>
              {game.home.purchased
                ? "Hedef tamamlandı; pazar ve kariyerin açık kalmaya devam ediyor."
                : homeProgress < 50
                  ? "İlk kârlı satışınla hedef görünür oldu."
                  : `Kalan tahmini mesafe ${formatEstimate({
                      lowMinor: Math.max(
                        0,
                        HOME_GOAL_MINOR - estimates.total.highMinor,
                      ),
                      highMinor: Math.max(
                        0,
                        HOME_GOAL_MINOR - estimates.total.lowMinor,
                      ),
                    })}. Ev alımı için hedefte nakit gerekecek.`}
            </p>
            <div className="xp-bar">
              <i style={{ width: `${homeProgress}%` }} />
            </div>
            {!game.home.purchased && game.cashMinor >= HOME_GOAL_MINOR ? (
              <button className="home-purchase-button" onClick={onBuyHome}>
                Evi satın al · {money(HOME_GOAL_MINOR)}
              </button>
            ) : null}
            {!game.home.purchased &&
            homeProgress >= 100 &&
            game.cashMinor < HOME_GOAL_MINOR ? (
              <div className="home-cash-plan">
                <span>
                  Nakit eksiği {money(HOME_GOAL_MINOR - game.cashMinor)}.
                  Ürünlerin otomatik satılmaz.
                </span>
                <button onClick={onOpenPortfolio}>Portföyü aç</button>
              </div>
            ) : null}
          </div>
        </section>
      ) : (
        <section className="locked-home">
          <span>
            <Icon name="home" />
          </span>
          <div>
            <small>UZUN DÖNEM HEDEFİ</small>
            <h3>Ev yolculuğu henüz görünmedi</h3>
            <p>
              Temel döngüyü öğrenip ilk kârlı satışını tamamladığında açılır.
            </p>
          </div>
        </section>
      )}
      <div className="timeline-header">
        <div>
          <small>KİŞİSEL KAYITLARIN</small>
          <h3>Kariyer hikâyen</h3>
        </div>
        <span>{game.career.length} önemli an</span>
      </div>
      <div className="chips timeline-filters">
        {(["ALL", "FIRSTS", "RECORDS", "MILESTONES", "HOME"] as const).map(
          (filter) => (
            <button
              className={timelineFilter === filter ? "active" : ""}
              key={filter}
              onClick={() => setTimelineFilter(filter)}
            >
              {timelineFilterLabel(filter)}
            </button>
          ),
        )}
      </div>
      {!timeline.length ? (
        <div className="empty compact-empty">
          <h3>Bu grupta olay yok</h3>
          <p>Anlamlı ilkler, rekorlar ve eşikler gerçek işlemlerinden doğar.</p>
        </div>
      ) : null}
      <div className="timeline">
        {timeline.map((event) => {
          const eventState = careerEventPresentation(
            event.group,
            game.gameTimeMin,
            event.atGameMin,
          );
          const saleCopy = saleHistoryCopy(event);
          return (
            <article
              className={`timeline-event ${eventState.tone}`}
              key={event.id}
            >
              <div className="timeline-rail" aria-hidden="true">
                <span className="timeline-dot" />
              </div>
              <div className="timeline-event-copy">
                <div className="timeline-meta">
                  <small className="timeline-kind">{eventState.label}</small>
                  <span>{eventState.ageLabel}</span>
                </div>
                <b>{simplifyLegacyPlayerCopy(event.label)}</b>
                {saleCopy ? <p>{saleCopy}</p> : null}
              </div>
              {event.amountMinor !== undefined ? (
                <em>{money(event.amountMinor)}</em>
              ) : null}
            </article>
          );
        })}
      </div>
    </>
  );
}
