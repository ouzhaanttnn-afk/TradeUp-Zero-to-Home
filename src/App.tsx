import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { App as CapacitorApp } from "@capacitor/app";
import "./App.css";
import { assetFor, fallbackAssetFor } from "./assets";
import {
  activeOwnedAssets,
  activePlayerListings,
  buyerCounterMinor,
  inventoryAssets,
  preparationAssets,
  quoteAssetExit,
  quoteAssetSale,
} from "./domain/economy";
import {
  comparableListings,
  inspectionOptions,
  instanceEstimateBand,
  listingEstimateBand,
} from "./domain/decision";
import { WORLD_CONFIG } from "./domain/config";
import { activeMarketEvent, radarSignal } from "./domain/marketEvents";
import { ftueCopy, isFtueActive } from "./domain/ftue";
import { categoryExpertiseLevel, marketExpertiseLevel } from "./domain/meta";
import {
  getRewardEligibility,
  hasPremiumEntitlement,
} from "./domain/monetization";
import { activeMarketListings, npcRiskSignal } from "./domain/world";
import { nextLadderHome } from "./content/homes";
import {
  HOME_GOAL_MINOR,
  money,
  signal,
  signedMoney,
  wealth,
  type PlayerOfferMode,
} from "./game";
import { useGameStore } from "./stores/gameStore";
import { useTapHaptics } from "./hooks/useTapHaptics";
import { Icon, type IconName } from "./ui/Icon";
import { getSellerQuote, getBuyerQuote } from "./domain/dialogues";
import { isShowcaseItem } from "./domain/showcase";
import ShowcaseRoom from "./ui/ShowcaseRoom";
import { evidencePresentation } from "./ui/evidencePresentation";
import { ownershipPresentation } from "./ui/ownershipPresentation";
import { latestSaleResult } from "./ui/saleResult";
import { formatEstimate, wealthPresentation } from "./ui/wealthPresentation";
import {
  comparisonPresentation,
  sellerLabel,
} from "./ui/comparisonPresentation";
import { preparationPresentation } from "./ui/preparationPresentation";
import { listingActivity } from "./ui/listingActivity";
import { purchaseDecisionCause } from "./ui/decisionCause";
import {
  ALL_MARKET_CATEGORIES,
  filterMarketListings,
  marketCategories,
  sortMarketListings,
  type MarketSort,
} from "./ui/marketCard";
import { purchaseBudget } from "./ui/purchaseBudget";
import {
  manualListingPriceMinor,
  manualListingWaitCopy,
} from "./ui/manualListingPrice";
import { homeAtmosphereStage, homeGoldPercent } from "./ui/homeAtmosphere";
import { marketScanRefillStatus, shortDuration } from "./ui/marketScan";
import { gameClockLabel } from "./ui/gameClock";
import { recoveryPlan } from "./ui/recoveryPlan";
import { ProductVisual } from "./ui/ProductVisual";
import { AvatarPortrait } from "./ui/AvatarPortrait";
import ProfileOnboarding from "./ui/ProfileOnboarding";
import { MarketListingCard } from "./ui/MarketListingCard";
import { useModalFocus } from "./ui/useModalFocus";
import {
  useTranslation,
  localizeCategory,
  localizeProduct,
  localizePreparation,
  localizeSeller,
  localizeConfidence,
  localizeBuyerPersona,
  localizeMarketEvent,
  localizeFtueStage,
  localizeFtueCopy,
  localizeInspection,
  localizeEvidence,
  localizeSignal,
  localizeNotice,
  currencySymbol,
} from "./i18n";

const loadSettingsPanel = () => import("./ui/SettingsPanel");
const loadFollowPanel = () => import("./ui/FollowPanel");
const loadJourneyPanel = () => import("./ui/JourneyPanel");
const loadRadarPanel = () => import("./ui/RadarPanel");
const loadPurchasesSheet = () => import("./ui/PurchasesSheet");
const SettingsPanel = lazy(loadSettingsPanel);
const HomeFinale = lazy(() => import("./ui/HomeFinale"));
const FollowPanel = lazy(loadFollowPanel);
const JourneyPanel = lazy(loadJourneyPanel);
const RadarPanel = lazy(loadRadarPanel);
const PurchasesSheet = lazy(loadPurchasesSheet);

type Tab = "market" | "radar" | "portfolio" | "journey";
type PortfolioSegment = "inventory" | "preparation" | "listings";

export function StartupSkeleton() {
  const { t } = useTranslation();
  return (
    <div
      className="startup-shell"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={t("startup.loadingSave") || "Kayıt yükleniyor"}
    >
      <div className="startup-art" aria-hidden="true" />
      <div className="startup-brand">
        <span className="startup-brand__mark" aria-hidden="true">
          ↗
        </span>
        <h1>TRADEUP</h1>
        <p>ZERO TO HOME</p>
      </div>
      <div className="startup-progress">
        <span className="startup-progress__spinner" aria-hidden="true" />
        <p>{t("startup.preparingCareer") || "Kariyerin hazırlanıyor"}</p>
      </div>
    </div>
  );
}

export default function App() {
  useTapHaptics();
  const { t, lang } = useTranslation();

  const evidenceLabel = (confidence: number) =>
    localizeConfidence(confidence, lang);

  const offerModeOptions: Array<{
    mode: PlayerOfferMode;
    label: string;
    detail: string;
  }> = [
    {
      mode: "AGGRESSIVE",
      label: t("offerMode.aggressiveLabel") || "Sert",
      detail: t("offerMode.aggressiveDetail") || "Yüksek risk",
    },
    {
      mode: "BALANCED",
      label: t("offerMode.balancedLabel") || "Dengeli",
      detail: t("offerMode.balancedDetail") || "Orta yol",
    },
    {
      mode: "SAFE",
      label: t("offerMode.safeLabel") || "Güvenli",
      detail: t("offerMode.safeDetail") || "Kabul şansı daha yüksek",
    },
  ];

  const rewardCopy = {
    MARKET_SCOUT: {
      ad: t("reward.marketScoutAd") || "25 tarama hakkı · Video",
      premium: t("reward.marketScoutPremium") || "25 tarama hakkını yenile",
    },
    FAST_INSPECTION: {
      ad: t("reward.fastInspectionAd") || "İncelemeyi şimdi bitir · Video",
      premium: t("reward.fastInspectionPremium") || "İncelemeyi şimdi bitir",
    },
    FAST_PREPARATION: {
      ad: t("reward.fastPreparationAd") || "Hazırlığı şimdi bitir · Video",
      premium: t("reward.fastPreparationPremium") || "Hazırlığı şimdi bitir",
    },
    LISTING_REACH: {
      ad: t("reward.boostListingAd") || "İlanı bir kez öne çıkar · Video",
      premium: t("reward.boostListingPremium") || "Premium erişim hakkını kullan",
    },
  } as const;
  const [tab, setTab] = useState<Tab>("market");
  const [portfolioSegment, setPortfolioSegment] =
    useState<PortfolioSegment>("inventory");
  const [marketCategory, setMarketCategory] = useState(ALL_MARKET_CATEGORIES);
  const [marketSort, setMarketSort] = useState<MarketSort>("MARKET");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [comparing, setComparing] = useState(false);
  const [purchaseFeedback, setPurchaseFeedback] = useState("");
  const [evidenceExpanded, setEvidenceExpanded] = useState(false);
  const [purchaseOfferMode, setPurchaseOfferMode] =
    useState<PlayerOfferMode>("BALANCED");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsReturnTab, setSettingsReturnTab] = useState<Tab>("market");
  const [quickSaleAssetId, setQuickSaleAssetId] = useState<string | null>(null);
  const [listingStrategyAssetId, setListingStrategyAssetId] = useState<
    string | null
  >(null);
  const [manualListingAssetId, setManualListingAssetId] = useState<
    string | null
  >(null);
  const [manualListingPrice, setManualListingPrice] = useState("");
  const [revisingListingId, setRevisingListingId] = useState<string | null>(
    null,
  );
  const [revisedListingPrice, setRevisedListingPrice] = useState("");
  const [focusedAssetId, setFocusedAssetId] = useState<string | null>(null);
  const [homeFinaleOpen, setHomeFinaleOpen] = useState(false);
  const [homePulseStage, setHomePulseStage] = useState<number | null>(null);
  const [wallClockNow, setWallClockNow] = useState(() => Date.now());
  const [followSheetOpen, setFollowSheetOpen] = useState(false);
  const [purchasesBubbleOpen, setPurchasesBubbleOpen] = useState(false);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const restoreSettingsFocusRef = useRef(false);
  const sheetCloseRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLElement>(null);
  const followSheetCloseRef = useRef<HTMLButtonElement>(null);
  const followSheetRef = useRef<HTMLElement>(null);
  const comparisonRef = useRef<HTMLDivElement>(null);
  const homeFinaleButtonRef = useRef<HTMLButtonElement>(null);
  const previousHomeStageRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!comparing) return;
    const frame = requestAnimationFrame(() =>
      comparisonRef.current?.scrollIntoView({
        block: "start",
        behavior: "instant",
      }),
    );
    return () => cancelAnimationFrame(frame);
  }, [comparing, selectedId]);
  const {
    game,
    ready,
    sessionActive,
    notice,
    monetizationBusy,
    hydrate,
    pause,
    resume,
    scan,
    refreshMarketScanCredits,
    tick,
    buy,
    buyHome,
    offer,
    sell,
    list,
    reviseListing,
    withdrawListing,
    acceptBuyer,
    counterBuyer,
    rejectBuyer,
    inspect,
    prepare,
    openListing,
    markCompared,
    dismissCoach,
    toggleWatch,
    saveSearch,
    removeSearch,
    recordImpressions,
    openJourney,
    completeProfileOnboarding,
    restorePurchases,
    claimReward,
    storeProducts,
    purchaseProduct,
    openPurchases,
    showPrivacyOptions,
    showcaseAssetIds,
    specialization,
    toggleShowcase,
    setSpecialization,
  } = useGameStore();

  const openSettingsPanel = useCallback(() => {
    setSettingsReturnTab(tab);
    setSettingsOpen(true);
    setTab("journey");
  }, [tab]);
  const closeSettingsPanel = useCallback(() => {
    restoreSettingsFocusRef.current = true;
    setSettingsOpen(false);
    setTab(settingsReturnTab);
  }, [settingsReturnTab]);

  useEffect(() => {
    if (settingsOpen || !restoreSettingsFocusRef.current) return;
    restoreSettingsFocusRef.current = false;
    settingsButtonRef.current?.focus();
  }, [settingsOpen]);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);
  useEffect(() => {
    if (!ready || !sessionActive) return undefined;
    const timer = window.setInterval(tick, WORLD_CONFIG.activeTickMin * 60_000);
    return () => window.clearInterval(timer);
  }, [ready, sessionActive, tick]);
  useEffect(() => {
    let disposed = false;
    let removeListener: (() => Promise<void>) | undefined;
    void CapacitorApp.addListener("appStateChange", ({ isActive }) => {
      if (isActive) void resume();
      else void pause();
    }).then((handle) => {
      if (disposed) void handle.remove();
      else removeListener = () => handle.remove();
    });
    return () => {
      disposed = true;
      if (removeListener) void removeListener();
    };
  }, [pause, resume]);
  useModalFocus(selectedId !== null, sheetRef, sheetCloseRef, () =>
    setSelectedId(null),
  );
  useModalFocus(followSheetOpen, followSheetRef, followSheetCloseRef, () =>
    setFollowSheetOpen(false),
  );

  useEffect(() => {
    if (tab !== "portfolio" || !focusedAssetId) return;
    const frame = window.requestAnimationFrame(() => {
      const card = document.getElementById(`owned-${focusedAssetId}`);
      card?.focus({ preventScroll: true });
      card?.scrollIntoView({ block: "start", behavior: "instant" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [tab, portfolioSegment, focusedAssetId]);

  const total = wealth(game);
  const marketEvent = activeMarketEvent(game.seed, game.gameTimeMin);
  const radarSignalNow = radarSignal(game.seed, game.gameTimeMin);
  const scanRefill = marketScanRefillStatus(game, wallClockNow);
  useEffect(() => {
    if (tab !== "market" || scanRefill.full) return undefined;
    const timer = window.setInterval(() => {
      setWallClockNow(Date.now());
      refreshMarketScanCredits();
    }, 1_000);
    return () => window.clearInterval(timer);
  }, [refreshMarketScanCredits, scanRefill.full, tab]);
  const marketListings = useMemo(() => activeMarketListings(game), [game]);
  const marketCategoryOptions = useMemo(
    () => marketCategories(marketListings),
    [marketListings],
  );
  const activeMarketCategory =
    marketCategory === ALL_MARKET_CATEGORIES ||
    marketCategoryOptions.includes(marketCategory)
      ? marketCategory
      : ALL_MARKET_CATEGORIES;
  const visibleMarketListings = sortMarketListings(
    filterMarketListings(marketListings, activeMarketCategory),
    marketSort,
  );
  const impressionKey = marketListings.map((listing) => listing.id).join("|");
  useEffect(() => {
    if (ready && impressionKey)
      recordImpressions(impressionKey.split("|").filter(Boolean));
  }, [impressionKey, ready, recordImpressions]);

  const selected =
    marketListings.find((listing) => listing.id === selectedId) ?? null;
  const comparables =
    selected && comparing ? comparableListings(game, selected.id) : [];
  const compareRows = comparisonPresentation(
    comparables,
    selected
      ? categoryExpertiseLevel(game, selected.instance.family.category)
      : 0,
    lang,
  );
  const inventory = inventoryAssets(game);
  const workshop = preparationAssets(game);
  const playerListings = activePlayerListings(game).flatMap((playerListing) => {
    const asset = game.ownedAssets.find(
      (item) => item.id === playerListing.ownedAssetId,
    );
    if (!asset) return [];
    const estimate = instanceEstimateBand(
      asset.instance,
      categoryExpertiseLevel(game, asset.instance.family.category),
    );
    return [
      {
        listing: playerListing,
        asset,
        activity: listingActivity(
          playerListing,
          game.buyerOffers,
          game.gameTimeMin,
          {
            estimateLowMinor: estimate.lowMinor,
            estimateHighMinor: estimate.highMinor,
            evidenceConfidence: asset.instance.evidenceConfidence,
            demand: asset.instance.family.demand,
            competingListings: marketListings.filter(
              (listing) => listing.familyId === asset.familyId,
            ).length,
          },
          lang,
        ),
      },
    ];
  });
  const pendingBuyerOfferCount = playerListings.reduce(
    (count, entry) => count + entry.activity.offers.length,
    0,
  );
  const latestSale = latestSaleResult(game, lang);
  const negotiating = selected
    ? (game.negotiations[selected.id] ??
      (game.negotiation?.listingId === selected.id
        ? game.negotiation
        : undefined))
    : undefined;
  const offers = negotiating?.offersRemaining ?? 2;
  const ftueActive = isFtueActive(game);
  const forceEvidenceOpen = ftueActive && game.ftue.stage !== "COMPARE";
  const budget = selected
    ? purchaseBudget(
        selected.priceMinor,
        game.cashMinor,
        negotiating,
        !ftueActive,
        purchaseOfferMode,
      )
    : null;
  const balanceCopy = (quote: {
    shortfallMinor: number;
    remainingMinor: number;
  }) =>
    quote.shortfallMinor
      ? t("wallet.buyingShortfall", { shortfall: money(quote.shortfallMinor, lang) })
      : t("wallet.buyingPower", { remaining: money(quote.remainingMinor, lang) });
  const premiumReward = hasPremiumEntitlement(game);
  const rewardProviderAvailable =
    premiumReward || game.monetization.consent.canRequestAds;
  const canClaimReward = (placementId: keyof typeof rewardCopy) =>
    rewardProviderAvailable && getRewardEligibility(game, placementId).ok;
  const rewardLabel = (placementId: keyof typeof rewardCopy) =>
    rewardCopy[placementId][premiumReward ? "premium" : "ad"];
  const coach = localizeFtueCopy(game.ftue.stage, ftueCopy[game.ftue.stage], lang);
  const showCoach =
    ftueActive && !game.ftue.dismissedStages.includes(game.ftue.stage);
  const startingOffer =
    game.ftue.stage === "STARTING_SALE"
      ? game.buyerOffers.find(
          (item) => item.id === "offer:ftue-starting-notebook",
        )
      : undefined;
  const marketLevel = marketExpertiseLevel(game);
  const estimates = wealthPresentation(game);
  const recovery = ftueActive ? null : recoveryPlan(game, lang);
  const homeLadderTarget = nextLadderHome(game.home);
  const homeProgress = !game.home.purchased
    ? Math.min(100, Math.floor((total / HOME_GOAL_MINOR) * 100))
    : homeLadderTarget
      ? Math.min(100, Math.floor((total / homeLadderTarget.priceMinor) * 100))
      : 100;
  const goldPercent = homeGoldPercent(
    total,
    HOME_GOAL_MINOR,
    game.home.purchased,
  );
  const atmosphereStage = homeAtmosphereStage(goldPercent);
  useEffect(() => {
    if (!ready) return undefined;
    const previous = previousHomeStageRef.current;
    previousHomeStageRef.current = atmosphereStage;
    if (previous === undefined || atmosphereStage <= previous) return undefined;
    setHomePulseStage(atmosphereStage);
    const timer = window.setTimeout(() => setHomePulseStage(null), 1_600);
    return () => window.clearTimeout(timer);
  }, [atmosphereStage, ready]);
  const finaleHighlights = useMemo(
    () =>
      (
        [
          "FIRST_SALE",
          "BEST_FLIP_UPDATED",
          "DOMINANT_CATEGORY_CHANGED",
        ] as const
      )
        .map((type) => game.career.findLast((event) => event.type === type))
        .filter((event) => event !== undefined),
    [game.career],
  );

  if (!ready) return <StartupSkeleton />;

  if (!game.profile.onboardingComplete) {
    return (
      <ProfileOnboarding
        game={game}
        monetizationBusy={monetizationBusy}
        notice={notice}
        onComplete={completeProfileOnboarding}
        onRestorePurchases={restorePurchases}
      />
    );
  }

  const selectListing = (listingId: string) => {
    setSelectedId(listingId);
    setComparing(false);
    setPurchaseFeedback("");
    setPurchaseOfferMode("BALANCED");
    setEvidenceExpanded(isFtueActive(game));
    openListing(listingId);
  };
  const toggleComparison = () => {
    if (!selected) return;
    const opening = !comparing;
    setComparing(opening);
    if (opening && comparableListings(game, selected.id).length >= 2)
      markCompared(selected.id);
  };
  const renderInspectionActions = () => (
    <div className="inspection-actions">
      {Object.entries(inspectionOptions).map(([kind, option]) => (
        <button
          key={kind}
          onClick={() => {
            if (!selected) return;
            inspect(selected.id, kind as keyof typeof inspectionOptions);
            const result = useGameStore.getState();
            setPurchaseFeedback(result.notice);
            if (ftueActive && result.game.ftue.stage === "NEGOTIATION")
              setComparing(false);
          }}
        >
          {localizeInspection(kind, option.label, lang)}
          <small>
            {option.durationMin
              ? `${option.durationMin} ${lang === "tr" ? "dk" : lang === "de" ? "Min." : "min"} · ${t("market.marketAdvances") || "pazar ilerler"}`
              : t("market.instant")}
          </small>
        </button>
      ))}
    </div>
  );
  const navigate = (nextTab: Tab) => {
    setTab(nextTab);
    if (nextTab === "portfolio" && pendingBuyerOfferCount > 0)
      setPortfolioSegment("listings");
    if (nextTab === "journey") openJourney();
  };
  const showOwnedAsset = (assetId: string, segment: PortfolioSegment) => {
    setSelectedId(null);
    setComparing(false);
    setQuickSaleAssetId(null);
    setListingStrategyAssetId(null);
    setManualListingAssetId(null);
    setFocusedAssetId(assetId);
    setPortfolioSegment(segment);
    setTab("portfolio");
  };
  const purchaseAndContinue = (listingId: string, command: () => unknown) => {
    const before = useGameStore.getState().game;
    command();
    const after = useGameStore.getState().game;
    const acquired = after.ownedAssets.find(
      (asset) =>
        asset.sourceListingId === listingId &&
        !before.ownedAssets.some((previous) => previous.id === asset.id),
    );
    if (acquired)
      showOwnedAsset(
        acquired.id,
        isFtueActive(after) ? "preparation" : "inventory",
      );
    else setPurchaseFeedback(useGameStore.getState().notice);
  };
  const listAndContinue = (item: (typeof inventory)[number], price: number) => {
    list(item, price);
    const updated = useGameStore
      .getState()
      .game.ownedAssets.find((asset) => asset.id === item.id);
    if (updated?.state === "LISTED") showOwnedAsset(item.id, "listings");
  };
  const firstAsset = game.ownedAssets.find(
    (asset) => asset.id === game.ftue.firstAssetId,
  );
  const coachSegment: PortfolioSegment | undefined =
    game.ftue.stage === "PREPARATION" ||
    (game.ftue.stage === "LISTING" && firstAsset?.state === "PREPARING")
      ? "preparation"
      : game.ftue.stage === "LISTING"
        ? "inventory"
        : game.ftue.stage === "BUYER_SALE"
          ? "listings"
          : undefined;
  const atCoachDestination =
    tab === "portfolio" &&
    (portfolioSegment === coachSegment ||
      (game.ftue.stage === "LISTING" && portfolioSegment === "preparation"));
  const showCoachHere =
    showCoach &&
    !(
      atCoachDestination &&
      (game.ftue.stage === "PREPARATION" || game.ftue.stage === "LISTING")
    ) &&
    !(
      tab === "portfolio" &&
      portfolioSegment === "listings" &&
      !playerListings.length &&
      latestSale
    );

  const renderInventoryCard = (
    item: (typeof inventory)[number],
    showPreparation: boolean,
  ) => {
    const quote = quoteAssetExit(item);
    const ownershipState = ownershipPresentation(item.state);
    const pendingPreparation = item.instance.preparationHistory.find(
      (record) => record.state === "IN_PROGRESS",
    );
    const availablePreparations = item.instance.family.preparation.filter(
      (action) =>
        item.instance.preparationHistory.filter(
          (record) => record.kind === action.kind,
        ).length < action.maxUses,
    );
    const inShowcase = isShowcaseItem(showcaseAssetIds, item.id);
    return (
      <article
        className={`owned${focusedAssetId === item.id ? " owned--focused" : ""}`}
        id={`owned-${item.id}`}
        tabIndex={-1}
        aria-label={localizeProduct(item.instance.family.id, item.instance.family.name, lang)}
        key={`${showPreparation ? "prep" : "stock"}:${item.id}`}
      >
        <ProductVisual instance={item.instance} className="owned-icon" />
        <div className="owned-copy">
          <div className="owned-title-row">
            <h3>{localizeProduct(item.instance.family.id, item.instance.family.name, lang)}</h3>
            <div className="owned-title-badges">
              {inShowcase ? (
                <span className="showcase-mini-badge" title={t("showcase.featured") || "Vitrinde"}>
                  <Icon name="star" />
                </span>
              ) : null}
              <span className={`asset-state ${ownershipState.tone}`}>
                {ownershipState.label}
              </span>
            </div>
          </div>
          <div className="owned-metrics">
            <div>
              <span>{t("portfolio.totalSpent")}</span>
              <b>{money(item.bookCostMinor, lang)}</b>
            </div>
            <div>
              <span>{t("portfolio.estimatedSale")}</span>
              <b>
                {money(quote.quickSaleMinor, lang)}–{money(quote.balancedAskingMinor, lang)}
              </b>
            </div>
          </div>
          <p className="owned-facts">
            {t("portfolio.evidenceConfidence")}: {evidenceLabel(item.instance.evidenceConfidence)}
            <span aria-hidden="true">·</span>
            {t("portfolio.liquiditySpeed")}: %
            {Math.round(
              (item.instance.family.liquidity +
                item.instance.liquidityBonusBps / 10_000) *
                100,
            )}
          </p>
          {focusedAssetId === item.id ? (
            <p className="decision-cause" role="status">
              <b>{t("portfolio.decisionCauseSummary")}</b>
              <span>{purchaseDecisionCause(game, item, lang)}</span>
            </p>
          ) : null}
        </div>
        <div className="sell-actions">
          {showPreparation && item.state === "PREPARING" ? (
            <p className="preparation-status" role="status">
              {pendingPreparation ? (
                <>
                  {localizePreparation(
                    pendingPreparation.kind,
                    item.instance.family.preparation.find(
                      (action) => action.kind === pendingPreparation.kind,
                    )?.label ?? t("portfolio.preparation"),
                    lang,
                  )}{" "}
                  {t("portfolio.prepInProgress", {
                    min: Math.max(
                      0,
                      pendingPreparation.completesAtGameMin - game.gameTimeMin,
                    ),
                  })}
                </>
              ) : (
                t("portfolio.prepNotFound")
              )}
            </p>
          ) : null}
          {showPreparation &&
          item.state !== "PREPARING" &&
          !availablePreparations.length ? (
            <p className="preparation-status">
              {t("portfolio.prepComplete")}
            </p>
          ) : null}
          {!ftueActive &&
          quickSaleAssetId !== item.id &&
          (item.state === "IN_INVENTORY" || item.state === "READY") ? (
            <div className="portfolio-card-actions">
              {!showPreparation && availablePreparations.length > 0 ? (
                <button
                  aria-label={t("portfolio.prepProduct")}
                  onClick={() => showOwnedAsset(item.id, "preparation")}
                >
                  {t("portfolio.prepare")}
                </button>
              ) : null}
              <button
                className="primary"
                type="button"
                aria-expanded={listingStrategyAssetId === item.id}
                aria-controls={`listing-strategies-${item.id}`}
                onClick={() => {
                  const opening = listingStrategyAssetId !== item.id;
                  setListingStrategyAssetId(opening ? item.id : null);
                  setManualListingAssetId(null);
                }}
              >
                {listingStrategyAssetId === item.id
                  ? t("portfolio.closeOptions")
                  : t("portfolio.putOnSale")}
              </button>
              <button
                type="button"
                className={`showcase-toggle-btn ${inShowcase ? "active" : ""}`}
                aria-label={inShowcase ? (t("showcase.remove") || "Vitrinden Kaldır") : (t("showcase.add") || "Vitrine Ekle")}
                onClick={() => toggleShowcase(item.id)}
              >
                <Icon name="star" /> {inShowcase ? (t("showcase.removeFromShowcase") || "Vitrinden Çıkar") : (t("showcase.addToShowcase") || "Vitrine Ekle")}
              </button>
            </div>
          ) : null}
          {(item.state === "IN_INVENTORY" || item.state === "READY") &&
          quickSaleAssetId !== item.id &&
          (ftueActive || listingStrategyAssetId === item.id) &&
          (!ftueActive || game.ftue.stage === "LISTING") ? (
            <div
              id={`listing-strategies-${item.id}`}
              className={`portfolio-next-action${ftueActive ? "" : " listing-strategies"}`}
            >
              <small>
                {ftueActive ? t("portfolio.nextStep") : t("portfolio.saleOptions")}
              </small>
              <b>
                {ftueActive
                  ? t("ftue.listBalanced")
                  : t("listing.howToSell")}
              </b>
              {ftueActive ? (
                <>
                  <span>
                    {t("portfolio.totalSpent")} {money(item.bookCostMinor, lang)} · {t("market.listingPrice")}{" "}
                    {money(quote.balancedAskingMinor, lang)}
                  </span>
                  <button
                    className="primary"
                    aria-label={`${t("listing.createListing")} · ${money(quote.balancedAskingMinor, lang)}`}
                    onClick={() =>
                      listAndContinue(item, quote.balancedAskingMinor)
                    }
                  >
                    {t("listing.createListing")} <b>{money(quote.balancedAskingMinor, lang)}</b>
                  </button>
                </>
              ) : (
                <>
                  <div className="listing-strategy-options">
                    <button
                      aria-label={`${t("listing.quickSale")} · ${money(quote.quickSaleMinor, lang)}`}
                      onClick={() => setQuickSaleAssetId(item.id)}
                    >
                      <b>{t("listing.fast")}</b>
                      <strong>{money(quote.quickSaleMinor, lang)}</strong>
                      <small>{t("listing.sellNow")}</small>
                    </button>
                    <button
                      className="primary"
                      aria-label={`${t("listing.createListing")} · ${money(quote.balancedAskingMinor, lang)}`}
                      onClick={() =>
                        listAndContinue(item, quote.balancedAskingMinor)
                      }
                    >
                      <b>{t("listing.balanced")}</b>
                      <strong>{money(quote.balancedAskingMinor, lang)}</strong>
                      <small>{t("listing.normalWait")}</small>
                    </button>
                    <button
                      onClick={() =>
                        listAndContinue(item, quote.premiumAskingMinor)
                      }
                    >
                      <b>{t("listing.high")}</b>
                      <strong>{money(quote.premiumAskingMinor, lang)}</strong>
                      <small>{t("listing.longerWait")}</small>
                    </button>
                  </div>
                  <button
                    className="manual-listing-toggle"
                    aria-expanded={manualListingAssetId === item.id}
                    onClick={() => {
                      if (manualListingAssetId === item.id) {
                        setManualListingAssetId(null);
                        return;
                      }
                      setManualListingAssetId(item.id);
                      setManualListingPrice(
                        String(quote.balancedAskingMinor / 100),
                      );
                    }}
                  >
                    {t("portfolio.setOwnPrice")}
                  </button>
                  {manualListingAssetId === item.id ? (
                    <form
                      className="manual-listing-form"
                      onSubmit={(event) => {
                        event.preventDefault();
                        const amount =
                          manualListingPriceMinor(manualListingPrice);
                        if (!amount) return;
                        listAndContinue(item, amount);
                      }}
                    >
                      <label>
                        <span>{t("listing.askingPrice")}</span>
                        <span className="manual-price-input">
                          {currencySymbol(lang)}
                          <input
                            value={manualListingPrice}
                            inputMode="decimal"
                            aria-label={t("portfolio.ownPriceAria")}
                            onChange={(event) =>
                              setManualListingPrice(event.target.value)
                            }
                          />
                        </span>
                      </label>
                      <small>
                        {manualListingPriceMinor(manualListingPrice)
                          ? manualListingWaitCopy(
                              manualListingPriceMinor(manualListingPrice)!,
                              quote.balancedAskingMinor,
                              quote.premiumAskingMinor,
                              lang,
                            )
                          : t("portfolio.validPriceWarning")}
                      </small>
                      <button
                        className="primary"
                        disabled={!manualListingPriceMinor(manualListingPrice)}
                        type="submit"
                      >
                        {t("listing.submitWithPrice")}
                      </button>
                    </form>
                  ) : null}
                </>
              )}
            </div>
          ) : null}
          {showPreparation &&
          item.state !== "PREPARING" &&
          availablePreparations.length > 0 ? (
            <details
              className="preparation-options"
              open={
                !item.instance.preparationHistory.some(
                  (record) => record.state === "COMPLETE",
                )
              }
            >
              <summary>
                {item.instance.preparationHistory.some(
                  (record) => record.state === "COMPLETE",
                )
                  ? t("portfolio.otherPreps")
                  : t("portfolio.howToPrep")}
              </summary>
              {!item.instance.preparationHistory.length ? (
                <p className="preparation-guide">
                  {t("portfolio.prepGuide")}
                </p>
              ) : null}
              <div className="sell-actions">
                {availablePreparations.map((action) => (
                  <button
                    className="preparation-action"
                    key={action.kind}
                    onClick={() => prepare(item.id, action.kind)}
                  >
                    <span className="preparation-action-title">
                      <b>{localizePreparation(action.kind, action.label, lang)}</b>
                      <strong>{money(action.costMinor, lang)}</strong>
                    </span>
                    <small>
                      {action.durationMin} {lang === "tr" ? "dk" : lang === "de" ? "Min." : "min"} ·{" "}
                      {preparationPresentation(item, action, lang).join(" · ")}
                    </small>
                  </button>
                ))}
              </div>
            </details>
          ) : null}
          {!ftueActive && quickSaleAssetId === item.id ? (
            <div
              className="quick-sale-confirm"
              role="group"
              aria-label={t("portfolio.quickSaleConfirmGroup")}
            >
              <strong>
                {quote.quickSaleProfitMinor >= 0 ? t("portfolio.netProfit") : t("portfolio.netLoss")}{" "}
                <span
                  className={quote.quickSaleProfitMinor < 0 ? "loss" : "profit"}
                >
                  {signedMoney(quote.quickSaleProfitMinor, lang)}
                </span>
              </strong>
              <small>
                {t("portfolio.saleAmount")} {money(quote.quickSaleMinor, lang)} · {t("portfolio.totalSpent")}{" "}
                {money(item.bookCostMinor, lang)}
              </small>
              <small>
                {t("portfolio.missedProfit")}{" "}
                {money(quote.estimatedPremiumGivenUpMinor, lang)}
              </small>
              <button
                className="primary"
                onClick={() => {
                  setQuickSaleAssetId(null);
                  sell(item, true);
                }}
              >
                {t("portfolio.confirmSale")} · {money(quote.quickSaleMinor, lang)}
              </button>
              <button
                className="text-button"
                onClick={() => setQuickSaleAssetId(null)}
              >
                {t("common.cancel") || "Vazgeç"}
              </button>
            </div>
          ) : null}
        </div>
      </article>
    );
  };

  return (
    <div
      className={`app-shell tab-${tab}${game.accessibility.reducedMotion ? " reduced-motion" : ""}${game.accessibility.largeText ? " large-text" : ""}${game.home.purchased ? " home-complete" : ""}${homePulseStage !== null ? " home-atmosphere-pulse" : ""}`}
      style={
        {
          "--home-gold-progress": `${goldPercent / 100}`,
        } as CSSProperties
      }
    >
      {!settingsOpen ? (
        <header>
          <div className="brand-lockup">
            <span className="brand-mark" aria-hidden="true">
              ↑
            </span>
            <div>
              <span className="eyebrow">TRADEUP</span>
              <h1>Zero to Home</h1>
              <small className="game-clock">
                {gameClockLabel(game.gameTimeMin, lang)}
              </small>
            </div>
          </div>
          <button
            ref={settingsButtonRef}
            className="profile-settings-button"
            aria-expanded={settingsOpen}
            aria-label={t("header.settings")}
            onPointerEnter={() => void loadSettingsPanel()}
            onFocus={() => void loadSettingsPanel()}
            onClick={openSettingsPanel}
          >
            <AvatarPortrait
              avatarId={game.profile.avatarId}
              className="profile-header-avatar"
            />
            <Icon name="settings" />
          </button>
        </header>
      ) : null}

      {!settingsOpen ? (
        <section className="wallet" aria-label={t("wallet.finSummary")}>
          <div>
            <small>{t("wallet.cash")}</small>
            <strong>{money(game.cashMinor, lang)}</strong>
          </div>
          <div>
            <small>{t("wallet.netWorth")}</small>
            <strong>{formatEstimate(estimates.total, false, lang)}</strong>
          </div>
          {game.home.unlocked ? (
            <div
              className="goal"
              aria-label={t("wallet.homeJourneyPercent", { progress: homeProgress })}
            >
              <small>{t("wallet.homeGoal")} · %{homeProgress}</small>
              <span>
                <i style={{ width: `${homeProgress}%` }} />
              </span>
            </div>
          ) : null}
        </section>
      ) : null}

      {!settingsOpen ? (
        <div className="notice" role="status" key={notice}>
          {localizeNotice(notice, lang)}
        </div>
      ) : null}
      {!settingsOpen && showCoachHere ? (
        <aside className="coach" aria-label={t("coach.aria")}>
          <button onClick={dismissCoach} aria-label={t("common.close")}>
            <Icon name="close" />
          </button>
          <small>{t("coach.firstTrade")} · {localizeFtueStage(game.ftue.stage, lang)}</small>
          <h2>{coach.title}</h2>
          <p>{coach.body}</p>
          {firstAsset && coachSegment && !atCoachDestination ? (
            <button
              className="coach-next"
              onClick={() => showOwnedAsset(firstAsset.id, coachSegment)}
            >
              {t("coach.returnToProduct")}
            </button>
          ) : null}
        </aside>
      ) : null}
      {!settingsOpen && recovery ? (
        <aside className="recovery-bar" aria-label={t("recovery.aria")}>
          <div>
            <small>{t("recovery.kicker")}</small>
            <b>{recovery.title}</b>
          </div>
          <div className="recovery-actions">
            <button
              onClick={() => {
                setMarketCategory("Küçük Eşya");
                setMarketSort("PRICE_ASC");
                navigate("market");
              }}
            >
              {t("recovery.findSmallGoods")}
            </button>
            {recovery.canQuickSell ? (
              <button
                onClick={() => {
                  const candidate = inventory
                    .map((asset) => ({
                      asset,
                      proceeds: quoteAssetExit(asset).quickSaleMinor,
                    }))
                    .sort(
                      (left, right) => right.proceeds - left.proceeds,
                    )[0]?.asset;
                  if (!candidate) return;
                  showOwnedAsset(candidate.id, "inventory");
                  setQuickSaleAssetId(candidate.id);
                }}
              >
                {t("recovery.quickSale")}
              </button>
            ) : null}
            {recovery.canRevise ? (
              <button
                onClick={() => {
                  setPortfolioSegment("listings");
                  navigate("portfolio");
                }}
              >
                {t("recovery.editListing")}
              </button>
            ) : null}
          </div>
        </aside>
      ) : null}

      <main>
        {tab === "market" ? (
          <>
            {!settingsOpen ? (
              <div className="section-title">
                <div>
                  <small>{t("market.liveMarket")}</small>
                  <h2>{t("market.dealFeed")}</h2>
                </div>
                <div className="market-title-actions">
                  <span className="market-listing-count">
                    {visibleMarketListings.length} {t("market.itemsCount")}
                  </span>
                  <button
                    className="market-follow-entry"
                    onPointerEnter={() => void loadFollowPanel()}
                    onFocus={() => void loadFollowPanel()}
                    onClick={() => {
                      void loadFollowPanel();
                      setFollowSheetOpen(true);
                    }}
                    aria-label={`${t("market.followTab")}${game.follow.watchedListingIds.length ? ` · ${game.follow.watchedListingIds.length} ${t("market.itemsCount")}` : ""}`}
                  >
                    <Icon name="follow" />
                    {game.follow.watchedListingIds.length ? (
                      <span aria-hidden="true">
                        {game.follow.watchedListingIds.length}
                      </span>
                    ) : null}
                  </button>
                  {!ftueActive ? (
                    <>
                      <label
                        className={`market-sort${marketSort === "MARKET" ? "" : " market-sort--active"}`}
                        title={t("market.sortTitle")}
                      >
                        <Icon name="sort" />
                        <select
                          aria-label={t("market.sortAria")}
                          value={marketSort}
                          onChange={(event) =>
                            setMarketSort(event.target.value as MarketSort)
                          }
                        >
                          <option value="MARKET">{t("market.sortMarket")}</option>
                          <option value="PRICE_ASC">
                            {t("market.sortPriceAsc")}
                          </option>
                          <option value="PRICE_DESC">
                            {t("market.sortPriceDesc")}
                          </option>
                        </select>
                      </label>
                      {game.monetization.marketScanCredits === 0 &&
                      canClaimReward("MARKET_SCOUT") ? (
                        <button
                          className="market-refresh market-refresh--reward"
                          disabled={monetizationBusy}
                          onClick={() => void claimReward("MARKET_SCOUT")}
                          aria-label={rewardLabel("MARKET_SCOUT")}
                        >
                          <Icon name="refresh" />
                          <span className="market-refresh-copy">
                            <b>{t("market.refreshButton")}</b>
                            <small>
                              +25 · +1{" "}
                              {shortDuration(scanRefill.nextCreditSeconds)}
                            </small>
                          </span>
                        </button>
                      ) : (
                        <button
                          className="market-refresh"
                          disabled={game.monetization.marketScanCredits === 0}
                          onClick={scan}
                          aria-label={t("market.refreshAria", { credits: game.monetization.marketScanCredits })}
                        >
                          <Icon name="refresh" />
                          <span className="market-refresh-copy">
                            <b>{t("market.refreshButton")}</b>
                            <small>
                              {game.monetization.marketScanCredits}/
                              {scanRefill.cap}
                              {!scanRefill.full
                                ? ` · +1 ${shortDuration(scanRefill.nextCreditSeconds)}`
                                : ""}
                            </small>
                          </span>
                        </button>
                      )}
                    </>
                  ) : null}
                </div>
              </div>
            ) : null}
            {!ftueActive && marketEvent ? (
              <aside className="market-event" aria-label={t("market.eventAria")}>
                <span aria-hidden="true">↗</span>
                <div>
                  <small>{t("market.eventBadge")}</small>
                  <b>{localizeMarketEvent(marketEvent, lang).title}</b>
                  <p>{localizeMarketEvent(marketEvent, lang).message}</p>
                </div>
              </aside>
            ) : null}
            {!ftueActive && marketCategoryOptions.length > 1 ? (
              <div
                className="chips market-filters"
                role="group"
                aria-label={t("market.categoriesGroup")}
              >
                <button
                  className={
                    activeMarketCategory === ALL_MARKET_CATEGORIES
                      ? "active"
                      : ""
                  }
                  aria-pressed={activeMarketCategory === ALL_MARKET_CATEGORIES}
                  onClick={() => setMarketCategory(ALL_MARKET_CATEGORIES)}
                >
                  {t("market.all")}
                </button>
                {marketCategoryOptions.map((category) => (
                  <button
                    className={
                      activeMarketCategory === category ? "active" : ""
                    }
                    aria-pressed={activeMarketCategory === category}
                    key={category}
                    onClick={() => setMarketCategory(category)}
                  >
                    {localizeCategory(category, lang)}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="feed market-grid">
              {startingOffer ? (
                <article className="starting-sale">
                  <img
                    src={assetFor("prd_notebook")}
                    alt={localizeProduct("prd_notebook", "Eski defter", lang)}
                    onError={(event) => {
                      const fallback = fallbackAssetFor("Küçük Eşya");
                      if (event.currentTarget.src !== fallback)
                        event.currentTarget.src = fallback;
                    }}
                  />
                  <div>
                    <small>{t("market.startingKicker")}</small>
                    <h3>{localizeProduct("prd_notebook", "Eski defter", lang)}</h3>
                    <p>
                      {t("ftue.noCostGain", { amount: money(startingOffer.amountMinor, lang) })}
                    </p>
                    <button
                      className="primary"
                      onClick={() => acceptBuyer(startingOffer.id)}
                    >
                      {t("ftue.acceptOffer", { amount: money(startingOffer.amountMinor, lang) })}
                    </button>
                  </div>
                </article>
              ) : null}
              <Suspense fallback={<p role="status">{t("common.listingsLoading")}</p>}>
                {visibleMarketListings.map((item, index) => {
                  const categoryLevel = categoryExpertiseLevel(
                    game,
                    item.instance.family.category,
                  );
                  const itemSignal = signal(item, categoryLevel);
                  const risk = npcRiskSignal(item, game.gameTimeMin);
                  const watched = game.follow.watchedListingIds.includes(
                    item.id,
                  );
                  return (
                    <MarketListingCard
                      key={item.id}
                      item={item}
                      categoryLevel={categoryLevel}
                      itemSignal={itemSignal}
                      risk={risk}
                      watched={watched}
                      gameTimeMin={game.gameTimeMin}
                      priority={index < 6}
                      onSelect={() => selectListing(item.id)}
                    />
                  );
                })}
              </Suspense>
            </div>
          </>
        ) : null}
        {tab === "radar" ? (
          <Suspense fallback={<p role="status">{t("common.radarLoading")}</p>}>
            <RadarPanel
              game={game}
              signal={radarSignalNow}
              onOpenMarketCategory={(category) => {
                setMarketCategory(category);
                navigate("market");
              }}
            />
          </Suspense>
        ) : null}
        {tab === "portfolio" ? (
          <>
            <div className="section-title portfolio-title">
              <div>
                <small>{t("portfolio.heading")}</small>
                <h2>{t("portfolio.title")}</h2>
              </div>
            </div>
            <ShowcaseRoom
              game={game}
              showcaseAssetIds={showcaseAssetIds}
              onSelectAsset={(assetId) => {
                showOwnedAsset(assetId, "inventory");
              }}
              onToggleShowcase={toggleShowcase}
            />
            <div
              className="segments"
              role="tablist"
              aria-label={t("portfolio.segmentsAria")}
            >
              {(
                [
                  ["inventory", t("portfolio.inventory"), inventory.length],
                  ["preparation", t("portfolio.preparation"), workshop.length],
                  ["listings", t("portfolio.listings"), playerListings.length],
                ] as const
              ).map(([segment, label, count]) => (
                <button
                  role="tab"
                  aria-selected={portfolioSegment === segment}
                  aria-controls="portfolio-panel"
                  className={portfolioSegment === segment ? "active" : ""}
                  key={segment}
                  onClick={() => setPortfolioSegment(segment)}
                >
                  <span>{label}</span>
                  <b aria-hidden="true">{count}</b>
                </button>
              ))}
            </div>
            {portfolioSegment !== "listings" &&
            !(portfolioSegment === "preparation"
              ? workshop.length
              : inventory.length) ? (
              <div className="empty">
                <span className="empty-icon">
                  <Icon name="portfolio" />
                </span>
                <h3>
                  {activeOwnedAssets(game).length
                    ? t("portfolio.emptySegment")
                    : t("portfolio.emptyPortfolio")}
                </h3>
                <p>
                  {activeOwnedAssets(game).length
                    ? t("portfolio.emptySegmentDesc")
                    : t("portfolio.emptyPortfolioDesc")}
                </p>
                {workshop.some((asset) => asset.state === "PREPARING") ? (
                  <button onClick={() => setPortfolioSegment("preparation")}>
                    {t("portfolio.viewPrep")}
                  </button>
                ) : (
                  <button onClick={() => navigate("market")}>{t("portfolio.returnMarket")}</button>
                )}
              </div>
            ) : null}
            <div
              className="inventory-grid"
              id="portfolio-panel"
              role="tabpanel"
              aria-label={
                portfolioSegment === "inventory"
                  ? t("portfolio.inventory")
                  : portfolioSegment === "preparation"
                    ? t("portfolio.preparation")
                    : t("portfolio.listings")
              }
            >
              {portfolioSegment === "preparation" &&
              canClaimReward("FAST_PREPARATION") ? (
                <button
                  className="reward-cta"
                  disabled={monetizationBusy}
                  onClick={() => void claimReward("FAST_PREPARATION")}
                >
                  {rewardLabel("FAST_PREPARATION")}
                </button>
              ) : null}
              {portfolioSegment === "listings" &&
              canClaimReward("LISTING_REACH") ? (
                <button
                  className="reward-cta"
                  disabled={monetizationBusy}
                  onClick={() => void claimReward("LISTING_REACH")}
                >
                  {rewardLabel("LISTING_REACH")}
                </button>
              ) : null}
              {portfolioSegment === "inventory"
                ? inventory.map((item) => renderInventoryCard(item, false))
                : null}
              {portfolioSegment === "preparation"
                ? workshop.map((item) => renderInventoryCard(item, true))
                : null}
              {portfolioSegment === "listings"
                ? playerListings.map(
                    ({ listing: playerListing, asset, activity }) => {
                      const ownershipState = ownershipPresentation(asset.state, lang);
                      return (
                        <article
                          className={`owned owned--listing${focusedAssetId === asset.id ? " owned--focused" : ""}`}
                          key={playerListing.id}
                          id={`owned-${asset.id}`}
                          tabIndex={-1}
                          aria-label={localizeProduct(asset.instance.family.id, asset.instance.family.name, lang)}
                        >
                          <ProductVisual
                            instance={asset.instance}
                            className="owned-icon"
                          />
                          <div className="owned-copy">
                            <div className="owned-title-row">
                              <h3>{localizeProduct(asset.instance.family.id, asset.instance.family.name, lang)}</h3>
                              <span
                                className={`asset-state ${ownershipState.tone}`}
                              >
                                {ownershipState.label}
                              </span>
                            </div>
                            <div className="owned-metrics listing-metrics">
                              <div>
                                <span>{t("portfolio.totalSpent")}</span>
                                <b>{money(asset.bookCostMinor, lang)}</b>
                              </div>
                              <div>
                                <span>{t("market.listingPrice")}</span>
                                <b>{money(playerListing.askingPriceMinor, lang)}</b>
                              </div>
                              <div>
                                <span>{t("portfolio.interest")}</span>
                                <b>%{playerListing.interest}</b>
                              </div>
                            </div>
                          </div>
                          {activity.waiting ? (
                            <div
                              className="listing-wait"
                              role="group"
                              aria-label={t("portfolio.listingStatusAria")}
                            >
                              <div className="listing-wait-copy">
                                <b>
                                  {t("portfolio.publishedAge", {
                                    age: activity.ageLabel,
                                  })}
                                </b>
                                <span>{t("portfolio.liveWaitBuyer")}</span>
                                <span>
                                  {activity.remainingLabel} ·{" "}
                                  {t("portfolio.liveNotif")}
                                </span>
                                {activity.diagnosis ? (
                                  <span className="listing-diagnosis">
                                    {activity.diagnosis}
                                  </span>
                                ) : null}
                              </div>
                              <button onClick={() => navigate("market")}>
                                {t("portfolio.browseMarket")}
                              </button>
                            </div>
                          ) : null}
                          {activity.offers.map((buyerOffer) => {
                            const sale = quoteAssetSale(
                              asset,
                              buyerOffer.amountMinor,
                            );
                            const counterMinor = !buyerOffer.counterUsed
                              ? buyerCounterMinor(buyerOffer, playerListing)
                              : undefined;
                            const persona = buyerOffer.buyerType
                              ? localizeBuyerPersona(buyerOffer.buyerType, lang)
                              : undefined;
                            return (
                              <div
                                className="buyer-offer"
                                key={buyerOffer.id}
                                role="group"
                                aria-label={t("buyer.offerAria", {
                                  buyer: buyerOffer.buyer,
                                })}
                              >
                                <h4>
                                  {buyerOffer.buyer}{" "}
                                  {buyerOffer.counterUsed
                                    ? t("buyer.gaveFinal")
                                    : t("buyer.madeOffer")}
                                </h4>
                                {persona ? (
                                  <p className="buyer-persona">
                                    <b>{persona.label}</b>
                                    <span>{persona.tendency}</span>
                                  </p>
                                ) : null}
                                <div className="buyer-dialogue-quote">
                                  "{getBuyerQuote(buyerOffer.buyerType, buyerOffer.counterUsed ? "counter" : "initial", lang)}"
                                </div>
                                <dl className="sale-breakdown">
                                  <div>
                                    <dt>{t("buyer.amountProceeds")}</dt>
                                    <dd>{money(sale.proceedsMinor, lang)}</dd>
                                  </div>
                                  <div>
                                    <dt>{t("portfolio.totalSpent")}</dt>
                                    <dd>{money(sale.bookCostMinor, lang)}</dd>
                                  </div>
                                  <div
                                    className={
                                      sale.profitMinor < 0 ? "loss" : "profit"
                                    }
                                  >
                                    <dt>
                                      {sale.profitMinor < 0
                                        ? t("buyer.yourLoss")
                                        : sale.profitMinor > 0
                                          ? t("buyer.yourProfit")
                                          : t("saleResult.netResult")}
                                    </dt>
                                    <dd>{signedMoney(sale.profitMinor, lang)}</dd>
                                  </div>
                                </dl>
                                <p>
                                  {t("buyer.decisionTime", {
                                    min:
                                      buyerOffer.expiresAtGameMin -
                                      game.gameTimeMin,
                                  })}
                                </p>
                                <div
                                  className={`sell-actions${counterMinor === undefined ? "" : " buyer-actions"}`}
                                >
                                  <button
                                    className="primary"
                                    aria-label={t("common.accept")}
                                    onClick={() => acceptBuyer(buyerOffer.id)}
                                  >
                                    {t("common.accept")}
                                  </button>
                                  {counterMinor !== undefined ? (
                                    <button
                                      aria-label={t("buyer.counterAction", {
                                        amount: money(counterMinor, lang),
                                      })}
                                      onClick={() =>
                                        counterBuyer(buyerOffer.id)
                                      }
                                    >
                                      {money(counterMinor, lang)}{" "}
                                      {lang === "tr"
                                        ? "iste"
                                        : lang === "de"
                                          ? "fordern"
                                          : lang === "es"
                                            ? "pedir"
                                            : "ask"}
                                    </button>
                                  ) : null}
                                  <button
                                    aria-label={t("common.reject")}
                                    onClick={() => rejectBuyer(buyerOffer.id)}
                                  >
                                    {t("common.reject")}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                          {revisingListingId === playerListing.id ? (
                            <form
                              className="listing-revision-form"
                              onSubmit={(event) => {
                                event.preventDefault();
                                const amount =
                                  manualListingPriceMinor(revisedListingPrice);
                                if (!amount) return;
                                reviseListing(playerListing.id, amount);
                                setRevisingListingId(null);
                              }}
                            >
                              <label>
                                <span>{t("listing.newPrice")}</span>
                                <span className="manual-price-input">
                                  {currencySymbol(lang)}
                                  <input
                                    value={revisedListingPrice}
                                    inputMode="decimal"
                                    aria-label={t("listing.newPriceLabel", {
                                      product: localizeProduct(
                                        asset.instance.family.id,
                                        asset.instance.family.name,
                                        lang,
                                      ),
                                    })}
                                    onChange={(event) =>
                                      setRevisedListingPrice(event.target.value)
                                    }
                                  />
                                </span>
                              </label>
                              <button
                                className="primary"
                                type="submit"
                                disabled={
                                  !manualListingPriceMinor(revisedListingPrice)
                                }
                              >
                                {t("portfolio.applyPrice")}
                              </button>
                            </form>
                          ) : null}
                          <div className="sell-actions listing-withdraw-actions">
                            <button
                              disabled={activity.offers.length > 0}
                              title={
                                activity.offers.length > 0
                                  ? t("portfolio.answerPendingFirst")
                                  : undefined
                              }
                              onClick={() => {
                                setRevisingListingId(playerListing.id);
                                setRevisedListingPrice(
                                  String(playerListing.askingPriceMinor / 100),
                                );
                              }}
                            >
                              {t("portfolio.changePrice")}
                            </button>
                            <button
                              onClick={() => {
                                withdrawListing(playerListing.id);
                                if (
                                  useGameStore
                                    .getState()
                                    .game.ownedAssets.find(
                                      (item) => item.id === asset.id,
                                    )?.state === "IN_INVENTORY"
                                )
                                  showOwnedAsset(asset.id, "inventory");
                              }}
                            >
                              {t("portfolio.withdrawListing")}
                            </button>
                          </div>
                        </article>
                      );
                    },
                  )
                : null}
            </div>
            {portfolioSegment === "listings" &&
            !playerListings.length &&
            !game.buyerOffers.length ? (
              latestSale ? (
                <section className="sale-result" aria-label={t("saleResult.aria")}>
                  <div className="sale-result-copy" role="status">
                    <div className="sale-result-heading">
                      <ProductVisual
                        instance={latestSale.instance}
                        className="sale-result-art"
                        alt={localizeProduct(
                          latestSale.instance.family.id,
                          latestSale.assetName,
                          lang,
                        )}
                      />
                      <div>
                        <small>{t("saleResult.heading")}</small>
                        <h3>
                          {t("saleResult.soldTitle", {
                            product: localizeProduct(
                              latestSale.instance.family.id,
                              latestSale.assetName,
                              lang,
                            ),
                          })}
                        </h3>
                      </div>
                    </div>
                    <dl className="sale-breakdown">
                      <div>
                        <dt>{t("saleResult.accountCredit")}</dt>
                        <dd>{money(latestSale.proceedsMinor, lang)}</dd>
                      </div>
                      <div>
                        <dt>{t("portfolio.totalSpent")}</dt>
                        <dd>{money(latestSale.bookCostMinor, lang)}</dd>
                      </div>
                      <div
                        className={
                          latestSale.profitMinor < 0 ? "loss" : "profit"
                        }
                      >
                        <dt>
                          {latestSale.profitMinor < 0
                            ? t("saleResult.netLoss")
                            : latestSale.profitMinor > 0
                              ? t("saleResult.netProfit")
                              : t("saleResult.netResult")}
                        </dt>
                        <dd>{signedMoney(latestSale.profitMinor, lang)}</dd>
                      </div>
                    </dl>
                    <p className="decision-cause">
                      <b>{t("saleResult.summaryHeading")}</b>
                      <span>{latestSale.cause}</span>
                    </p>
                    <p>
                      {t("saleResult.moneyReady", {
                        amount: money(game.cashMinor, lang),
                      })}
                    </p>
                  </div>
                  <button
                    className="primary"
                    onClick={() => navigate("market")}
                  >
                    {t("saleResult.seeOpportunities")}
                  </button>
                </section>
              ) : (
                <div className="empty">
                  <span className="empty-icon">
                    <Icon name="portfolio" />
                  </span>
                  <h3>{t("portfolio.noActiveListing")}</h3>
                  <p>{t("portfolio.pickAndList")}</p>
                  <button
                    onClick={() =>
                      inventory.length
                        ? setPortfolioSegment("inventory")
                        : navigate("market")
                    }
                  >
                    {inventory.length
                      ? t("portfolio.viewProducts")
                      : t("portfolio.returnMarket")}
                  </button>
                </div>
              )
            ) : null}
          </>
        ) : null}
        {tab === "journey" ? (
          settingsOpen ? (
            <Suspense
              fallback={
                <section className="settings-card" role="status">
                  <div className="settings-sheet-heading">
                    <div>
                      <small>{t("settings.heading")}</small>
                      <h2>{t("settings.title")}</h2>
                    </div>
                  </div>
                  <p className="settings-loading">{t("common.settingsLoading")}</p>
                </section>
              }
            >
              <SettingsPanel onClose={closeSettingsPanel} />
            </Suspense>
          ) : (
            <Suspense fallback={<p role="status">{t("common.journeyLoading")}</p>}>
              <JourneyPanel
                game={game}
                homeProgress={homeProgress}
                onBuyHome={(homeId) => {
                  const wasFirstHome = !game.home.purchasedHomeId;
                  if (buyHome(homeId) && wasFirstHome) setHomeFinaleOpen(true);
                }}
                onOpenPortfolio={() => navigate("portfolio")}
                specialization={specialization}
                onSelectSpecialization={setSpecialization}
              />
            </Suspense>
          )
        ) : null}{" "}
      </main>

      {!settingsOpen ? (
        <nav aria-label={t("nav.mainSections")}>
          {(
            [
              ["market", "home", t("nav.market")],
              ["radar", "radar", t("nav.radar")],
              ["portfolio", "portfolio", t("nav.portfolio")],
              ["journey", "journey", t("nav.journey")],
            ] as const satisfies ReadonlyArray<readonly [Tab, IconName, string]>
          ).map(([item, icon, label]) => (
            <button
              className={tab === item ? "active" : ""}
              key={item}
              onPointerEnter={
                item === "radar"
                  ? () => void loadRadarPanel()
                  : item === "journey"
                    ? () => void loadJourneyPanel()
                    : undefined
              }
              onFocus={
                item === "radar"
                  ? () => void loadRadarPanel()
                  : item === "journey"
                    ? () => void loadJourneyPanel()
                    : undefined
              }
              onClick={() => navigate(item)}
              aria-label={label}
              aria-describedby={
                item === "portfolio" && pendingBuyerOfferCount > 0
                  ? "pending-buyer-offers"
                  : item === "radar" && radarSignalNow
                    ? "radar-signal-active"
                    : undefined
              }
              aria-current={tab === item ? "page" : undefined}
            >
              <span className="nav-icon">
                <Icon name={icon} />
              </span>
              <span className="nav-label">{label}</span>
              {item === "radar" && radarSignalNow ? (
                <>
                  <span className="nav-dot" aria-hidden="true" />
                  <span id="radar-signal-active" className="sr-only">
                    {radarSignalNow.headline}:{" "}
                    {radarSignalNow.categories.join(", ")}
                  </span>
                </>
              ) : null}
              {item === "portfolio" && pendingBuyerOfferCount > 0 ? (
                <>
                  <span className="nav-offer-count" aria-hidden="true">
                    {pendingBuyerOfferCount}
                  </span>
                  <span id="pending-buyer-offers" className="sr-only">
                    {t("buyer.pendingOffersNotice", { count: pendingBuyerOfferCount })}
                  </span>
                </>
              ) : null}
            </button>
          ))}
        </nav>
      ) : null}

      {!settingsOpen ? (
        <button
          type="button"
          className="purchases-bubble"
          onPointerEnter={() => void loadPurchasesSheet()}
          onFocus={() => void loadPurchasesSheet()}
          onClick={() => {
            void loadPurchasesSheet();
            void openPurchases();
            setPurchasesBubbleOpen(true);
          }}
          aria-label={t("settings.purchases")}
        >
          <Icon name="basket" />
        </button>
      ) : null}

      {purchasesBubbleOpen ? (
        <Suspense fallback={<p role="status">{t("common.storeLoading")}</p>}>
          <PurchasesSheet
            game={game}
            storeProducts={storeProducts}
            monetizationBusy={monetizationBusy}
            purchaseProduct={purchaseProduct}
            restorePurchases={restorePurchases}
            showPrivacyOptions={showPrivacyOptions}
            onClose={() => setPurchasesBubbleOpen(false)}
          />
        </Suspense>
      ) : null}

      {homeFinaleOpen ? (
        <Suspense fallback={null}>
          <HomeFinale
            highlights={finaleHighlights}
            homeId={game.home.purchasedHomeId}
            buttonRef={homeFinaleButtonRef}
            onClose={() => setHomeFinaleOpen(false)}
          />
        </Suspense>
      ) : null}

      {selected ? (
        <div className="scrim" onClick={() => setSelectedId(null)}>
          <section
            ref={sheetRef}
            className="sheet"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="listing-detail-title"
          >
            <div className="sheet-scroll">
              <div className="grab" aria-hidden="true" />
              <button
                ref={sheetCloseRef}
                className="close"
                onClick={() => setSelectedId(null)}
                aria-label={t("common.close")}
              >
                <Icon name="close" />
              </button>
              <div className="sheet-hero-shell">
                <ProductVisual
                  instance={selected.instance}
                  className="hero-art"
                  alt={localizeProduct(
                    selected.instance.family.id,
                    selected.instance.family.name,
                    lang,
                  )}
                  priority
                />
                <span className="sheet-category">
                  {localizeCategory(selected.instance.family.category, lang)}
                </span>
              </div>
              <div className="sheet-summary">
                <div className="sheet-title">
                  <small>
                    {localizeSeller(
                      selected.seller,
                      sellerLabel[selected.seller],
                      lang,
                    )}{" "}
                    {t("market.seller")}
                  </small>
                  <h2 id="listing-detail-title">
                    {localizeProduct(
                      selected.instance.family.id,
                      selected.instance.family.name,
                      lang,
                    )}
                  </h2>
                </div>
                <div className="seller-dialogue-bubble">
                  <span className="seller-dialogue-tag">
                    💬 {localizeSeller(selected.seller, sellerLabel[selected.seller], lang)}
                  </span>
                  <p>"{getSellerQuote(selected.seller, "greeting", lang)}"</p>
                </div>
                <div className="detail-price">
                  <div>
                    <small>{t("market.listingPrice")}</small>
                    <strong>{money(selected.priceMinor, lang)}</strong>
                  </div>
                  <span
                    className={
                      signal(
                        selected,
                        categoryExpertiseLevel(
                          game,
                          selected.instance.family.category,
                        ),
                      ).cls
                    }
                  >
                    {
                      localizeSignal(
                        signal(
                          selected,
                          categoryExpertiseLevel(
                            game,
                            selected.instance.family.category,
                          ),
                        ).text,
                        lang,
                      )
                    }
                  </span>
                </div>
              </div>
              <div className="sheet-follow-actions">
                <button
                  className={
                    game.follow.watchedListingIds.includes(selected.id)
                      ? "active-watch"
                      : ""
                  }
                  onClick={() => toggleWatch(selected.id)}
                >
                  <Icon name="follow" />
                  {game.follow.watchedListingIds.includes(selected.id)
                    ? t("sheet.unfollow")
                    : t("sheet.follow")}
                </button>
                {marketLevel >= 3 ? (
                  <button
                    onClick={() =>
                      saveSearch(
                        selected.familyId,
                        selected.priceMinor,
                        selected.instance.condition,
                        "ANY",
                      )
                    }
                  >
                    {t("sheet.setAlarm")}
                  </button>
                ) : (
                  <span>{t("sheet.alarmLevel3")}</span>
                )}
              </div>
              <div className="band">
                <div>
                  <span>{t("sheet.estPriceRange")}</span>
                  <b>
                    {money(
                      listingEstimateBand(
                        selected,
                        categoryExpertiseLevel(
                          game,
                          selected.instance.family.category,
                        ),
                      ).lowMinor,
                      lang,
                    )}{" "}
                    –{" "}
                    {money(
                      listingEstimateBand(
                        selected,
                        categoryExpertiseLevel(
                          game,
                          selected.instance.family.category,
                        ),
                      ).highMinor,
                      lang,
                    )}
                  </b>
                </div>
                <i>
                  <em
                    style={{
                      left: `${Math.max(
                        4,
                        Math.min(
                          94,
                          (selected.priceMinor /
                            (listingEstimateBand(
                              selected,
                              categoryExpertiseLevel(
                                game,
                                selected.instance.family.category,
                              ),
                            ).highMinor || 1)) *
                            100,
                        ),
                      )}%`,
                    }}
                  />
                </i>
              </div>
              <div className="details">
                <div>
                  <span>{t("market.conditionLabel") || (lang === "tr" ? "Kondisyon" : "Condition")}</span>
                  <b>{lang === "tr" ? `%${selected.instance.condition}` : `${selected.instance.condition}%`}</b>
                </div>
                <div>
                  <span>{t("portfolio.evidenceConfidence")}</span>
                  <b>{evidenceLabel(selected.instance.evidenceConfidence)}</b>
                </div>
                <div>
                  <span>{t("sheet.negotiationRights")}</span>
                  <b aria-label={t("sheet.negotiationRemaining", { count: offers })}>
                    {"● ".repeat(offers)}
                    {"○ ".repeat(2 - offers)}
                  </b>
                </div>
              </div>
              <section className="evidence-panel">
                <button
                  className="evidence-toggle"
                  aria-expanded={evidenceExpanded || forceEvidenceOpen}
                  onClick={() =>
                    !forceEvidenceOpen &&
                    setEvidenceExpanded((expanded) => !expanded)
                  }
                >
                  <span>
                    <small>{t("sheet.productChecks")}</small>
                    <b>
                      {t("portfolio.evidenceConfidence")} %
                      {Math.round(selected.instance.evidenceConfidence * 100)}
                    </b>
                  </span>
                  <span aria-hidden="true">
                    {evidenceExpanded || forceEvidenceOpen ? "−" : "+"}
                  </span>
                </button>
                {evidenceExpanded || forceEvidenceOpen ? (
                  <div className="evidence-content">
                    {selected.instance.evidence.map((record) => {
                      const definition = selected.instance.family.evidence.find(
                        (item) => item.id === record.definitionId,
                      );
                      const evidenceState = evidencePresentation(record.status, lang);
                      return (
                        <p className="evidence-row" key={record.definitionId}>
                          <b>{localizeEvidence(definition?.label ?? "", lang)}</b>
                          <span
                            className={`evidence-state ${evidenceState.tone}`}
                          >
                            {evidenceState.label}
                          </span>
                        </p>
                      );
                    })}
                    {!ftueActive ? renderInspectionActions() : null}
                    {canClaimReward("FAST_INSPECTION") ? (
                      <button
                        className="reward-cta"
                        disabled={monetizationBusy}
                        onClick={() => void claimReward("FAST_INSPECTION")}
                      >
                        {rewardLabel("FAST_INSPECTION")}
                      </button>
                    ) : null}
                    {!ftueActive || game.ftue.stage !== "COMPARE" ? (
                      <button className="secondary" onClick={toggleComparison}>
                        {comparing
                          ? t("sheet.closeCompare")
                          : t("sheet.compareWithSimilar")}
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </section>
              {comparing ? (
                <div className="compare-stack" ref={comparisonRef}>
                  <h3>{t("sheet.comparablesTitle", { count: comparables.length })}</h3>
                  {comparables.length < 2 ? (
                    <p>
                      {t("sheet.comparablesEmpty")}
                    </p>
                  ) : (
                    <>
                      <p>
                        {t("sheet.comparablesNote")}
                      </p>
                      {comparables.map((item, index) => (
                        <section
                          className="compare-card"
                          key={item.id}
                          aria-label={t("sheet.listingNumber", { num: index + 1 })}
                        >
                          <h4>
                            {t("sheet.listingNumber", { num: index + 1 })} ·{" "}
                            {index === 0 ? t("sheet.activeListingLabel") : t("sheet.alternativeLabel")}
                          </h4>
                          <dl>
                            {compareRows.map((row) => (
                              <div
                                className={
                                  row.different
                                    ? "compare-row different"
                                    : "compare-row"
                                }
                                key={row.label}
                              >
                                <dt>
                                  {row.label}
                                  {row.different ? <small>{t("sheet.diffBadge")}</small> : null}
                                </dt>
                                <dd>{row.values[index]}</dd>
                              </div>
                            ))}
                          </dl>
                          {index > 0 ? (
                            <button
                              className="secondary"
                              onClick={() => selectListing(item.id)}
                            >
                              {t("sheet.openListingDetails", { num: index + 1 })}
                            </button>
                          ) : null}
                        </section>
                      ))}
                    </>
                  )}
                </div>
              ) : null}
            </div>
            <div
              className="sheet-decision"
              role="group"
              aria-label={t("sheet.purchaseSteps")}
            >
              <div className="sheet-decision-heading">
                <small>{t("sheet.yourDecision")}</small>
                <span>{t("sheet.cashAvailable", { cash: money(game.cashMinor, lang) })}</span>
              </div>
              {purchaseFeedback ? (
                <p className="sheet-feedback" role="status">
                  {localizeNotice(purchaseFeedback, lang)}
                </p>
              ) : null}
              {(!ftueActive || game.ftue.stage === "NEGOTIATION") &&
              offers === 1 &&
              !negotiating?.closed ? (
                <p className="sheet-step">
                  {t("sheet.lastOfferWarning")}
                </p>
              ) : null}
              {(!ftueActive || game.ftue.stage === "NEGOTIATION") &&
              budget?.counter ? (
                <button
                  className="counter-offer"
                  disabled={budget.counter.shortfallMinor > 0}
                  onClick={() => {
                    purchaseAndContinue(selected.id, () =>
                      buy(selected, budget.counter!.amountMinor),
                    );
                  }}
                >
                  {t("sheet.acceptCounter", { price: money(budget.counter.amountMinor, lang) })}
                  <small>{balanceCopy(budget.counter)}</small>
                </button>
              ) : null}
              {!ftueActive && budget?.offer ? (
                <div
                  className="offer-mode-picker"
                  role="group"
                  aria-label={t("sheet.offerStyleAria")}
                >
                  {offerModeOptions.map((option) => {
                    const amount = purchaseBudget(
                      selected.priceMinor,
                      game.cashMinor,
                      negotiating,
                      true,
                      option.mode,
                    ).offer?.amountMinor;
                    return (
                      <button
                        key={option.mode}
                        className={
                          purchaseOfferMode === option.mode ? "active" : ""
                        }
                        aria-pressed={purchaseOfferMode === option.mode}
                        onClick={() => setPurchaseOfferMode(option.mode)}
                      >
                        <b>{option.label}</b>
                        <strong>{amount ? money(amount, lang) : "—"}</strong>
                        <small>{option.detail}</small>
                      </button>
                    );
                  })}
                </div>
              ) : null}
              {!ftueActive || game.ftue.stage === "NEGOTIATION" ? (
                <>
                  <div className="sheet-actions">
                    <button
                      className={
                        ftueActive ||
                        (budget?.offer?.shortfallMinor === 0 &&
                          budget.direct?.shortfallMinor)
                          ? "primary"
                          : ""
                      }
                      disabled={
                        !budget?.offer || budget.offer.shortfallMinor > 0
                      }
                      onClick={() =>
                        purchaseAndContinue(selected.id, () =>
                          offer(
                            selected,
                            ftueActive ? "BALANCED" : purchaseOfferMode,
                          ),
                        )
                      }
                    >
                      {t("sheet.negotiateButton")}
                      {!ftueActive
                        ? ` · ${offerModeOptions.find((option) => option.mode === purchaseOfferMode)?.label}`
                        : ""}
                      {budget?.offer ? (
                        <>
                          <small>
                            {t("sheet.offerTriesRemaining", {
                              amount: money(budget.offer.amountMinor, lang),
                              offers,
                            })}
                          </small>
                          <small>{balanceCopy(budget.offer)}</small>
                        </>
                      ) : (
                        <small>{t("sheet.negotiationClosed")}</small>
                      )}
                    </button>
                    {budget?.direct ? (
                      <button
                        className={
                          budget.direct.shortfallMinor ? "" : "primary"
                        }
                        disabled={budget.direct.shortfallMinor > 0}
                        onClick={() =>
                          purchaseAndContinue(selected.id, () => buy(selected))
                        }
                      >
                        {t("sheet.buyDirect")}{" "}
                        <small>{money(budget.direct.amountMinor, lang)}</small>
                        <small>{balanceCopy(budget.direct)}</small>
                      </button>
                    ) : null}
                  </div>
                  {budget && budget.shortfallMinor > 0 ? (
                    <div className="cash-shortfall">
                      <p>
                        {t("sheet.cashShortfall", { amount: money(budget.shortfallMinor, lang) })}
                      </p>
                      <button
                        onClick={() => {
                          setSelectedId(null);
                          navigate("portfolio");
                          setPortfolioSegment("inventory");
                        }}
                      >
                        {t("sheet.viewInventoryToSell")}
                      </button>
                    </div>
                  ) : null}
                </>
              ) : (
                <>
                  <p className="sheet-step">
                    {game.ftue.stage === "COMPARE"
                      ? t("sheet.coachStep1")
                      : t("sheet.coachStep2")}
                  </p>
                  {game.ftue.stage === "COMPARE" ? (
                    <button
                      className="primary sheet-next"
                      onClick={toggleComparison}
                    >
                      {t("sheet.compareWithSimilar")}
                    </button>
                  ) : game.ftue.stage === "EVIDENCE" ? (
                    renderInspectionActions()
                  ) : null}
                </>
              )}
            </div>
          </section>
        </div>
      ) : null}
      {followSheetOpen ? (
        <div className="scrim" onClick={() => setFollowSheetOpen(false)}>
          <section
            ref={followSheetRef}
            className="sheet follow-sheet"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="follow-sheet-title"
          >
            <div className="sheet-scroll">
              <div className="grab" aria-hidden="true" />
              <button
                ref={followSheetCloseRef}
                className="close"
                onClick={() => setFollowSheetOpen(false)}
                aria-label={t("common.close")}
              >
                <Icon name="close" />
              </button>
              <Suspense
                fallback={<p role="status">{t("common.followLoading")}</p>}
              >
                <FollowPanel
                  game={game}
                  marketListings={marketListings}
                  onSelectListing={(listingId) => {
                    setFollowSheetOpen(false);
                    selectListing(listingId);
                  }}
                  onOpenMarket={() => {
                    setFollowSheetOpen(false);
                    navigate("market");
                  }}
                  onRemoveSearch={removeSearch}
                />
              </Suspense>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
