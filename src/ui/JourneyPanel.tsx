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
  nextLadderHome,
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
import { useTranslation, localizeHome, localizeCategory } from "../i18n";

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
  const { lang, t } = useTranslation();
  const timelinePageSize = 4;
  const [timelineFilter, setTimelineFilter] = useState<TimelineFilter>("ALL");
  const [timelineExpanded, setTimelineExpanded] = useState(false);
  const [timelinePage, setTimelinePage] = useState(0);
  const [metricsExpanded, setMetricsExpanded] = useState(false);
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
  const completedSales = completedSalesPresentation(game.realizedProfitMinor, lang);
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
  const ladderTarget = nextLadderHome(game.home);
  const upgradeOptions = availableHomes.filter(
    (option) => !purchasedHome || option.priceMinor > purchasedHome.priceMinor,
  );
  const showHomeMarket = game.home.purchased
    ? Boolean(ladderTarget)
    : homeProgress >= 100;
  const cashTargetMinor = game.home.purchased
    ? ladderTarget?.priceMinor
    : HOME_GOAL_MINOR;
  const showCashPlan =
    cashTargetMinor !== undefined &&
    showHomeMarket &&
    game.cashMinor < cashTargetMinor;

  return (
    <>
      <div className="section-title">
        <div>
          <small>{t("journey.personalRecord")}</small>
          <h2>{t("journey.title")}</h2>
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
            <small>{t("journey.homeJourney")} · {lang === "tr" ? `%${homeProgress}` : `${homeProgress}%`}</small>
            <h3>
              {!game.home.purchased
                ? t("journey.pathToOwnSpace")
                : ladderTarget
                  ? `${purchasedHome ? localizeHome(purchasedHome.id, purchasedHome.name, "", "", lang).name : t("journey.yourHome")} → ${localizeHome(ladderTarget.id, ladderTarget.name, "", "", lang).name}`
                  : t("journey.realEstatePeak")}
            </h3>
            <p>
              {!game.home.purchased
                ? homeProgress < 50
                  ? t("journey.homeGoalLockedDesc")
                  : t("journey.remainingDistanceCashNeeded", {
                      distance: formatEstimate(
                        {
                          lowMinor: Math.max(
                            0,
                            HOME_GOAL_MINOR - estimates.total.highMinor,
                          ),
                          highMinor: Math.max(
                            0,
                            HOME_GOAL_MINOR - estimates.total.lowMinor,
                          ),
                        },
                        false,
                        lang,
                      ),
                    })
                : ladderTarget
                  ? t("journey.nextTargetRemainingDistance", {
                      target: localizeHome(ladderTarget.id, ladderTarget.name, "", "", lang).name,
                      distance: formatEstimate(
                        {
                          lowMinor: Math.max(
                            0,
                            ladderTarget.priceMinor - estimates.total.highMinor,
                          ),
                          highMinor: Math.max(
                            0,
                            ladderTarget.priceMinor - estimates.total.lowMinor,
                          ),
                        },
                        false,
                        lang,
                      ),
                    })
                  : t("journey.topTierLadder")}
            </p>
            <div className="xp-bar">
              <i style={{ width: `${homeProgress}%` }} />
            </div>
            {showHomeMarket ? (
              <div className="home-market">
                <div className="home-market-status" role="status">
                  <span>
                    {upgradeOptions.length
                      ? t("journey.homesFound", { count: upgradeOptions.length })
                      : t("journey.homeSearchActive")}
                  </span>
                  {nextHome ? (
                    <b>{t("journey.nextHomeWait", { min: nextHomeWaitMin })}</b>
                  ) : (
                    <b>{t("journey.allHomeOptionsFound")}</b>
                  )}
                </div>
                {upgradeOptions.length ? (
                  <div className="home-market-list" aria-label={t("journey.homeOptions")}>
                    {upgradeOptions.map((home) => {
                      const localized = localizeHome(
                        home.id,
                        home.name,
                        home.location,
                        home.summary,
                        lang,
                      );
                      return (
                        <article className="home-option-card" key={home.id}>
                          <img src={homeAssets[home.assetKey]} alt="" />
                          <div>
                            <small>{localized.location}</small>
                            <h4>{localized.name}</h4>
                            <p>{localized.summary}</p>
                            <strong>{money(home.priceMinor, lang)}</strong>
                            {game.cashMinor >= home.priceMinor ? (
                              <button onClick={() => onBuyHome(home.id)}>
                                {t("journey.chooseHome")}
                              </button>
                            ) : (
                              <span className="home-option-shortfall">
                                {money(home.priceMinor - game.cashMinor, lang)} {t("journey.shortfall")}
                              </span>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ) : null}
            {showCashPlan ? (
              <div className="home-cash-plan">
                <span>
                  {t("journey.cashShortfallDesc", {
                    amount: money(cashTargetMinor! - game.cashMinor, lang),
                  })}
                </span>
                <button onClick={onOpenPortfolio}>{t("journey.openPortfolio")}</button>
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
            <small>{t("journey.longTermGoal")}</small>
            <h3>{t("journey.homeJourneyNotVisible")}</h3>
            <p>
              {t("journey.unlocksAfterProfitableSale")}
            </p>
          </div>
        </section>
      )}
      {game.home.purchased && !ladderTarget ? (
        <section className="next-goal-card">
          <div>
            <small>{t("journey.careerPeak")}</small>
            <h3>{t("journey.completedWithHome", { home: purchasedHome ? localizeHome(purchasedHome.id, purchasedHome.name, "", "", lang).name : t("journey.yourHome") })}</h3>
            <p>
              {t("journey.topOfLadderDesc")}
            </p>
          </div>
          <span>{t("journey.completedBadge")}</span>
        </section>
      ) : null}
      <section className={`score-card journey-score ${completedSales.tone}`}>
        <div className="journey-score-heading">
          <small>{completedSales.label}</small>
          <span>{t("journey.realizedOutcome")}</span>
        </div>
        <strong className={game.realizedProfitMinor < 0 ? "loss" : ""}>
          {money(game.realizedProfitMinor, lang)}
        </strong>
        <p>
          {t("journey.realizedProfitDesc")}
        </p>
      </section>
      <div className="journey-block-heading">
        <div>
          <small>{t("journey.moneyAndProducts")}</small>
          <h3>{t("journey.statusToday")}</h3>
        </div>
        <div className="journey-metrics-toggle-row">
          <span>{t("journey.ownedProductsCount", { count: activeOwnedAssets(game).length })}</span>
          <button
            className="timeline-toggle"
            type="button"
            aria-expanded={metricsExpanded}
            aria-controls="journey-metrics-detail"
            onClick={() => setMetricsExpanded((expanded) => !expanded)}
          >
            {metricsExpanded ? t("common.close") : t("common.detail")}
            <span aria-hidden="true">{metricsExpanded ? "−" : "+"}</span>
          </button>
        </div>
      </div>
      <div className="metric-grid journey-metrics journey-metrics-primary">
        <div>
          <span>{t("wallet.cash")}</span>
          <b>{money(game.cashMinor, lang)}</b>
        </div>
        <div>
          <span>{t("journey.totalEstValue")}</span>
          <b>{formatEstimate(estimates.total, false, lang)}</b>
        </div>
      </div>
      {metricsExpanded ? (
        <div
          className="metric-grid journey-metrics journey-metrics-secondary"
          id="journey-metrics-detail"
        >
          <div>
            <span>{t("journey.itemsEstValue")}</span>
            <b>{formatEstimate(estimates.portfolio, false, lang)}</b>
          </div>
          <div>
            <span>{t("journey.itemsTotalSpent")}</span>
            <b>{money(activeBookCostMinor(game), lang)}</b>
          </div>
          <div>
            <span>{t("journey.itemsEstDifference")}</span>
            <b className={estimates.difference.highMinor < 0 ? "loss" : ""}>
              {formatEstimate(estimates.difference, true, lang)}
            </b>
          </div>
          <div>
            <span>{t("journey.cashShareOfTotal")}</span>
            <b>
              {lang === "tr"
                ? `%${estimates.cashShare.low}–%${estimates.cashShare.high}`
                : `${estimates.cashShare.low}%–${estimates.cashShare.high}%`}
            </b>
          </div>
        </div>
      ) : null}
      <section className="expertise-card">
        <div className="expertise-heading">
          <div>
            <small>{t("journey.marketExpBadge")}</small>
            <h3>{t("journey.levelNumber", { level: marketLevel })}</h3>
          </div>
          <span>
            {t("journey.xpProgress", { current: game.expertise.marketXp, target: marketXpTarget })}
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
            ? t("journey.expPerkLevel3")
            : marketLevel < 6
              ? t("journey.expPerkLevel6")
              : t("journey.expPerkMax")}
        </p>
        <div className="category-levels">
          {Object.entries(game.expertise.categoryXp)
            .sort((left, right) => right[1] - left[1])
            .map(([category, xp]) => (
              <span key={category}>
                {localizeCategory(category, lang)} · {t("journey.categoryLevel")} {categoryExpertiseLevel(game, category)}{" "}
                <small>{xp} {t("meta.xp") || "xp"}</small>
              </span>
            ))}
        </div>
      </section>
      <div className="timeline-header timeline-header-collapsible">
        <div>
          <small>{t("journey.personalRecords")}</small>
          <h3>{t("journey.careerStory")}</h3>
        </div>
        <div className="timeline-summary">
          <span>{t("journey.careerMomentsCount", { count: game.career.length })}</span>
          <button
            className="timeline-toggle"
            type="button"
            aria-expanded={timelineExpanded}
            aria-controls="career-timeline-content"
            onClick={() => setTimelineExpanded((expanded) => !expanded)}
          >
            {timelineExpanded ? t("common.close") : t("common.open")}
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
                  {timelineFilterLabel(filter, lang)}
                </button>
              ),
            )}
          </div>
          {!timeline.length ? (
            <div className="empty compact-empty">
              <h3>{t("journey.noEventsInGroup")}</h3>
              <p>
                {t("journey.noEventsDesc")}
              </p>
            </div>
          ) : null}
          <div className="timeline">
            {visibleTimeline.map((event) => {
              const eventState = careerEventPresentation(
                event.group,
                game.gameTimeMin,
                event.atGameMin,
                lang,
              );
              const saleCopy = saleHistoryCopy(event, lang);
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
                    <b>{simplifyLegacyPlayerCopy(event.label, lang)}</b>
                    {saleCopy ? <p>{saleCopy}</p> : null}
                  </div>
                  {event.amountMinor !== undefined ? (
                    <em>{money(event.amountMinor, lang)}</em>
                  ) : null}
                </article>
              );
            })}
          </div>
          {timelinePages.pageCount > 1 ? (
            <div className="timeline-pagination" aria-label={t("journey.careerPagesAria")}>
              <button
                type="button"
                disabled={timelinePages.page === 0}
                onClick={() => setTimelinePage(timelinePages.page - 1)}
              >
                {t("common.previous")}
              </button>
              <span>
                {timelinePages.page + 1} / {timelinePages.pageCount}
              </span>
              <button
                type="button"
                disabled={timelinePages.page === timelinePages.pageCount - 1}
                onClick={() => setTimelinePage(timelinePages.page + 1)}
              >
                {t("common.next")}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
