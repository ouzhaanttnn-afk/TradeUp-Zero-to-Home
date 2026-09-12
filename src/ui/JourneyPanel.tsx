import { useMemo, useState } from "react";
import { activeBookCostMinor, activeOwnedAssets } from "../domain/economy";
import {
  categoryExpertiseLevel,
  marketExpertiseLevel,
  nextExpertiseThreshold,
} from "../domain/meta";
import type { GameState } from "../domain/models";
import { HOME_GOAL_MINOR, money } from "../game";
import {
  availableHomeOptions,
  homeOptionById,
  homeSearchElapsedMin,
  nextHomeResult,
} from "../content/homes";
import { Icon } from "./Icon";
import { homeAssets } from "./homeAssets";
import {
  careerEventPresentation,
  completedSalesPresentation,
  timelineFilterLabel,
  timelinePageState,
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
  onBuyHome: (homeId: string) => void;
  onOpenPortfolio: () => void;
}) {
  const timelinePageSize = 4;
  const [timelineFilter, setTimelineFilter] = useState<TimelineFilter>("ALL");
  const [timelineExpanded, setTimelineExpanded] = useState(false);
  const [timelinePage, setTimelinePage] = useState(0);
  const timeline = useMemo(
    () =>
      game.career
        .filter(
          (event) => timelineFilter === "ALL" || event.group === timelineFilter,
        )
        .toReversed(),
    [game.career, timelineFilter],
  );
  const timelinePages = timelinePageState(
    timeline.length,
    timelinePage,
    timelinePageSize,
  );
  const visibleTimeline = timeline.slice(
    timelinePages.start,
    timelinePages.end,
  );
  const completedSales = completedSalesPresentation(game.realizedProfitMinor);
  const estimates = wealthPresentation(game);
  const marketLevel = marketExpertiseLevel(game);
  const marketXpTarget = nextExpertiseThreshold(game.expertise.marketXp);
  const availableHomes = availableHomeOptions(game.home, game.gameTimeMin);
  const nextHome = nextHomeResult(game.home, game.gameTimeMin);
  const searchElapsed = homeSearchElapsedMin(game.home, game.gameTimeMin);
  const nextHomeWaitMin = nextHome
    ? Math.max(0, nextHome.revealOffsetMin - searchElapsed)
    : 0;
  const purchasedHome = homeOptionById(game.home.purchasedHomeId);

  return (
    <>
      <div className="section-title">
        <div>
          <small>KİŞİSEL KAYIT</small>
          <h2>Yolculuk</h2>
        </div>
      </div>
      {game.home.unlocked ? (
        <section className="home-card home-card-primary">
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
            {!game.home.purchased && homeProgress >= 100 ? (
              <div className="home-market">
                <div className="home-market-status" role="status">
                  <span>
                    {availableHomes.length
                      ? `${availableHomes.length} ev bulundu`
                      : "Emlak araştırması sürüyor"}
                  </span>
                  {nextHome ? (
                    <b>Yeni sonuç yaklaşık {nextHomeWaitMin} oyun dk.</b>
                  ) : (
                    <b>Tüm seçenekler bulundu</b>
                  )}
                </div>
                {availableHomes.length ? (
                  <div className="home-market-list" aria-label="Ev seçenekleri">
                    {availableHomes.map((home) => (
                      <article className="home-option-card" key={home.id}>
                        <img src={homeAssets[home.assetKey]} alt="" />
                        <div>
                          <small>{home.location}</small>
                          <h4>{home.name}</h4>
                          <p>{home.summary}</p>
                          <strong>{money(home.priceMinor)}</strong>
                          {game.cashMinor >= home.priceMinor ? (
                            <button onClick={() => onBuyHome(home.id)}>
                              Bu evi seç
                            </button>
                          ) : (
                            <span className="home-option-shortfall">
                              {money(home.priceMinor - game.cashMinor)} eksik
                            </span>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                ) : null}
              </div>
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
        <section className="locked-home home-card-primary">
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
      {game.home.purchased ? (
        <section className="next-goal-card">
          <div>
            <small>EVİN ARDINDAKİ HEDEF</small>
            <h3>{purchasedHome?.name ?? "Kendi evin"} ile yeni dönem</h3>
            <p>
              Kariyer devam ediyor. Bir sonraki uzun dönem hedefi yeni içerik
              güncellemesiyle açılacak.
            </p>
          </div>
          <span>YAKINDA</span>
        </section>
      ) : null}
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
      <div className="timeline-header timeline-header-collapsible">
        <div>
          <small>KİŞİSEL KAYITLARIN</small>
          <h3>Kariyer hikâyen</h3>
        </div>
        <div className="timeline-summary">
          <span>{game.career.length} önemli an</span>
          <button
            className="timeline-toggle"
            type="button"
            aria-expanded={timelineExpanded}
            aria-controls="career-timeline-content"
            onClick={() => setTimelineExpanded((expanded) => !expanded)}
          >
            {timelineExpanded ? "Kapat" : "Aç"}
            <span aria-hidden="true">{timelineExpanded ? "−" : "+"}</span>
          </button>
        </div>
      </div>
      {timelineExpanded ? (
        <div className="timeline-content" id="career-timeline-content">
          <div className="chips timeline-filters">
            {(["ALL", "FIRSTS", "RECORDS", "MILESTONES", "HOME"] as const).map(
              (filter) => (
                <button
                  className={timelineFilter === filter ? "active" : ""}
                  key={filter}
                  onClick={() => {
                    setTimelineFilter(filter);
                    setTimelinePage(0);
                  }}
                >
                  {timelineFilterLabel(filter)}
                </button>
              ),
            )}
          </div>
          {!timeline.length ? (
            <div className="empty compact-empty">
              <h3>Bu grupta olay yok</h3>
              <p>
                Anlamlı ilkler, rekorlar ve eşikler gerçek işlemlerinden doğar.
              </p>
            </div>
          ) : null}
          <div className="timeline">
            {visibleTimeline.map((event) => {
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
                      <small className="timeline-kind">
                        {eventState.label}
                      </small>
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
          {timelinePages.pageCount > 1 ? (
            <div className="timeline-pagination" aria-label="Kariyer sayfaları">
              <button
                type="button"
                disabled={timelinePages.page === 0}
                onClick={() => setTimelinePage(timelinePages.page - 1)}
              >
                Önceki
              </button>
              <span>
                {timelinePages.page + 1} / {timelinePages.pageCount}
              </span>
              <button
                type="button"
                disabled={timelinePages.page === timelinePages.pageCount - 1}
                onClick={() => setTimelinePage(timelinePages.page + 1)}
              >
                Sonraki
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
