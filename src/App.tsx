import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { App as CapacitorApp } from "@capacitor/app";
import "./App.css";
import { assetFor, fallbackAssetFor } from "./assets";
import { familyById } from "./content/families";
import { avatarById, avatars, freeAvatars } from "./content/avatars";
import {
  activeBookCostMinor,
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
import { buyerPersona } from "./domain/buyers";
import { activeMarketEvent } from "./domain/marketEvents";
import { ftueCopy, ftueStageLabel, isFtueActive } from "./domain/ftue";
import {
  categoryExpertiseLevel,
  marketExpertiseLevel,
  nextExpertiseThreshold,
  savedSearchMatches,
} from "./domain/meta";
import {
  getRewardEligibility,
  hasPremiumEntitlement,
} from "./domain/monetization";
import type {
  AccessibilityPreferences,
  AvatarId,
  MonetizationProductId,
} from "./domain/models";
import { activeMarketListings, npcRiskSignal } from "./domain/world";
import {
  HOME_GOAL_MINOR,
  money,
  signal,
  signedMoney,
  wealth,
  type PlayerOfferMode,
} from "./game";
import { useGameStore } from "./stores/gameStore";
import { Icon, type IconName } from "./ui/Icon";
import { evidencePresentation } from "./ui/evidencePresentation";
import { missedOpportunityPresentation } from "./ui/followPresentation";
import {
  careerEventPresentation,
  completedSalesPresentation,
  timelineFilterLabel,
  type TimelineFilter,
} from "./ui/journeyPresentation";
import { ownershipPresentation } from "./ui/ownershipPresentation";
import { simplifyLegacyPlayerCopy } from "./ui/playerLanguage";
import { saleHistoryCopy } from "./ui/saleHistory";
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
  listingAgeLabel,
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
import { recoveryPlan } from "./ui/recoveryPlan";
import { ownsAnimatedAvatars as hasAnimatedAvatars } from "./domain/profile";
import { ProductVisual } from "./ui/ProductVisual";

type Tab = "market" | "follow" | "portfolio" | "journey";
type PortfolioSegment = "inventory" | "preparation" | "listings";

const evidenceLabel = (confidence: number) =>
  confidence >= 0.72 ? "Yüksek" : confidence >= 0.46 ? "Orta" : "Düşük";

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

const offerModeOptions: Array<{
  mode: PlayerOfferMode;
  label: string;
  detail: string;
}> = [
  { mode: "AGGRESSIVE", label: "Sert", detail: "Yüksek risk" },
  { mode: "BALANCED", label: "Dengeli", detail: "Orta yol" },
  { mode: "SAFE", label: "Güvenli", detail: "Kabul şansı daha yüksek" },
];

export function StartupSkeleton() {
  return (
    <div
      className="startup-shell"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Kayıt yükleniyor"
    >
      <header className="startup-header">
        <div>
          <span className="eyebrow">TRADEUP</span>
          <h1>Zero to Home</h1>
        </div>
      </header>
      <section className="startup-wallet" aria-hidden="true">
        <i />
        <i />
      </section>
      <main className="startup-content" aria-hidden="true">
        <i className="startup-line startup-line--short" />
        <i className="startup-line startup-line--title" />
        <div className="startup-grid">
          {Array.from({ length: 9 }, (_, index) => (
            <i key={index} />
          ))}
        </div>
      </main>
    </div>
  );
}

const storeCopy: Record<
  MonetizationProductId,
  { title: string; detail: string }
> = {
  tradeup_premium_lifetime: {
    title: "TradeUp Premium",
    detail: "Uygun hızlandırmaları video izlemeden kullan; limitler değişmez.",
  },
  tradeup_theme_night_market: {
    title: "Gece Pazarı teması",
    detail: "Yalnız arayüz görünümünü kişiselleştirir.",
  },
  tradeup_theme_workshop: {
    title: "Endüstriyel Atölye teması",
    detail: "Yalnız arayüz görünümünü kişiselleştirir.",
  },
  tradeup_home_styles_01: {
    title: "Ev stilleri paketi",
    detail: "Ev finali için üç görsel stil; ilerlemeye para eklemez.",
  },
  tradeup_animated_avatars_01: {
    title: "Canlı avatar koleksiyonu",
    detail: "Üç hareketli profil görünümü; yalnız kozmetiktir.",
  },
};

const rewardCopy = {
  MARKET_SCOUT: {
    ad: "25 tarama hakkı · Video",
    premium: "25 tarama hakkını yenile",
  },
  FAST_INSPECTION: {
    ad: "İncelemeyi şimdi bitir · Video",
    premium: "İncelemeyi şimdi bitir",
  },
  FAST_PREPARATION: {
    ad: "Hazırlığı şimdi bitir · Video",
    premium: "Hazırlığı şimdi bitir",
  },
  LISTING_REACH: {
    ad: "İlanı bir kez öne çıkar · Video",
    premium: "Premium erişim hakkını kullan",
  },
} as const;

function AvatarPortrait({
  avatarId,
  className = "",
}: {
  avatarId: AvatarId;
  className?: string;
}) {
  const avatar = avatarById(avatarId);
  return (
    <span
      className={`avatar-portrait avatar-motion--${avatar.motion} ${className}`.trim()}
      aria-hidden="true"
    >
      <span className="avatar-aura" />
      <b className="avatar-fallback">{avatar.name.slice(0, 1)}</b>
      <img
        src={avatar.image}
        alt=""
        draggable={false}
        onError={(event) => {
          event.currentTarget.hidden = true;
        }}
      />
    </span>
  );
}

export default function App() {
  const [tab, setTab] = useState<Tab>("market");
  const [portfolioSegment, setPortfolioSegment] =
    useState<PortfolioSegment>("inventory");
  const [timelineFilter, setTimelineFilter] = useState<TimelineFilter>("ALL");
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
  const [profileDraft, setProfileDraft] = useState("");
  const [onboardingName, setOnboardingName] = useState("");
  const [avatarDraft, setAvatarDraft] = useState<AvatarId>("pazar-kasifi");
  const [onboardingRestoreRequested, setOnboardingRestoreRequested] =
    useState(false);
  const [purchasesOpen, setPurchasesOpen] = useState(false);
  const [resetArmed, setResetArmed] = useState(false);
  const [quickSaleAssetId, setQuickSaleAssetId] = useState<string | null>(null);
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
  const sheetCloseRef = useRef<HTMLButtonElement>(null);
  const comparisonRef = useRef<HTMLDivElement>(null);
  const homeFinaleButtonRef = useRef<HTMLButtonElement>(null);
  const settingsCloseRef = useRef<HTMLButtonElement>(null);
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
    storeProducts,
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
    setAnalytics,
    setHaptics,
    setReducedMotion,
    setLargeText,
    setSoundLevel,
    setProfileName,
    setProfileAvatar,
    completeProfileOnboarding,
    openPurchases,
    purchaseProduct,
    restorePurchases,
    showPrivacyOptions,
    claimReward,
    reset,
  } = useGameStore();

  const openSettingsPanel = () => {
    setSettingsReturnTab(tab);
    setProfileDraft(game.profile.displayName);
    setResetArmed(false);
    setSettingsOpen(true);
    setTab("journey");
  };
  const closeSettingsPanel = () => {
    setSettingsOpen(false);
    setPurchasesOpen(false);
    setResetArmed(false);
    setTab(settingsReturnTab);
  };

  useEffect(() => {
    void hydrate();
  }, [hydrate]);
  useEffect(() => {
    if (!settingsOpen) return undefined;
    const frame = requestAnimationFrame(() =>
      settingsCloseRef.current?.focus(),
    );
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setSettingsOpen(false);
      setPurchasesOpen(false);
      setResetArmed(false);
      setTab(settingsReturnTab);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [settingsOpen, settingsReturnTab]);
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
  useEffect(() => {
    if (!selectedId) return undefined;
    const previousFocus = document.activeElement as HTMLElement | null;
    const frame = window.requestAnimationFrame(() =>
      sheetCloseRef.current?.focus(),
    );
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", closeOnEscape);
      previousFocus?.focus();
    };
  }, [selectedId]);
  useEffect(() => {
    if (!homeFinaleOpen) return undefined;
    const previousFocus = document.activeElement as HTMLElement | null;
    const frame = window.requestAnimationFrame(() =>
      homeFinaleButtonRef.current?.focus(),
    );
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setHomeFinaleOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", closeOnEscape);
      previousFocus?.focus();
    };
  }, [homeFinaleOpen]);

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
        ),
      },
    ];
  });
  const pendingBuyerOfferCount = playerListings.reduce(
    (count, entry) => count + entry.activity.offers.length,
    0,
  );
  const latestSale = latestSaleResult(game);
  const watchedListings = marketListings.filter((listing) =>
    game.follow.watchedListingIds.includes(listing.id),
  );
  const negotiating = selected
    ? (game.negotiations[selected.id] ??
      (game.negotiation?.listingId === selected.id
        ? game.negotiation
        : undefined))
    : undefined;
  const offers = negotiating?.offersRemaining ?? 2;
  const ftueActive = isFtueActive(game);
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
      ? `${money(quote.shortfallMinor)} nakit eksik`
      : `Alırsan kalan: ${money(quote.remainingMinor)}`;
  const premiumReward = hasPremiumEntitlement(game);
  const rewardProviderAvailable =
    premiumReward || game.monetization.consent.canRequestAds;
  const canClaimReward = (placementId: keyof typeof rewardCopy) =>
    rewardProviderAvailable && getRewardEligibility(game, placementId).ok;
  const rewardLabel = (placementId: keyof typeof rewardCopy) =>
    rewardCopy[placementId][premiumReward ? "premium" : "ad"];
  const coach = ftueCopy[game.ftue.stage];
  const showCoach =
    ftueActive && !game.ftue.dismissedStages.includes(game.ftue.stage);
  const startingOffer =
    game.ftue.stage === "STARTING_SALE"
      ? game.buyerOffers.find(
          (item) => item.id === "offer:ftue-starting-notebook",
        )
      : undefined;
  const marketLevel = marketExpertiseLevel(game);
  const marketXpTarget = nextExpertiseThreshold(game.expertise.marketXp);
  const estimates = wealthPresentation(game);
  const recovery = ftueActive ? null : recoveryPlan(game);
  const homeProgress = game.home.purchased
    ? 100
    : Math.min(100, Math.floor((total / HOME_GOAL_MINOR) * 100));
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

  if (!ready) return <StartupSkeleton />;

  const ownsAnimatedAvatars = hasAnimatedAvatars(game);

  if (!game.profile.onboardingComplete) {
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
              value={onboardingName}
              placeholder="Örn. Pazar Ustası"
              onChange={(event) => setOnboardingName(event.target.value)}
            />
            <small>{onboardingName.trim().length}/20</small>
          </label>
          <fieldset className="avatar-picker avatar-picker--onboarding">
            <legend>
              {ownsAnimatedAvatars ? "Karakterin" : "Ücretsiz karakterin"}
            </legend>
            <div className="avatar-options">
              {(ownsAnimatedAvatars ? avatars : freeAvatars).map((avatar) => (
                <button
                  key={avatar.id}
                  type="button"
                  aria-pressed={avatarDraft === avatar.id}
                  aria-label={`${avatar.name}, ${avatar.role}`}
                  onClick={() => setAvatarDraft(avatar.id)}
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
          {!ownsAnimatedAvatars ? (
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
            disabled={!onboardingName.trim()}
            onClick={() =>
              completeProfileOnboarding(onboardingName, avatarDraft)
            }
          >
            Kariyere başla <span aria-hidden="true">→</span>
          </button>
          <button
            className="onboarding-restore"
            disabled={monetizationBusy}
            onClick={() => {
              setOnboardingRestoreRequested(true);
              void restorePurchases();
            }}
          >
            Satın alımları geri yükle
          </button>
          {onboardingRestoreRequested ? (
            <p className="onboarding-restore-status" role="status">
              {monetizationBusy ? "Mağaza kontrol ediliyor…" : notice}
            </p>
          ) : null}
        </section>
      </main>
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
          {option.label}
          <small>
            {option.durationMin
              ? `${option.durationMin} dk · pazar ilerler`
              : "anında"}
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
    return (
      <article
        className={`owned${focusedAssetId === item.id ? " owned--focused" : ""}`}
        id={`owned-${item.id}`}
        tabIndex={-1}
        aria-label={item.instance.family.name}
        key={`${showPreparation ? "prep" : "stock"}:${item.id}`}
      >
        <ProductVisual instance={item.instance} className="owned-icon" />
        <div className="owned-copy">
          <div className="owned-title-row">
            <h3>{item.instance.family.name}</h3>
            <span className={`asset-state ${ownershipState.tone}`}>
              {ownershipState.label}
            </span>
          </div>
          <div className="owned-metrics">
            <div>
              <span>Toplam harcaman</span>
              <b>{money(item.bookCostMinor)}</b>
            </div>
            <div>
              <span>Tahmini satış</span>
              <b>
                {money(quote.quickSaleMinor)}–{money(quote.balancedAskingMinor)}
              </b>
            </div>
          </div>
          <p className="owned-facts">
            Bilgi güveni: {evidenceLabel(item.instance.evidenceConfidence)}
            <span aria-hidden="true">·</span>
            Satış hızı: %
            {Math.round(
              (item.instance.family.liquidity +
                item.instance.liquidityBonusBps / 10_000) *
                100,
            )}
          </p>
          {focusedAssetId === item.id ? (
            <p className="decision-cause" role="status">
              <b>Karar özeti</b>
              <span>{purchaseDecisionCause(game, item)}</span>
            </p>
          ) : null}
        </div>
        <div className="sell-actions">
          {showPreparation && item.state === "PREPARING" ? (
            <p className="preparation-status" role="status">
              {pendingPreparation ? (
                <>
                  {item.instance.family.preparation.find(
                    (action) => action.kind === pendingPreparation.kind,
                  )?.label ?? "Hazırlık"}{" "}
                  devam ediyor ·{" "}
                  {Math.max(
                    0,
                    pendingPreparation.completesAtGameMin - game.gameTimeMin,
                  )}{" "}
                  dk kaldı.
                </>
              ) : (
                "Hazırlık işlem kaydı bulunamadı."
              )}
            </p>
          ) : null}
          {showPreparation &&
          item.state !== "PREPARING" &&
          !availablePreparations.length ? (
            <p className="preparation-status">
              Hazırlık tamam. Ürününü satışa çıkarabilirsin.
            </p>
          ) : null}
          {(item.state === "IN_INVENTORY" || item.state === "READY") &&
          quickSaleAssetId !== item.id &&
          (!ftueActive || game.ftue.stage === "LISTING") ? (
            <div
              className={`portfolio-next-action${ftueActive ? "" : " listing-strategies"}`}
            >
              <small>SIRADAKİ ADIM</small>
              <b>
                {ftueActive
                  ? "Dengeli fiyatla satışa çıkar"
                  : "Nasıl satmak istersin?"}
              </b>
              {ftueActive ? (
                <>
                  <span>
                    Toplam harcaman {money(item.bookCostMinor)} · İlan fiyatı{" "}
                    {money(quote.balancedAskingMinor)}
                  </span>
                  <button
                    className="primary"
                    aria-label={`İlan oluştur · ${money(quote.balancedAskingMinor)}`}
                    onClick={() =>
                      listAndContinue(item, quote.balancedAskingMinor)
                    }
                  >
                    İlan oluştur <b>{money(quote.balancedAskingMinor)}</b>
                  </button>
                </>
              ) : (
                <>
                  <div className="listing-strategy-options">
                    <button
                      aria-label={`Hemen sat · ${money(quote.quickSaleMinor)}`}
                      onClick={() => setQuickSaleAssetId(item.id)}
                    >
                      <b>Hızlı</b>
                      <strong>{money(quote.quickSaleMinor)}</strong>
                      <small>Şimdi sat</small>
                    </button>
                    <button
                      className="primary"
                      aria-label={`İlan oluştur · ${money(quote.balancedAskingMinor)}`}
                      onClick={() =>
                        listAndContinue(item, quote.balancedAskingMinor)
                      }
                    >
                      <b>Dengeli</b>
                      <strong>{money(quote.balancedAskingMinor)}</strong>
                      <small>Normal bekleme</small>
                    </button>
                    <button
                      onClick={() =>
                        listAndContinue(item, quote.premiumAskingMinor)
                      }
                    >
                      <b>Yüksek</b>
                      <strong>{money(quote.premiumAskingMinor)}</strong>
                      <small>Daha uzun bekle</small>
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
                    Kendi fiyatını belirle
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
                        <span>İlan fiyatı</span>
                        <span className="manual-price-input">
                          ₺
                          <input
                            value={manualListingPrice}
                            inputMode="decimal"
                            aria-label="Kendi ilan fiyatın"
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
                            )
                          : "Geçerli bir fiyat yaz"}
                      </small>
                      <button
                        className="primary"
                        disabled={!manualListingPriceMinor(manualListingPrice)}
                        type="submit"
                      >
                        Bu fiyatla ilan ver
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
                  ? "Diğer hazırlıklar"
                  : "Nasıl hazırlamak istersin?"}
              </summary>
              {!item.instance.preparationHistory.length ? (
                <p className="preparation-guide">
                  Birini seç. Ücret toplam harcamana eklenir.
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
                      <b>{action.label}</b>
                      <strong>{money(action.costMinor)}</strong>
                    </span>
                    <small>
                      {action.durationMin} dk ·{" "}
                      {preparationPresentation(item, action).join(" · ")}
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
              aria-label="Hızlı satış onayı"
            >
              <strong>
                {quote.quickSaleProfitMinor >= 0 ? "Net kâr" : "Net zarar"}{" "}
                <span
                  className={quote.quickSaleProfitMinor < 0 ? "loss" : "profit"}
                >
                  {signedMoney(quote.quickSaleProfitMinor)}
                </span>
              </strong>
              <small>
                Satış tutarı {money(quote.quickSaleMinor)} · Toplam harcaman{" "}
                {money(item.bookCostMinor)}
              </small>
              <small>
                Dengeli ilana göre kaçırılan tahmini ek kazanç{" "}
                {money(quote.estimatedPremiumGivenUpMinor)}
              </small>
              <button
                className="primary"
                onClick={() => {
                  setQuickSaleAssetId(null);
                  sell(item, true);
                }}
              >
                Satışı onayla · {money(quote.quickSaleMinor)}
              </button>
              <button
                className="text-button"
                onClick={() => setQuickSaleAssetId(null)}
              >
                Vazgeç
              </button>
            </div>
          ) : null}
          {!showPreparation && availablePreparations.length > 0 ? (
            <button onClick={() => showOwnedAsset(item.id, "preparation")}>
              Ürünü hazırla
            </button>
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
      <header>
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">
            ↑
          </span>
          <div>
            <span className="eyebrow">TRADEUP</span>
            <h1>Zero to Home</h1>
          </div>
        </div>
        <button
          className="profile-settings-button"
          aria-expanded={settingsOpen}
          aria-label="Ayarlar"
          onClick={openSettingsPanel}
        >
          <AvatarPortrait
            avatarId={game.profile.avatarId}
            className="profile-header-avatar"
          />
          <Icon name="settings" />
        </button>
      </header>

      <section className="wallet" aria-label="Finans özeti">
        <div>
          <small>Nakit</small>
          <strong>{money(game.cashMinor)}</strong>
        </div>
        <div>
          <small>Tahmini net servet</small>
          <strong>{formatEstimate(estimates.total)}</strong>
        </div>
        {game.home.unlocked ? (
          <div
            className="goal"
            aria-label={`Ev yolculuğu yüzde ${homeProgress}`}
          >
            <small>Ev yolculuğu · %{homeProgress}</small>
            <span>
              <i style={{ width: `${homeProgress}%` }} />
            </span>
          </div>
        ) : null}
      </section>

      <div className="notice" role="status" key={notice}>
        {notice}
      </div>
      {showCoachHere ? (
        <aside className="coach" aria-label="İlk oturum rehberi">
          <button onClick={dismissCoach} aria-label="Rehberi kapat">
            <Icon name="close" />
          </button>
          <small>İLK İŞLEM · {ftueStageLabel[game.ftue.stage]}</small>
          <h2>{coach.title}</h2>
          <p>{coach.body}</p>
          {firstAsset && coachSegment && !atCoachDestination ? (
            <button
              className="coach-next"
              onClick={() => showOwnedAsset(firstAsset.id, coachSegment)}
            >
              Ürününe dön
            </button>
          ) : null}
        </aside>
      ) : null}
      {recovery ? (
        <aside className="recovery-bar" aria-label="Nakit toparlama yolları">
          <div>
            <small>NAKİT PLANI</small>
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
              Küçük eşya bul
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
                Hızlı satış
              </button>
            ) : null}
            {recovery.canRevise ? (
              <button
                onClick={() => {
                  setPortfolioSegment("listings");
                  navigate("portfolio");
                }}
              >
                İlanı düzenle
              </button>
            ) : null}
          </div>
        </aside>
      ) : null}

      <main>
        {tab === "market" ? (
          <>
            <div className="section-title">
              <div>
                <small>CANLI PAZAR</small>
                <h2>Fırsat akışı</h2>
              </div>
              <div className="market-title-actions">
                <span className="market-listing-count">
                  {visibleMarketListings.length} ilan
                </span>
                {!ftueActive ? (
                  <>
                    <label
                      className={`market-sort${marketSort === "MARKET" ? "" : " market-sort--active"}`}
                      title="Pazarı sırala"
                    >
                      <Icon name="sort" />
                      <select
                        aria-label="Pazar sıralaması"
                        value={marketSort}
                        onChange={(event) =>
                          setMarketSort(event.target.value as MarketSort)
                        }
                      >
                        <option value="MARKET">Pazar sırası</option>
                        <option value="PRICE_ASC">
                          Fiyat: düşükten yükseğe
                        </option>
                        <option value="PRICE_DESC">
                          Fiyat: yüksekten düşüğe
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
                        <span>+25</span>
                      </button>
                    ) : (
                      <button
                        className="market-refresh"
                        disabled={game.monetization.marketScanCredits === 0}
                        onClick={scan}
                        aria-label={`Pazarı yenile · ${game.monetization.marketScanCredits} hak kaldı`}
                      >
                        <Icon name="refresh" />
                        <span>{game.monetization.marketScanCredits}</span>
                      </button>
                    )}
                  </>
                ) : null}
              </div>
            </div>
            {!ftueActive && !scanRefill.full ? (
              <p className="market-refill-status" role="status">
                <span>Yenileme {game.monetization.marketScanCredits}/25</span>
                <span>
                  Sıradaki +1 · {shortDuration(scanRefill.nextCreditSeconds)}
                </span>
              </p>
            ) : null}
            {!ftueActive && marketEvent ? (
              <aside className="market-event" aria-label="Güncel pazar olayı">
                <span aria-hidden="true">↗</span>
                <div>
                  <small>PAZAR HAREKETİ</small>
                  <b>{marketEvent.title}</b>
                  <p>{marketEvent.message}</p>
                </div>
              </aside>
            ) : null}
            {!ftueActive && marketCategoryOptions.length > 1 ? (
              <div
                className="chips market-filters"
                role="group"
                aria-label="Pazar kategorileri"
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
                  Tümü
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
                    {category}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="feed market-grid">
              {startingOffer ? (
                <article className="starting-sale">
                  <img
                    src={assetFor("prd_notebook")}
                    alt="Eski defter"
                    onError={(event) => {
                      const fallback = fallbackAssetFor("Küçük Eşya");
                      if (event.currentTarget.src !== fallback)
                        event.currentTarget.src = fallback;
                    }}
                  />
                  <div>
                    <small>ECE'NİN TEKLİFİ</small>
                    <h3>Eski defter</h3>
                    <p>
                      Harcaman yok · Satıştan kazanacağın{" "}
                      {money(startingOffer.amountMinor)}
                    </p>
                    <button
                      className="primary"
                      onClick={() => acceptBuyer(startingOffer.id)}
                    >
                      Teklifi kabul et · {money(startingOffer.amountMinor)}
                    </button>
                  </div>
                </article>
              ) : null}
              {visibleMarketListings.map((item, index) => {
                const categoryLevel = categoryExpertiseLevel(
                  game,
                  item.instance.family.category,
                );
                const itemSignal = signal(item, categoryLevel);
                const risk = npcRiskSignal(item, game.gameTimeMin);
                const watched = game.follow.watchedListingIds.includes(item.id);
                return (
                  <button
                    className="listing market-card"
                    key={item.id}
                    data-listing-id={item.id}
                    data-price-minor={item.priceMinor}
                    onClick={() => selectListing(item.id)}
                    aria-label={`${item.instance.family.name}, fiyat ${money(item.priceMinor)}, kondisyon yüzde ${item.instance.condition}, bilgi güveni ${evidenceLabel(item.instance.evidenceConfidence)}, ${listingAgeLabel(item.createdAtGameMin, game.gameTimeMin)}, ${itemSignal.text}. İlan detaylarını aç`}
                  >
                    <div className="market-visual-frame">
                      <ProductVisual
                        instance={item.instance}
                        className="product-art"
                        priority={index < 6}
                      />
                      <span className="market-condition-signal">
                        %{item.instance.condition}
                      </span>
                    </div>
                    {risk.level !== "low" ? (
                      <span
                        className={`market-heat market-heat--${risk.level}`}
                      >
                        {risk.text}
                      </span>
                    ) : null}
                    <div className="listing-copy">
                      <small className="market-category">
                        {item.instance.family.category} · Sv. {categoryLevel}
                      </small>
                      <h3>{item.instance.family.name}</h3>
                      <div className="market-price-row">
                        <strong>{money(item.priceMinor)}</strong>
                        {watched ? (
                          <span className="watch-state">
                            <Icon name="follow" /> Takipte
                          </span>
                        ) : null}
                      </div>
                      <div className="tags">
                        <b className={itemSignal.cls}>{itemSignal.text}</b>
                        <span>%{item.instance.condition} kondisyon</span>
                      </div>
                      <div className="market-card-facts">
                        <span>
                          Bilgi:{" "}
                          {evidenceLabel(item.instance.evidenceConfidence)}
                        </span>
                        <span>İlgi %{item.interest}</span>
                        <span>
                          {listingAgeLabel(
                            item.createdAtGameMin,
                            game.gameTimeMin,
                          )}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        ) : null}

        {tab === "follow" ? (
          <>
            <div className="section-title">
              <div>
                <small>GERİ DÖNÜŞ NOKTAN</small>
                <h2>Takip</h2>
              </div>
              <span>{watchedListings.length} canlı</span>
            </div>
            {!watchedListings.length &&
            !game.follow.savedSearches.length &&
            !game.follow.missedOpportunities.length ? (
              <div className="empty">
                <span className="empty-icon">
                  <Icon name="follow" />
                </span>
                <h3>Henüz takip yok</h3>
                <p>
                  Bir ilanı takip et. Pazar deneyimin Seviye 3 olduğunda ürün
                  alarmı da kurabilirsin.
                </p>
                <button onClick={() => navigate("market")}>
                  Pazardan ürün seç
                </button>
              </div>
            ) : null}
            {watchedListings.length ? (
              <h3 className="module-title">İzleme listesi</h3>
            ) : null}
            <div className="feed compact-feed">
              {watchedListings.map((item) => (
                <button
                  className="listing watch-listing"
                  key={item.id}
                  onClick={() => selectListing(item.id)}
                  aria-label={`${item.instance.family.name}, fiyat ${money(item.priceMinor)}, yüzde ${item.instance.condition} kondisyon. Takip edilen ilanı aç`}
                >
                  <ProductVisual
                    instance={item.instance}
                    className="product-art"
                  />
                  <div className="listing-copy">
                    <small>CANLI · %{item.instance.condition} kondisyon</small>
                    <h3>{item.instance.family.name}</h3>
                    <span className="subtle">
                      {npcRiskSignal(item, game.gameTimeMin).text}
                    </span>
                  </div>
                  <div className="price">
                    <strong>{money(item.priceMinor)}</strong>
                    <small>incele</small>
                  </div>
                </button>
              ))}
            </div>
            {game.follow.savedSearches.length ? (
              <h3 className="module-title">Ürün alarmları</h3>
            ) : null}
            <div className="follow-stack">
              {game.follow.savedSearches.map((search) => {
                const family = familyById(search.familyId);
                const matches = marketListings.filter((listing) =>
                  savedSearchMatches(search, listing),
                );
                return (
                  <article className="follow-card" key={search.id}>
                    <div className="follow-card-heading">
                      <div>
                        <small>ÜRÜN ALARMI</small>
                        <h3>{family?.name ?? "Bilinmeyen ürün grubu"}</h3>
                      </div>
                      <span
                        className={`match-count${matches.length ? " has-matches" : ""}`}
                      >
                        {matches.length
                          ? `${matches.length} eşleşme`
                          : "Bekliyor"}
                      </span>
                    </div>
                    <div className="alarm-criteria">
                      <span>
                        <small>En yüksek fiyat</small>
                        <b>{money(search.maxPriceMinor)}</b>
                      </span>
                      <span>
                        <small>En düşük kondisyon</small>
                        <b>%{search.minCondition}</b>
                      </span>
                      <span>
                        <small>Bilgi kontrolü</small>
                        <b>
                          {search.evidencePreference === "CHECKED"
                            ? "Gerekli"
                            : "Fark etmez"}
                        </b>
                      </span>
                    </div>
                    <div className="inline-actions">
                      {matches[0] ? (
                        <button
                          className="primary"
                          onClick={() => selectListing(matches[0].id)}
                        >
                          Eşleşmeyi aç
                        </button>
                      ) : null}
                      <button
                        className="text-button"
                        onClick={() => removeSearch(search.id)}
                      >
                        Kaldır
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
            {game.follow.missedOpportunities.length ? (
              <h3 className="module-title">Kaçan fırsatlar</h3>
            ) : null}
            <div className="follow-stack">
              {game.follow.missedOpportunities.toReversed().map((missed) => {
                const similar = marketListings.find(
                  (listing) => listing.familyId === missed.familyId,
                );
                const missedState = missedOpportunityPresentation(
                  missed.reason,
                  game.gameTimeMin,
                  missed.atGameMin,
                );
                return (
                  <article className="follow-card missed" key={missed.id}>
                    <div className="missed-meta">
                      <small className={`missed-reason ${missedState.tone}`}>
                        {missedState.label}
                      </small>
                      <span className="missed-age">{missedState.ageLabel}</span>
                    </div>
                    <div>
                      <h3>{missed.familyName}</h3>
                      <p>
                        {money(missed.priceMinor)} · %{missed.condition}{" "}
                        kondisyon. Fırsat kapandı; benzer ilanları aramaya devam
                        edebilirsin.
                      </p>
                    </div>
                    {similar ? (
                      <button onClick={() => selectListing(similar.id)}>
                        Benzerini gör
                      </button>
                    ) : (
                      <button onClick={() => navigate("market")}>
                        Pazara dön
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
          </>
        ) : null}

        {tab === "portfolio" ? (
          <>
            <div className="section-title">
              <div>
                <small>ÜRÜNLERİN</small>
                <h2>Portföy</h2>
              </div>
              <span>{activeOwnedAssets(game).length} ürün</span>
            </div>
            <div
              className="segments"
              role="tablist"
              aria-label="Portföy bölümleri"
            >
              {(
                [
                  ["inventory", "Envanter", inventory.length],
                  ["preparation", "Hazırlık", workshop.length],
                  ["listings", "İlanlarım", playerListings.length],
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
                    ? "Bu bölümde ürün yok"
                    : "Portföyün boş"}
                </h3>
                <p>
                  {activeOwnedAssets(game).length
                    ? "Ürünlerini Hazırlık ve İlanlarım bölümlerinde takip edebilirsin."
                    : "Pazardan bir ürün alarak portföyünü oluşturabilirsin."}
                </p>
                {workshop.some((asset) => asset.state === "PREPARING") ? (
                  <button onClick={() => setPortfolioSegment("preparation")}>
                    Hazırlığı gör
                  </button>
                ) : (
                  <button onClick={() => navigate("market")}>Pazara git</button>
                )}
              </div>
            ) : null}
            <div
              className="inventory-grid"
              id="portfolio-panel"
              role="tabpanel"
              aria-label={
                portfolioSegment === "inventory"
                  ? "Envanter"
                  : portfolioSegment === "preparation"
                    ? "Hazırlık"
                    : "İlanlarım"
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
                      const ownershipState = ownershipPresentation(asset.state);
                      return (
                        <article
                          className={`owned owned--listing${focusedAssetId === asset.id ? " owned--focused" : ""}`}
                          key={playerListing.id}
                          id={`owned-${asset.id}`}
                          tabIndex={-1}
                          aria-label={asset.instance.family.name}
                        >
                          <ProductVisual
                            instance={asset.instance}
                            className="owned-icon"
                          />
                          <div className="owned-copy">
                            <div className="owned-title-row">
                              <h3>{asset.instance.family.name}</h3>
                              <span
                                className={`asset-state ${ownershipState.tone}`}
                              >
                                {ownershipState.label}
                              </span>
                            </div>
                            <div className="owned-metrics listing-metrics">
                              <div>
                                <span>Toplam harcaman</span>
                                <b>{money(asset.bookCostMinor)}</b>
                              </div>
                              <div>
                                <span>İlan fiyatı</span>
                                <b>{money(playerListing.askingPriceMinor)}</b>
                              </div>
                              <div>
                                <span>İlgi</span>
                                <b>%{playerListing.interest}</b>
                              </div>
                            </div>
                          </div>
                          {activity.waiting ? (
                            <div
                              className="listing-wait"
                              role="group"
                              aria-label="İlan durumu"
                            >
                              <div className="listing-wait-copy">
                                <b>Yayında · {activity.ageLabel}</b>
                                <span>Alıcı teklifi bekleniyor</span>
                                {activity.diagnosis ? (
                                  <span className="listing-diagnosis">
                                    {activity.diagnosis}
                                  </span>
                                ) : null}
                              </div>
                              <button onClick={() => navigate("market")}>
                                Pazara göz at
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
                            const persona = buyerPersona(buyerOffer.buyerType);
                            return (
                              <div
                                className="buyer-offer"
                                key={buyerOffer.id}
                                role="group"
                                aria-label={`${buyerOffer.buyer} alıcı teklifi`}
                              >
                                <h4>
                                  {buyerOffer.buyer}{" "}
                                  {buyerOffer.counterUsed
                                    ? "son fiyatını verdi"
                                    : "teklif verdi"}
                                </h4>
                                {persona ? (
                                  <p className="buyer-persona">
                                    <b>{persona.label}</b>
                                    <span>{persona.tendency}</span>
                                  </p>
                                ) : null}
                                <dl className="sale-breakdown">
                                  <div>
                                    <dt>Alacağın tutar</dt>
                                    <dd>{money(sale.proceedsMinor)}</dd>
                                  </div>
                                  <div>
                                    <dt>Toplam harcaman</dt>
                                    <dd>{money(sale.bookCostMinor)}</dd>
                                  </div>
                                  <div
                                    className={
                                      sale.profitMinor < 0 ? "loss" : "profit"
                                    }
                                  >
                                    <dt>
                                      {sale.profitMinor < 0
                                        ? "Zararın"
                                        : sale.profitMinor > 0
                                          ? "Kârın"
                                          : "Kâr / zarar"}
                                    </dt>
                                    <dd>{signedMoney(sale.profitMinor)}</dd>
                                  </div>
                                </dl>
                                <p>
                                  {buyerOffer.expiresAtGameMin -
                                    game.gameTimeMin}{" "}
                                  oyun dakikası içinde karar ver.
                                </p>
                                <div
                                  className={`sell-actions${counterMinor === undefined ? "" : " buyer-actions"}`}
                                >
                                  <button
                                    className="primary"
                                    aria-label="Teklifi kabul et"
                                    onClick={() => acceptBuyer(buyerOffer.id)}
                                  >
                                    Kabul et
                                  </button>
                                  {counterMinor !== undefined ? (
                                    <button
                                      aria-label={`Karşı teklif yap: ${money(counterMinor)} iste`}
                                      onClick={() =>
                                        counterBuyer(buyerOffer.id)
                                      }
                                    >
                                      {money(counterMinor)} iste
                                    </button>
                                  ) : null}
                                  <button
                                    aria-label="Teklifi reddet"
                                    onClick={() => rejectBuyer(buyerOffer.id)}
                                  >
                                    Reddet
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
                                <span>Yeni fiyat</span>
                                <span className="manual-price-input">
                                  ₺
                                  <input
                                    value={revisedListingPrice}
                                    inputMode="decimal"
                                    aria-label={`${asset.instance.family.name} yeni ilan fiyatı`}
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
                                Fiyatı uygula
                              </button>
                            </form>
                          ) : null}
                          <div className="sell-actions listing-withdraw-actions">
                            <button
                              disabled={activity.offers.length > 0}
                              title={
                                activity.offers.length > 0
                                  ? "Önce mevcut teklifi yanıtla"
                                  : undefined
                              }
                              onClick={() => {
                                setRevisingListingId(playerListing.id);
                                setRevisedListingPrice(
                                  String(playerListing.askingPriceMinor / 100),
                                );
                              }}
                            >
                              Fiyatı değiştir
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
                              İlanı geri çek
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
                <section className="sale-result" aria-label="Son satış sonucu">
                  <div className="sale-result-copy" role="status">
                    <small>SATIŞ TAMAMLANDI</small>
                    <h3>{latestSale.assetName} satıldı</h3>
                    <dl className="sale-breakdown">
                      <div>
                        <dt>Hesabına giren</dt>
                        <dd>{money(latestSale.proceedsMinor)}</dd>
                      </div>
                      <div>
                        <dt>Toplam harcaman</dt>
                        <dd>{money(latestSale.bookCostMinor)}</dd>
                      </div>
                      <div
                        className={
                          latestSale.profitMinor < 0 ? "loss" : "profit"
                        }
                      >
                        <dt>
                          {latestSale.profitMinor < 0
                            ? "Net zararın"
                            : latestSale.profitMinor > 0
                              ? "Net kârın"
                              : "Net sonuç"}
                        </dt>
                        <dd>{signedMoney(latestSale.profitMinor)}</dd>
                      </div>
                    </dl>
                    <p className="decision-cause">
                      <b>Sonuç özeti</b>
                      <span>{latestSale.cause}</span>
                    </p>
                    <p>Yeni fırsat için paran hazır: {money(game.cashMinor)}</p>
                  </div>
                  <button
                    className="primary"
                    onClick={() => navigate("market")}
                  >
                    Yeni fırsatlara bak
                  </button>
                </section>
              ) : (
                <div className="empty">
                  <span className="empty-icon">
                    <Icon name="portfolio" />
                  </span>
                  <h3>Aktif ilanın yok</h3>
                  <p>Bir ürününü seçip satışa çıkar.</p>
                  <button
                    onClick={() =>
                      inventory.length
                        ? setPortfolioSegment("inventory")
                        : navigate("market")
                    }
                  >
                    {inventory.length ? "Ürünlerini gör" : "Pazara dön"}
                  </button>
                </div>
              )
            ) : null}
          </>
        ) : null}

        {tab === "journey" ? (
          <>
            <div className="section-title">
              <div>
                <small>KİŞİSEL KAYIT</small>
                <h2>Yolculuk</h2>
              </div>
            </div>
            {settingsOpen ? (
              <section
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
                    ref={settingsCloseRef}
                    className="icon-button"
                    aria-label="Ayarları kapat"
                    onClick={closeSettingsPanel}
                  >
                    <Icon name="close" />
                  </button>
                </div>
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
                    <span className="profile-kicker">
                      Pazar seviyesi {marketLevel}
                    </span>
                    <label>
                      <span>Oyuncu adı</span>
                      <input
                        value={profileDraft}
                        maxLength={20}
                        autoComplete="nickname"
                        onChange={(event) =>
                          setProfileDraft(event.target.value)
                        }
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
                  <div
                    className="profile-stats"
                    role="group"
                    aria-label="Profil özeti"
                  >
                    <span>
                      <small>Pazar seviyesi</small>
                      <b>{marketLevel}</b>
                    </span>
                    <span>
                      <small>Satış</small>
                      <b>
                        {
                          game.transactionJournal.filter(
                            (entry) => entry.kind === "SALE",
                          ).length
                        }
                      </b>
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
                      const locked = avatar.premium && !ownsAnimatedAvatars;
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
                            <small>
                              {locked ? "Canlı · Yakında" : avatar.role}
                            </small>
                          </span>
                          {locked ? <i aria-hidden="true">◇</i> : null}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
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
                      onClick={() =>
                        setHaptics(!game.accessibility.hapticsEnabled)
                      }
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
                      onClick={() =>
                        setReducedMotion(!game.accessibility.reducedMotion)
                      }
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
                      onClick={() =>
                        setLargeText(!game.accessibility.largeText)
                      }
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
                        setSoundLevel(
                          nextSoundLevel[game.accessibility.soundLevel],
                        )
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
                  aria-expanded={purchasesOpen}
                  onClick={() => {
                    const next = !purchasesOpen;
                    setPurchasesOpen(next);
                    if (next) void openPurchases();
                  }}
                >
                  <span className="settings-link-icon" aria-hidden="true">
                    <Icon name="store" />
                  </span>
                  <span>
                    <b>Satın almalar &amp; görünüm</b>
                    <small>Kalıcı paketler ve geri yükleme</small>
                  </span>
                  <i aria-hidden="true">{purchasesOpen ? "−" : "+"}</i>
                </button>
                {purchasesOpen ? (
                  <section
                    className="purchase-panel"
                    aria-label="Satın Almalar ve Görünüm"
                  >
                    <div className="purchase-panel-heading">
                      <div>
                        <strong>Kalıcı paketler</strong>
                        <p>Oynanış ekonomisini değiştirmez.</p>
                      </div>
                      <span>
                        {storeProducts.length ? "Mağaza hazır" : "Yakında"}
                      </span>
                    </div>
                    <div className="purchase-list">
                      {(Object.keys(storeCopy) as MonetizationProductId[]).map(
                        (productId) => {
                          const metadata = storeProducts.find(
                            (product) => product.productId === productId,
                          );
                          const entitlement =
                            game.monetization.entitlements.find(
                              (entry) => entry.productId === productId,
                            );
                          const owned = entitlement?.status === "OWNED";
                          const pending = entitlement?.status === "PENDING";
                          return (
                            <article key={productId}>
                              <div>
                                <strong>{storeCopy[productId].title}</strong>
                                <p>{storeCopy[productId].detail}</p>
                              </div>
                              {owned || pending ? (
                                <span className="entitlement-state">
                                  {owned ? "Sahipsin" : "Ödeme beklemede"}
                                </span>
                              ) : metadata ? (
                                <button
                                  disabled={monetizationBusy}
                                  onClick={() =>
                                    void purchaseProduct(productId)
                                  }
                                >
                                  Satın al · {metadata.localizedPrice}
                                </button>
                              ) : (
                                <span className="store-unavailable">
                                  Yakında
                                </span>
                              )}
                            </article>
                          );
                        },
                      )}
                    </div>
                    <p className="purchase-note">
                      Paketler mobil mağaza bağlantısı tamamlandığında açılır. O
                      zamana kadar oynanışın ve ilerlemen değişmez.
                    </p>
                    <div className="purchase-footer-actions">
                      <button
                        className="secondary"
                        disabled={monetizationBusy || !storeProducts.length}
                        onClick={() => void restorePurchases()}
                      >
                        Satın alımları geri yükle
                      </button>
                      <button
                        className="text-button"
                        onClick={() => void showPrivacyOptions()}
                      >
                        Gizlilik
                      </button>
                    </div>
                  </section>
                ) : null}
                <section
                  className="settings-danger-zone"
                  aria-label="Kayıt yönetimi"
                >
                  <div>
                    <b>Kayıt yönetimi</b>
                    <small>Bu işlem geri alınamaz.</small>
                  </div>
                  <button
                    className={resetArmed ? "danger-confirm" : "text-button"}
                    onClick={() => {
                      if (resetArmed) {
                        setResetArmed(false);
                        setSettingsOpen(false);
                        void reset();
                      } else setResetArmed(true);
                    }}
                  >
                    {resetArmed ? "Kalıcı olarak sıfırla" : "Kariyeri sıfırla"}
                  </button>
                  {resetArmed ? (
                    <button
                      className="text-button"
                      onClick={() => setResetArmed(false)}
                    >
                      Vazgeç
                    </button>
                  ) : null}
                </section>
              </section>
            ) : null}
            <section
              className={`score-card journey-score ${completedSales.tone}`}
            >
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
                      {category} · Seviye{" "}
                      {categoryExpertiseLevel(game, category)}{" "}
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
                    <button
                      className="home-purchase-button"
                      onClick={() => {
                        if (buyHome()) setHomeFinaleOpen(true);
                      }}
                    >
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
                      <button onClick={() => navigate("portfolio")}>
                        Portföyü aç
                      </button>
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
                    Temel döngüyü öğrenip ilk kârlı satışını tamamladığında
                    açılır.
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
              {(
                ["ALL", "FIRSTS", "RECORDS", "MILESTONES", "HOME"] as const
              ).map((filter) => (
                <button
                  className={timelineFilter === filter ? "active" : ""}
                  key={filter}
                  onClick={() => setTimelineFilter(filter)}
                >
                  {timelineFilterLabel(filter)}
                </button>
              ))}
            </div>
            {!timeline.length ? (
              <div className="empty compact-empty">
                <h3>Bu grupta olay yok</h3>
                <p>
                  Anlamlı ilkler, rekorlar ve eşikler gerçek işlemlerinden
                  doğar.
                </p>
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
          </>
        ) : null}
      </main>

      <nav aria-label="Ana bölümler">
        {(
          [
            ["market", "home", "Pazar"],
            ["follow", "follow", "Takip"],
            ["portfolio", "portfolio", "Portföy"],
            ["journey", "journey", "Yolculuk"],
          ] as const satisfies ReadonlyArray<readonly [Tab, IconName, string]>
        ).map(([item, icon, label]) => (
          <button
            className={tab === item ? "active" : ""}
            key={item}
            onClick={() => navigate(item)}
            aria-label={label}
            aria-describedby={
              item === "portfolio" && pendingBuyerOfferCount > 0
                ? "pending-buyer-offers"
                : undefined
            }
            aria-current={tab === item ? "page" : undefined}
          >
            <span className="nav-icon">
              <Icon name={icon} />
            </span>
            <span className="nav-label">{label}</span>
            {item === "portfolio" && pendingBuyerOfferCount > 0 ? (
              <>
                <span className="nav-offer-count" aria-hidden="true">
                  {pendingBuyerOfferCount}
                </span>
                <span id="pending-buyer-offers" className="sr-only">
                  {pendingBuyerOfferCount} alıcı teklifi bekliyor
                </span>
              </>
            ) : null}
          </button>
        ))}
      </nav>

      {homeFinaleOpen ? (
        <section
          className="home-finale"
          role="dialog"
          aria-modal="true"
          aria-labelledby="home-finale-title"
        >
          <div className="home-finale-glow" aria-hidden="true" />
          <div className="home-finale-house" aria-hidden="true">
            <Icon name="home" />
          </div>
          <small>ZERO TO HOME</small>
          <h2 id="home-finale-title">Anahtar artık sende.</h2>
          <p>
            Sıfırdan başladın. Aldın, hazırladın, sattın ve kendi evine ulaştın.
          </p>
          {finaleHighlights.length ? (
            <div
              className="home-finale-highlights"
              aria-label="Yolculuğundan anlar"
            >
              {finaleHighlights.map((event) => (
                <span key={event.id}>
                  <b>{simplifyLegacyPlayerCopy(event.label)}</b>
                  {event.amountMinor !== undefined
                    ? money(event.amountMinor)
                    : null}
                </span>
              ))}
            </div>
          ) : null}
          <button
            ref={homeFinaleButtonRef}
            onClick={() => setHomeFinaleOpen(false)}
          >
            Yolculuğa devam et
          </button>
        </section>
      ) : null}

      {selected ? (
        <div className="scrim" onClick={() => setSelectedId(null)}>
          <section
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
                aria-label="Kapat"
              >
                <Icon name="close" />
              </button>
              <div className="sheet-hero-shell">
                <ProductVisual
                  instance={selected.instance}
                  className="hero-art"
                  alt={selected.instance.family.name}
                  priority
                />
                <span className="sheet-category">
                  {selected.instance.family.category}
                </span>
              </div>
              <div className="sheet-summary">
                <div className="sheet-title">
                  <small>{sellerLabel[selected.seller]} satıcı</small>
                  <h2 id="listing-detail-title">
                    {selected.instance.family.name}
                  </h2>
                </div>
                <div className="detail-price">
                  <div>
                    <small>İLAN FİYATI</small>
                    <strong>{money(selected.priceMinor)}</strong>
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
                      signal(
                        selected,
                        categoryExpertiseLevel(
                          game,
                          selected.instance.family.category,
                        ),
                      ).text
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
                    ? "Takipten çıkar"
                    : "İlanı takip et"}
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
                    Ürün alarmı kur
                  </button>
                ) : (
                  <span>Ürün alarmı Seviye 3'te açılır</span>
                )}
              </div>
              <div className="band">
                <div>
                  <span>Tahmini fiyat aralığı</span>
                  <b>
                    {money(
                      listingEstimateBand(
                        selected,
                        categoryExpertiseLevel(
                          game,
                          selected.instance.family.category,
                        ),
                      ).lowMinor,
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
                  <span>Kondisyon</span>
                  <b>%{selected.instance.condition}</b>
                </div>
                <div>
                  <span>Bilgi güveni</span>
                  <b>{evidenceLabel(selected.instance.evidenceConfidence)}</b>
                </div>
                <div>
                  <span>Pazarlık hakkı</span>
                  <b aria-label={`${offers} pazarlık hakkı kaldı`}>
                    {"● ".repeat(offers)}
                    {"○ ".repeat(2 - offers)}
                  </b>
                </div>
              </div>
              <section className="evidence-panel">
                <button
                  className="evidence-toggle"
                  aria-expanded={evidenceExpanded || ftueActive}
                  onClick={() =>
                    !ftueActive && setEvidenceExpanded((expanded) => !expanded)
                  }
                >
                  <span>
                    <small>ÜRÜN KONTROLLERİ</small>
                    <b>
                      Bilgi güveni %
                      {Math.round(selected.instance.evidenceConfidence * 100)}
                    </b>
                  </span>
                  <span aria-hidden="true">
                    {evidenceExpanded || ftueActive ? "−" : "+"}
                  </span>
                </button>
                {evidenceExpanded || ftueActive ? (
                  <div className="evidence-content">
                    {selected.instance.evidence.map((record) => {
                      const definition = selected.instance.family.evidence.find(
                        (item) => item.id === record.definitionId,
                      );
                      const evidenceState = evidencePresentation(record.status);
                      return (
                        <p className="evidence-row" key={record.definitionId}>
                          <b>{definition?.label}</b>
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
                          ? "Karşılaştırmayı kapat"
                          : "Benzer ilanlarla karşılaştır"}
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </section>
              {comparing ? (
                <div className="compare-stack" ref={comparisonRef}>
                  <h3>Aynı ürün grubu · {comparables.length} ilan</h3>
                  {comparables.length < 2 ? (
                    <p>
                      Şu anda aynı ürün grubunda karşılaştırılabilecek başka
                      aktif ilan yok.
                    </p>
                  ) : (
                    <>
                      <p>
                        Farklı satırlar işaretli. Satıcı tipi güvenilirlik
                        garantisi değildir; inceleme bulgularını karşılaştır.
                      </p>
                      {comparables.map((item, index) => (
                        <section
                          className="compare-card"
                          key={item.id}
                          aria-label={`İlan ${index + 1}`}
                        >
                          <h4>
                            İlan {index + 1} ·{" "}
                            {index === 0 ? "Açık ilan" : "Alternatif"}
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
                                  {row.different ? <small>Farklı</small> : null}
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
                              İlan {index + 1} detaylarını aç
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
              aria-label="Satın alma adımları"
            >
              <div className="sheet-decision-heading">
                <small>KARARIN</small>
                <span>Nakit {money(game.cashMinor)}</span>
              </div>
              {purchaseFeedback ? (
                <p className="sheet-feedback" role="status">
                  {purchaseFeedback}
                </p>
              ) : null}
              {(!ftueActive || game.ftue.stage === "NEGOTIATION") &&
              offers === 1 &&
              !negotiating?.closed ? (
                <p className="sheet-step">
                  ● ○ Son teklifin. Bu teklif reddedilirse görüşme kapanır.
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
                  Karşı teklifi kabul et · {money(budget.counter.amountMinor)}
                  <small>{balanceCopy(budget.counter)}</small>
                </button>
              ) : null}
              {!ftueActive && budget?.offer ? (
                <div
                  className="offer-mode-picker"
                  role="group"
                  aria-label="Teklif tarzı"
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
                        <strong>{amount ? money(amount) : "—"}</strong>
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
                      Pazarlık et
                      {!ftueActive
                        ? ` · ${offerModeOptions.find((option) => option.mode === purchaseOfferMode)?.label}`
                        : ""}
                      {budget?.offer ? (
                        <>
                          <small>
                            {money(budget.offer.amountMinor)} teklif · {offers}{" "}
                            hak
                          </small>
                          <small>{balanceCopy(budget.offer)}</small>
                        </>
                      ) : (
                        <small>Görüşme kapandı</small>
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
                        Hemen al{" "}
                        <small>{money(budget.direct.amountMinor)}</small>
                        <small>{balanceCopy(budget.direct)}</small>
                      </button>
                    ) : null}
                  </div>
                  {budget && budget.shortfallMinor > 0 ? (
                    <div className="cash-shortfall">
                      <p>
                        Bu alış için en az {money(budget.shortfallMinor)} nakit
                        eksik.
                      </p>
                      <button
                        onClick={() => {
                          setSelectedId(null);
                          navigate("portfolio");
                          setPortfolioSegment("inventory");
                        }}
                      >
                        Satabileceğin ürünleri gör
                      </button>
                    </div>
                  ) : null}
                </>
              ) : (
                <>
                  <p className="sheet-step">
                    {game.ftue.stage === "COMPARE"
                      ? "1 / 3 · Benzer ilanların fiyatlarına bak."
                      : "2 / 3 · Ürünü nasıl kontrol edeceğini seç."}
                  </p>
                  {game.ftue.stage === "COMPARE" ? (
                    <button
                      className="primary sheet-next"
                      onClick={toggleComparison}
                    >
                      Benzer ilanlarla karşılaştır
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
    </div>
  );
}
