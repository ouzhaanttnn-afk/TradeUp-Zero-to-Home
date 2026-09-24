import { Haptics, NotificationType } from "@capacitor/haptics";
import { create } from "zustand";
import {
  buyerCounterMinor,
  counterBuyerOffer,
  createPlayerListing,
  purchaseHome,
  purchaseListing,
  quoteAssetExit,
  rejectBuyerOffer,
  revisePlayerListing,
  settleAssetSale,
  withdrawPlayerListing,
} from "../domain/economy";
import {
  BUYER_TEMPO_CONFIG,
  VALUATION_CONFIG,
  WORLD_CONFIG,
} from "../domain/config";
import { comparableListings, inspectListing } from "../domain/decision";
import { startPreparation } from "../domain/preparation";
import {
  addSavedSearch,
  gainExpertise,
  isValidSavedSearch,
  marketExpertiseLevel,
  recordCompletedSaleMeta,
  removeSavedSearch,
  toggleWatch,
} from "../domain/meta";
import {
  setAnalyticsEnabled,
  trackAnalytics,
} from "../infrastructure/analytics";
import { playFeedbackSound, type FeedbackSound } from "../infrastructure/audio";
import {
  clearReplayDiagnostics,
  recordReplayCommand,
} from "../infrastructure/replayDiagnostics";
import { saleDecisionCause } from "../ui/decisionCause";
import {
  dismissFtueStage,
  isFtueActive,
  recordFtueBuyerSale,
  recordFtueCompare,
  recordFtueEvidence,
  recordFtueListing,
  recordFtuePreparation,
  recordFtuePurchase,
  recordFtueWithdrawal,
  revealFirstMarket,
} from "../domain/ftue";
import {
  advanceRewardState,
  rechargeMarketScanCredits,
} from "../domain/monetization";
import { shouldShowTradeInterstitial } from "../domain/tradeInterstitial";
import { isAnimatedAvatar, ownsAnimatedAvatars } from "../domain/profile";
import { homeOptionById, isTopTierHome } from "../content/homes";
import type {
  AvatarId,
  InspectionKind,
  MonetizationProductId,
  PreparationKind,
  RewardPlacementId,
  SavedSearch,
} from "../domain/models";
import {
  advanceWorldTo,
  advanceOffline,
  scanMarket,
  type WorldAdvanceResult,
} from "../domain/world";
import {
  initialState,
  money,
  playerOfferMinor,
  resolveOffer,
  sellerFloor,
  type GameState,
  type Listing,
  type OwnedAsset,
  type PlayerOfferMode,
} from "../game";
import { t, localizeProduct } from "../i18n";
import { getActiveHomePerk } from "../domain/homePerks";
import { maxShowcaseCapacity, toggleShowcaseItem } from "../domain/showcase";
import type { SpecializationId } from "../domain/specialization";
import { systemTimeProvider } from "../infrastructure/time";

const loadShowcaseIds = (): string[] => {
  if (typeof window === "undefined" || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem("tradeup_showcase_asset_ids");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveShowcaseIds = (ids: string[]) => {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem("tradeup_showcase_asset_ids", JSON.stringify(ids));
  } catch {}
};

const loadSpecialization = (): SpecializationId | null => {
  if (typeof window === "undefined" || !window.localStorage) return null;
  try {
    return (window.localStorage.getItem("tradeup_specialization_id") as SpecializationId) || null;
  } catch {
    return null;
  }
};

const saveSpecialization = (spec: SpecializationId | null) => {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    if (spec) window.localStorage.setItem("tradeup_specialization_id", spec);
    else window.localStorage.removeItem("tradeup_specialization_id");
  } catch {}
};
import type { StoreProductMetadata } from "../infrastructure/monetization";
import {
  getMonetizationAdapters,
  openPrivacyOptions,
  purchaseStoreProduct,
  refreshMonetization,
  restoreStoreProducts,
  runRewardedAction,
} from "../services/monetization";
import {
  clearGame,
  loadGameWithStatus,
  saveGame,
} from "../services/persistence";

type Store = {
  game: GameState;
  ready: boolean;
  sessionActive: boolean;
  notice: string;
  storeProducts: StoreProductMetadata[];
  monetizationBusy: boolean;
  hydrate: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  flush: () => Promise<void>;
  scan: () => void;
  refreshMarketScanCredits: () => void;
  tick: () => void;
  buy: (item: Listing, priceMinor?: number) => boolean;
  buyHome: (homeId: string) => boolean;
  offer: (item: Listing, mode?: PlayerOfferMode) => void;
  sell: (item: OwnedAsset, quick: boolean) => void;
  list: (item: OwnedAsset, askingPriceMinor: number) => void;
  reviseListing: (listingId: string, askingPriceMinor: number) => void;
  withdrawListing: (listingId: string) => void;
  acceptBuyer: (offerId: string) => void;
  counterBuyer: (offerId: string) => void;
  rejectBuyer: (offerId: string) => void;
  inspect: (listingId: string, kind: InspectionKind) => void;
  prepare: (assetId: string, kind: PreparationKind) => void;
  openListing: (listingId: string) => void;
  markCompared: (listingId: string) => void;
  toggleWatch: (listingId: string) => void;
  saveSearch: (
    familyId: string,
    maxPriceMinor: number,
    minCondition: number,
    evidencePreference?: SavedSearch["evidencePreference"],
  ) => void;
  removeSearch: (searchId: string) => void;
  recordImpressions: (listingIds: string[]) => void;
  openJourney: () => void;
  setAnalytics: (enabled: boolean) => void;
  setHaptics: (enabled: boolean) => void;
  setReducedMotion: (enabled: boolean) => void;
  setLargeText: (enabled: boolean) => void;
  setSoundLevel: (level: GameState["accessibility"]["soundLevel"]) => void;
  setProfileName: (displayName: string) => void;
  setProfileAvatar: (avatarId: AvatarId) => void;
  completeProfileOnboarding: (displayName: string, avatarId: AvatarId) => void;
  openPurchases: () => Promise<void>;
  purchaseProduct: (productId: MonetizationProductId) => Promise<void>;
  restorePurchases: () => Promise<void>;
  syncStoreEntitlements: () => Promise<void>;
  showPrivacyOptions: () => Promise<void>;
  claimReward: (placementId: RewardPlacementId) => Promise<void>;
  dismissCoach: () => void;
  reset: () => Promise<void>;
  showcaseAssetIds: string[];
  specialization: SpecializationId | null;
  toggleShowcase: (assetId: string) => void;
  setSpecialization: (spec: SpecializationId) => void;
};

const buzz = (state: GameState, success = false) => {
  if (!state.accessibility.hapticsEnabled) return;
  void Haptics.notification({
    type: success ? NotificationType.Success : NotificationType.Warning,
  }).catch(() => undefined);
};

const sound = (state: GameState, event: FeedbackSound) => {
  if (state.accessibility.soundLevel === "OFF") return;
  void playFeedbackSound(event, state.accessibility.soundLevel).catch(
    () => undefined,
  );
};

const showTradeInterstitialAfterSale = (
  before: GameState,
  after: GameState,
) => {
  if (!shouldShowTradeInterstitial(before, after) || persistenceSuspended)
    return;
  // Show only after the sale save resolves; failure never rolls back the sale.
  void saveQueue
    .then(() => getMonetizationAdapters().showTradeInterstitial?.())
    .catch(() => false);
};

let saveQueue = Promise.resolve();
let persistenceSuspended = false;
let hydration: Promise<void> | undefined;

const enqueueSave = (state: GameState, wallClockMs: number) => {
  if (persistenceSuspended) return Promise.resolve();
  saveQueue = saveQueue
    .catch(() => undefined)
    .then(() => saveGame(state, { nowWallMs: () => wallClockMs }));
  void saveQueue.catch(() => {
    useGameStore.setState({
      notice:
        "İlerlemen cihaza kaydedilemedi. Uygulamayı kapatmadan önce depolama alanını kontrol et.",
    });
  });
  return saveQueue;
};

const stampAndPersist = (state: GameState) => {
  const wallClockMs = Math.max(
    state.lastWallClockMs,
    useGameStore.getState().sessionActive
      ? systemTimeProvider.nowWallMs()
      : state.lastWallClockMs,
  );
  const stamped = { ...state, lastWallClockMs: wallClockMs };
  enqueueSave(stamped, wallClockMs);
  return stamped;
};

const worldEventNotice = (result: WorldAdvanceResult): string | undefined => {
  const { summary } = result;
  if (summary.buyerOffers > 0) {
    return t("notice.newBuyerOffers", { count: summary.buyerOffers });
  }
  if (summary.npcSales > 0) {
    return t("notice.npcSales", { count: summary.npcSales });
  }
  if (summary.marketExpirations > 0) {
    return t("notice.marketExpirations", { count: summary.marketExpirations });
  }
  if (summary.playerListingExpirations > 0) {
    return t("notice.expiredReturned");
  }
  return undefined;
};

const worldNotice = (result: WorldAdvanceResult, fallback: string): string => {
  const event = worldEventNotice(result);
  return event ? `${fallback} ${event}` : fallback;
};

const withBuyerOfferAnalytics = (previous: GameState, state: GameState) => {
  const previousIds = new Set(previous.buyerOffers.map((offer) => offer.id));
  return state.buyerOffers
    .filter((offer) => !previousIds.has(offer.id))
    .reduce(
      (next, offer) =>
        trackAnalytics(
          next,
          "buyer_offer",
          {
            listingId: offer.listingId,
            amountMinor: offer.amountMinor,
            buyerTempoRevision: BUYER_TEMPO_CONFIG.revision,
            buyerType: offer.buyerType ?? "SCRIPTED",
            scripted: offer.id.startsWith("offer:ftue-"),
            listingAgeAtOfferMin: Math.max(
              0,
              offer.expiresAtGameMin -
                WORLD_CONFIG.buyerOfferLifetimeMin -
                (state.playerListings.find(
                  (listing) => listing.id === offer.listingId,
                )?.createdAtGameMin ?? state.gameTimeMin),
            ),
          },
          offer.id,
        ),
      state,
    );
};

const progressBy = (state: GameState, minutes = 1) => {
  const result = advanceWorldTo(state, state.gameTimeMin + minutes);
  return {
    ...result,
    state: withBuyerOfferAnalytics(
      state,
      advanceRewardState(result.state, result.summary.elapsedGameMin),
    ),
  };
};

export const useGameStore = create<Store>((set, get) => ({
  game: initialState(systemTimeProvider.nowWallMs()),
  ready: false,
  sessionActive: true,
  notice: "Piyasa canlı. İyi fırsatlar beklemez.",
  storeProducts: [],
  monetizationBusy: false,
  showcaseAssetIds: loadShowcaseIds(),
  specialization: loadSpecialization(),
  hydrate: () => {
    if (hydration) return hydration;
    hydration = (async () => {
      await saveQueue.catch(() => undefined);
      const { state: loadedGame, recovery } = await loadGameWithStatus();
      const game = rechargeMarketScanCredits(
        loadedGame,
        systemTimeProvider.nowWallMs(),
      );
      const restoredScanCredits = Math.max(
        0,
        game.monetization.marketScanCredits -
          loadedGame.monetization.marketScanCredits,
      );
      // Never overwrite an unreadable save with the temporary fallback career.
      persistenceSuspended = recovery === "STORAGE_UNAVAILABLE";
      const recoveryNotice =
        recovery === "RECOVERED_BACKUP"
          ? "Kayıt sorunu bulundu; son sağlam yedek geri yüklendi."
          : recovery === "RESET_AFTER_CORRUPTION"
            ? "Kayıt ve yedek okunamadı; hasarlı kayıt korundu ve yeni kariyer açıldı."
            : recovery === "STORAGE_UNAVAILABLE"
              ? "Cihaz kaydına erişilemiyor; ilerlemen bu oturumda saklanamayabilir."
              : undefined;
      set((current) => ({
        game,
        ready: true,
        notice:
          recoveryNotice ??
          (restoredScanCredits > 0
            ? `${restoredScanCredits} yenileme hakkın geri doldu.`
            : current.notice),
      }));
      const refreshed = await refreshMonetization(
        game,
        getMonetizationAdapters(),
        () => get().game,
      );
      set({
        game: stampAndPersist(refreshed.state),
        storeProducts: refreshed.products,
      });
    })().finally(() => {
      hydration = undefined;
    });
    return hydration;
  },
  pause: async () => {
    if (!get().sessionActive) return;
    set({ sessionActive: false });
    if (!get().ready) return;
    const current = get().game;
    const game = stampAndPersist({
      ...current,
      lastWallClockMs: Math.max(
        current.lastWallClockMs,
        systemTimeProvider.nowWallMs(),
      ),
    });
    set({ game });
    await saveQueue.catch(() => undefined);
  },
  resume: async () => {
    if (!get().ready) {
      set({ sessionActive: true });
      await get().hydrate();
      return;
    }
    if (get().sessionActive) return;
    const previous = get().game;
    const nowWallMs = systemTimeProvider.nowWallMs();
    recordReplayCommand(previous, "ADVANCE_OFFLINE", {
      wallClockDeltaMs: Math.max(0, nowWallMs - previous.lastWallClockMs),
    });
    const result = advanceOffline(previous, nowWallMs);
    const game = withBuyerOfferAnalytics(
      previous,
      rechargeMarketScanCredits(result.state, nowWallMs),
    );
    const restoredScanCredits = Math.max(
      0,
      game.monetization.marketScanCredits -
        previous.monetization.marketScanCredits,
    );
    set({
      sessionActive: true,
      game: stampAndPersist(game),
      notice: worldNotice(
        result,
        restoredScanCredits > 0
          ? `${restoredScanCredits} yenileme hakkın geri doldu.`
          : "Kaldığın yerden devam ediyorsun.",
      ),
    });
    const refreshed = await refreshMonetization(
      game,
      getMonetizationAdapters(),
      () => get().game,
    );
    set({
      game: stampAndPersist(refreshed.state),
      storeProducts: refreshed.products,
    });
  },
  flush: async () => {
    if (persistenceSuspended) return;
    const state = get().game;
    const wallClockMs = Math.max(
      state.lastWallClockMs,
      systemTimeProvider.nowWallMs(),
    );
    await enqueueSave({ ...state, lastWallClockMs: wallClockMs }, wallClockMs);
  },
  scan: () => {
    recordReplayCommand(get().game, "SCAN_MARKET");
    const previous = rechargeMarketScanCredits(
      get().game,
      systemTimeProvider.nowWallMs(),
    );
    if (previous.monetization.marketScanCredits <= 0) {
      set({
        notice:
          "Tarama hakkın bitti. Pazar kendiliğinden akmaya devam eder; istersen haklarını yenileyebilirsin.",
      });
      return;
    }
    const scanned = scanMarket(previous);
    const result = {
      ...scanned,
      state: withBuyerOfferAnalytics(previous, {
        ...scanned.state,
        monetization: {
          ...scanned.state.monetization,
          marketScanCredits: previous.monetization.marketScanCredits - 1,
        },
      }),
    };
    set({
      game: stampAndPersist(result.state),
      notice: worldNotice(
        result,
        result.summary.arrivals
          ? `${result.summary.arrivals} yeni ilan pazara eklendi.`
          : "Pazar tarandı; mevcut ilanlar yaşamaya devam ediyor.",
      ),
    });
  },
  refreshMarketScanCredits: () => {
    const previous = get().game;
    const game = rechargeMarketScanCredits(
      previous,
      systemTimeProvider.nowWallMs(),
    );
    if (
      game.monetization.marketScanCredits ===
        previous.monetization.marketScanCredits &&
      game.monetization.marketScanRefillAnchorWallMs ===
        previous.monetization.marketScanRefillAnchorWallMs
    )
      return;
    set({ game: stampAndPersist(game) });
  },
  tick: () => {
    if (!get().sessionActive || !get().ready) return;
    recordReplayCommand(get().game, "TICK", {
      minutes: WORLD_CONFIG.activeTickMin,
    });
    const result = progressBy(get().game, WORLD_CONFIG.activeTickMin);
    const rechargedState = rechargeMarketScanCredits(
      result.state,
      systemTimeProvider.nowWallMs(),
    );
    const eventCount =
      result.summary.buyerOffers +
      result.summary.npcSales +
      result.summary.marketExpirations +
      result.summary.playerListingExpirations;
    if (result.summary.buyerOffers > 0) sound(get().game, "OFFER");
    set((current) => ({
      game: stampAndPersist(rechargedState),
      notice: eventCount
        ? (worldEventNotice(result) ?? current.notice)
        : current.notice,
    }));
  },
  buy: (item, priceMinor = item.priceMinor) => {
    const game = get().game;
    recordReplayCommand(game, "BUY_LISTING", {
      listingId: item.id,
      priceMinor,
    });
    if (isFtueActive(game) && game.ftue.stage !== "NEGOTIATION") {
      set({
        notice: "İlk alımdan önce karşılaştırma ve kanıt adımlarını tamamla.",
      });
      return false;
    }
    const result = purchaseListing(game, item, priceMinor, game.gameTimeMin);
    if (!result.ok) {
      const notice =
        result.reason === "INSUFFICIENT_CASH"
          ? `${money(priceMinor - game.cashMinor)} nakit eksik. Önce satış yap.`
          : "Bu ilan artık satın alınamıyor.";
      set({ notice });
      buzz(game);
      sound(game, "WARNING");
      return false;
    }
    if (result.idempotent) {
      set({ notice: "Bu ürün zaten satın alındı." });
      return true;
    }
    const purchasedAssetId = `asset:${item.id}`;
    let next = gainExpertise(
      result.state,
      "purchase",
      item.familyId,
      `purchase:${item.id}`,
    );
    next = recordFtuePurchase(next, purchasedAssetId);
    next = trackAnalytics(
      next,
      "purchase_complete",
      {
        familyId: item.familyId,
        priceMinor,
        valuationRevision: VALUATION_CONFIG.revision,
      },
      item.id,
    );
    const progressed = progressBy(next);
    set({
      game: stampAndPersist(progressed.state),
      notice: worldNotice(
        progressed,
        `${item.instance.family.name} envanterine eklendi.`,
      ),
    });
    buzz(game, true);
    sound(game, "PURCHASE");
    return true;
  },
  buyHome: (homeId) => {
    const game = get().game;
    const home = homeOptionById(homeId);
    if (!home) {
      set({ notice: "Bu ev ilanı artık bulunamıyor." });
      return false;
    }
    recordReplayCommand(game, "BUY_HOME", {
      homeId,
      priceMinor: home.priceMinor,
    });
    const result = purchaseHome(
      game,
      homeId,
      `home-purchase:${homeId}`,
      game.gameTimeMin,
    );
    if (!result.ok) {
      const notice =
        result.reason === "INSUFFICIENT_CASH"
          ? t("notice.homeCashShortfall", { shortfall: money(home.priceMinor - game.cashMinor) })
          : result.reason === "HOME_NOT_UNLOCKED"
            ? t("notice.homeNotUnlocked")
            : result.reason === "HOME_NOT_AVAILABLE"
              ? t("notice.homeNotAvailable")
              : t("notice.homeAlreadyOwned");
      set({ notice });
      buzz(game);
      sound(game, "WARNING");
      return false;
    }
    if (result.idempotent) {
      set({ notice: t("notice.homeAlreadyOwned") });
      return true;
    }
    const wasFirstHome = !game.home.purchasedHomeId;
    const notice = wasFirstHome
      ? t("notice.firstHomeOwned", { home: home.name })
      : isTopTierHome(homeId)
        ? t("notice.topTierHomeOwned", { home: home.name })
        : t("notice.homeUpgraded", { home: home.name });
    set({
      game: stampAndPersist(result.state),
      notice,
    });
    buzz(game, true);
    sound(game, "SALE_PROFIT");
    return true;
  },
  offer: (item, mode = "BALANCED") => {
    const game = get().game;
    recordReplayCommand(game, "MAKE_OFFER", {
      listingId: item.id,
      mode,
    });
    if (isFtueActive(game) && game.ftue.stage !== "NEGOTIATION") {
      set({ notice: t("notice.ftueCheckCompare") });
      return;
    }
    const currentListing = game.listings.find(
      (listing) => listing.id === item.id,
    );
    if (
      !currentListing ||
      (currentListing.state !== "ACTIVE" &&
        currentListing.state !== "WATCHED" &&
        currentListing.state !== "NEGOTIATING")
    ) {
      set({ notice: t("notice.listingNotInMarket") });
      return;
    }
    if (currentListing.priceMinor !== item.priceMinor) {
      set({
        notice: t("notice.listingPriceChanged"),
      });
      return;
    }
    const current =
      game.negotiations[item.id] ??
      (game.negotiation?.listingId === item.id
        ? game.negotiation
        : {
            listingId: item.id,
            offersRemaining: 2 as const,
            sellerFloorMinor: sellerFloor(currentListing),
            closed: false,
          });
    if (current.closed || current.offersRemaining === 0) {
      set({ notice: t("notice.negotiationClosed") });
      return;
    }
    const index = current.offersRemaining === 2 ? 1 : 2;
    const offerMinor = playerOfferMinor(currentListing.priceMinor, index, mode);
    const result = resolveOffer(
      currentListing,
      offerMinor,
      index,
      current.sellerFloorMinor,
    );
    const offeredGame = trackAnalytics(
      game,
      "offer_submitted",
      {
        familyId: item.familyId,
        offerMinor,
        offerIndex: index,
        offerMode: mode,
      },
      `${item.id}:${index}`,
    );
    if (result.result === "accepted") {
      const acceptedGame: GameState = {
        ...offeredGame,
        negotiation: {
          ...current,
          offersRemaining: (current.offersRemaining - 1) as 0 | 1,
          closed: true,
        },
        negotiations: {
          ...offeredGame.negotiations,
          [item.id]: {
            ...current,
            offersRemaining: (current.offersRemaining - 1) as 0 | 1,
            closed: true,
          },
        },
      };
      set({ game: stampAndPersist(acceptedGame) });
      get().buy(currentListing, offerMinor);
      return;
    }
    const remaining = (current.offersRemaining - 1) as 0 | 1;
    const negotiation = {
      ...current,
      offersRemaining: remaining,
      counterMinor: result.counterMinor,
      closed: remaining === 0,
    };
    const negotiatingState: GameState = {
      ...offeredGame,
      negotiation,
      negotiations: { ...offeredGame.negotiations, [item.id]: negotiation },
      listings: game.listings.map((listing) =>
        listing.id === item.id ? { ...listing, state: "NEGOTIATING" } : listing,
      ),
    };
    const progressed = progressBy(negotiatingState);
    const fallback =
      result.result === "counter"
        ? t("notice.sellerCountered", { price: money(result.counterMinor ?? 0) })
        : remaining
          ? t("notice.offerRejectedLastChance")
          : t("notice.finalOfferRejected");
    set({
      game: stampAndPersist(progressed.state),
      notice: worldNotice(progressed, fallback),
    });
    buzz(game);
    sound(game, "OFFER");
  },
  sell: (item, quick) => {
    const game = get().game;
    recordReplayCommand(game, "QUICK_SALE", {
      assetId: item.id,
      quick,
    });
    if (isFtueActive(game) && game.ftue.firstAssetId === item.id) {
      set({ notice: t("notice.ftueListBalanced") });
      return;
    }
    const transactionId = `sale:direct:${item.id}`;
    if (game.transactionJournal.some((entry) => entry.id === transactionId)) {
      set({ notice: t("notice.saleAlreadyCompleted") });
      return;
    }
    const currentAsset = game.ownedAssets.find((asset) => asset.id === item.id);
    if (
      !currentAsset ||
      !["IN_INVENTORY", "READY"].includes(currentAsset.state)
    ) {
      set({
        notice: t("notice.notEligibleQuickSale"),
      });
      return;
    }
    const quote = quoteAssetExit(currentAsset);
    const previousQuote = quoteAssetExit(item);
    const saleMinor = quick ? quote.quickSaleMinor : quote.balancedAskingMinor;
    const previousSaleMinor = quick
      ? previousQuote.quickSaleMinor
      : previousQuote.balancedAskingMinor;
    if (
      saleMinor !== previousSaleMinor ||
      currentAsset.bookCostMinor !== item.bookCostMinor ||
      currentAsset.state !== item.state
    ) {
      set({
        notice: t("notice.saleDetailsChanged"),
      });
      return;
    }
    const result = settleAssetSale(
      game,
      item.id,
      saleMinor,
      transactionId,
      game.gameTimeMin,
      currentAsset.currentListingId,
    );
    if (!result.ok) {
      set({ notice: t("notice.cannotSellItem") });
      buzz(game);
      sound(game, "WARNING");
      return;
    }
    if (result.idempotent) {
      set({ notice: t("notice.saleAlreadyCompleted") });
      return;
    }
    const withMeta = recordCompletedSaleMeta(
      game,
      result.state,
      item.id,
      transactionId,
    );
    const progressed = progressBy(withMeta);
    const cause = saleDecisionCause(currentAsset, saleMinor);
    const prodName = localizeProduct(currentAsset.instance.family.name);
    set({
      game: stampAndPersist(progressed.state),
      notice: worldNotice(
        progressed,
        t("notice.itemSold", { product: prodName, price: money(saleMinor), cause }),
      ),
    });
    showTradeInterstitialAfterSale(game, progressed.state);
    const profitable = saleMinor >= currentAsset.bookCostMinor;
    buzz(game, profitable);
    sound(game, profitable ? "SALE_PROFIT" : "SALE_LOSS");
  },
  list: (item, askingPriceMinor) => {
    const game = get().game;
    recordReplayCommand(game, "CREATE_LISTING", {
      assetId: item.id,
      askingPriceMinor,
    });
    if (isFtueActive(game) && game.ftue.stage !== "LISTING") {
      set({ notice: t("notice.ftueFinishPrepFirst") });
      return;
    }
    const result = createPlayerListing(
      game,
      item.id,
      askingPriceMinor,
      game.gameTimeMin,
    );
    if (!result.ok) {
      set({ notice: t("notice.cannotList") });
      buzz(game);
      sound(game, "WARNING");
      return;
    }
    if (result.idempotent) {
      set({ notice: t("notice.listingAlreadyCreated") });
      return;
    }
    let next = recordFtueListing(result.state, item.id);
    next = withBuyerOfferAnalytics(result.state, next);
    next = trackAnalytics(
      next,
      "listing_created",
      { familyId: item.familyId, askingPriceMinor },
      next.playerListings.find(
        (listing) =>
          listing.ownedAssetId === item.id && listing.state === "ACTIVE",
      )?.id,
    );
    const progressed = progressBy(next);
    const prodName = localizeProduct(item.instance.family.name);
    set({
      game: stampAndPersist(progressed.state),
      notice: worldNotice(
        progressed,
        t("notice.listedForSale", { product: prodName }),
      ),
    });
    sound(game, "LISTING");
  },
  reviseListing: (listingId, askingPriceMinor) => {
    const game = get().game;
    recordReplayCommand(game, "REVISE_LISTING", {
      listingId,
      askingPriceMinor,
    });
    const listing = game.playerListings.find((item) => item.id === listingId);
    const asset = listing
      ? game.ownedAssets.find((item) => item.id === listing.ownedAssetId)
      : undefined;
    const result = revisePlayerListing(
      game,
      listingId,
      askingPriceMinor,
      game.gameTimeMin,
    );
    if (!result.ok) {
      set({
        notice:
          result.reason === "ACTIVE_BUYER_OFFER"
            ? t("notice.answerBuyerOfferFirst")
            : t("notice.cannotChangePrice"),
      });
      buzz(game);
      sound(game, "WARNING");
      return;
    }
    if (result.idempotent) {
      set({ notice: t("notice.priceAlreadySame") });
      return;
    }
    const progressed = progressBy(result.state);
    const prodName = asset ? localizeProduct(asset.instance.family.name) : t("nav.portfolio");
    set({
      game: stampAndPersist(progressed.state),
      notice: worldNotice(
        progressed,
        t("notice.priceUpdated", { product: prodName, price: money(askingPriceMinor) }),
      ),
    });
    sound(game, "LISTING");
  },
  withdrawListing: (listingId) => {
    const game = get().game;
    recordReplayCommand(game, "WITHDRAW_LISTING", { listingId });
    const listing = game.playerListings.find((item) => item.id === listingId);
    const asset = listing
      ? game.ownedAssets.find((item) => item.id === listing.ownedAssetId)
      : undefined;
    const result = withdrawPlayerListing(game, listingId, game.gameTimeMin);
    if (!result.ok) {
      set({ notice: t("notice.cannotWithdraw") });
      buzz(game);
      sound(game, "WARNING");
      return;
    }
    if (result.idempotent) {
      set({ notice: t("notice.alreadyWithdrawn") });
      return;
    }
    const progressed = progressBy(
      recordFtueWithdrawal(result.state, listingId),
    );
    const prodName = asset ? localizeProduct(asset.instance.family.name) : t("nav.portfolio");
    set({
      game: stampAndPersist(progressed.state),
      notice: worldNotice(
        progressed,
        t("notice.returnedToInventory", { product: prodName }),
      ),
    });
  },
  acceptBuyer: (offerId) => {
    const game = get().game;
    recordReplayCommand(game, "ACCEPT_BUYER_OFFER", { offerId });
    const buyerOffer = game.buyerOffers.find((item) => item.id === offerId);
    const listing = buyerOffer
      ? game.playerListings.find((item) => item.id === buyerOffer.listingId)
      : undefined;
    if (!buyerOffer || !listing) return;
    if (
      buyerOffer.expiresAtGameMin <= game.gameTimeMin ||
      listing.expiresAtGameMin <= game.gameTimeMin ||
      listing.state !== "ACTIVE"
    ) {
      set({
        notice: t("notice.offerNoLongerValid"),
      });
      buzz(game);
      sound(game, "WARNING");
      return;
    }
    const transactionId = `sale:buyer:${buyerOffer.id}`;
    const result = settleAssetSale(
      game,
      listing.ownedAssetId,
      buyerOffer.amountMinor,
      transactionId,
      game.gameTimeMin,
      listing.id,
    );
    if (!result.ok) {
      set({ notice: t("notice.offerNoLongerValid") });
      buzz(game);
      sound(game, "WARNING");
      return;
    }
    if (result.idempotent) {
      set({ notice: t("notice.saleAlreadyCompleted") });
      return;
    }
    const ftueProgressed =
      game.ftue.stage === "STARTING_SALE"
        ? revealFirstMarket(result.state)
        : recordFtueBuyerSale(result.state, listing.id);
    const withMeta = recordCompletedSaleMeta(
      game,
      ftueProgressed,
      listing.ownedAssetId,
      transactionId,
    );
    const progressed = progressBy(withMeta);
    set({
      game: stampAndPersist(progressed.state),
      notice: worldNotice(
        progressed,
        t("notice.buyerOfferAccepted", { price: money(buyerOffer.amountMinor) }),
      ),
    });
    showTradeInterstitialAfterSale(game, progressed.state);
    const soldAsset = game.ownedAssets.find(
      (item) => item.id === listing.ownedAssetId,
    );
    const profitable =
      buyerOffer.amountMinor >= (soldAsset?.bookCostMinor ?? 0);
    buzz(game, profitable);
    sound(game, profitable ? "SALE_PROFIT" : "SALE_LOSS");
  },
  counterBuyer: (offerId) => {
    const game = get().game;
    recordReplayCommand(game, "COUNTER_BUYER_OFFER", { offerId });
    const buyerOffer = game.buyerOffers.find((item) => item.id === offerId);
    const listing = buyerOffer
      ? game.playerListings.find((item) => item.id === buyerOffer.listingId)
      : undefined;
    const counterMinor =
      buyerOffer && listing
        ? buyerCounterMinor(buyerOffer, listing)
        : undefined;
    if (!buyerOffer || !listing || counterMinor === undefined) {
      set({ notice: t("notice.cannotCounterOffer") });
      return;
    }
    const result = counterBuyerOffer(
      game,
      offerId,
      counterMinor,
      game.gameTimeMin,
    );
    if (!result.ok) {
      set({ notice: t("notice.noNegotiationRightsLeft") });
      buzz(game);
      sound(game, "WARNING");
      return;
    }
    if (result.outcome === "ACCEPTED") {
      const transactionId = result.transactionId!;
      const ftueProgressed = recordFtueBuyerSale(result.state, listing.id);
      const withMeta = recordCompletedSaleMeta(
        game,
        ftueProgressed,
        listing.ownedAssetId,
        transactionId,
      );
      const progressed = progressBy(withMeta);
      set({
        game: stampAndPersist(progressed.state),
        notice: worldNotice(
          progressed,
          t("notice.buyerAcceptedCounter", { buyer: buyerOffer.buyer, price: money(result.amountMinor) }),
        ),
      });
      const asset = game.ownedAssets.find(
        (item) => item.id === listing.ownedAssetId,
      );
      const profitable = result.amountMinor >= (asset?.bookCostMinor ?? 0);
      buzz(game, profitable);
      sound(game, profitable ? "SALE_PROFIT" : "SALE_LOSS");
      return;
    }
    set({
      game: stampAndPersist(result.state),
      notice:
        result.outcome === "FINAL"
          ? t("notice.buyerFinalPrice", { buyer: buyerOffer.buyer, price: money(result.amountMinor) })
          : t("notice.buyerWithdrew", { buyer: buyerOffer.buyer }),
    });
    sound(game, result.outcome === "FINAL" ? "OFFER" : "WARNING");
  },
  rejectBuyer: (offerId) => {
    const game = get().game;
    recordReplayCommand(game, "REJECT_BUYER_OFFER", { offerId });
    const buyerOffer = game.buyerOffers.find((item) => item.id === offerId);
    const result = rejectBuyerOffer(game, offerId);
    if (!result.ok) {
      set({ notice: t("notice.offerNoLongerValid") });
      return;
    }
    set({
      game: stampAndPersist(result.state),
      notice: t("notice.buyerOfferRejected", { buyer: buyerOffer?.buyer ?? t("notice.buyerGeneric") }),
    });
  },
  inspect: (listingId, kind) => {
    const game = get().game;
    recordReplayCommand(game, "INSPECT_LISTING", { listingId, kind });
    if (isFtueActive(game) && game.ftue.stage !== "EVIDENCE") {
      set({ notice: t("notice.ftueCheckCompareFirst") });
      return;
    }
    const result = inspectListing(game, listingId, kind);
    if (!result.ok) {
      set({ notice: t("notice.cannotInspect") });
      return;
    }
    if (result.idempotent) {
      set({ notice: t("notice.inspectionAlreadyDone") });
      return;
    }
    const listing = result.state.listings.find((item) => item.id === listingId);
    let next = gainExpertise(
      result.state,
      "inspection",
      listing?.familyId,
      `${listingId}:${kind}`,
    );
    next = recordFtueEvidence(next);
    next = trackAnalytics(
      next,
      "evidence_action",
      { listingId, kind, familyId: listing?.familyId },
      `${listingId}:${kind}`,
    );
    const progressed = progressBy(next, result.durationMin);
    set({
      game: stampAndPersist(progressed.state),
      notice: worldNotice(
        progressed,
        t("notice.evidenceNarrowedBand"),
      ),
    });
  },
  prepare: (assetId, kind) => {
    const game = get().game;
    recordReplayCommand(game, "PREPARE_ASSET", { assetId, kind });
    if (isFtueActive(game) && game.ftue.stage !== "PREPARATION") {
      set({ notice: t("notice.prepUnlockedAfterPurchase") });
      return;
    }
    const result = startPreparation(game, assetId, kind);
    if (!result.ok) {
      set({
        notice:
          result.reason === "INSUFFICIENT_CASH"
            ? t("notice.insufficientCashForPrep")
            : t("notice.prepNotAvailable"),
      });
      return;
    }
    if (result.idempotent) {
      set({ notice: t("notice.prepAlreadyDone") });
      return;
    }
    const tracked = trackAnalytics(
      result.state,
      "preparation_started",
      {
        assetId,
        kind,
        costMinor: Math.abs(
          result.state.transactionJournal.at(-1)?.cashDeltaMinor ?? 0,
        ),
      },
      `${assetId}:${kind}:${result.state.gameTimeMin}`,
    );
    const homePerk = getActiveHomePerk(game.home);
    const spec = get().specialization;
    const durationDiscount =
      (homePerk?.prepDurationDiscount ?? 0) + (spec === "RESTORER" ? 0.25 : 0);
    const effectiveDuration = Math.max(
      1,
      Math.round(result.durationMin * (1 - Math.min(0.5, durationDiscount))),
    );
    const progressed = progressBy(tracked, effectiveDuration);
    set({
      game: stampAndPersist(recordFtuePreparation(progressed.state, assetId)),
      notice: worldNotice(
        progressed,
        t("notice.prepCompletedAddedCost"),
      ),
    });
  },
  openListing: (listingId) => {
    const game = get().game;
    const listing = game.listings.find((item) => item.id === listingId);
    if (
      !listing ||
      !["ACTIVE", "WATCHED", "NEGOTIATING"].includes(listing.state)
    )
      return;
    let next = gainExpertise(game, "listingOpen", listing.familyId, listing.id);
    next = trackAnalytics(
      next,
      "listing_open",
      { listingId, familyId: listing.familyId },
      listingId,
    );
    set({ game: stampAndPersist(next) });
  },
  markCompared: (listingId) => {
    const game = get().game;
    if (comparableListings(game, listingId).length < 2) return;
    const listing = game.listings.find((item) => item.id === listingId);
    let next = gainExpertise(game, "compare", listing?.familyId, listingId);
    next = recordFtueCompare(next);
    next = trackAnalytics(
      next,
      "compare_started",
      { listingId, familyId: listing?.familyId },
      listingId,
    );
    if (next === game) return;
    set({
      game: stampAndPersist(next),
      notice: t("notice.differencesSeenCheckEvidence"),
    });
  },
  toggleWatch: (listingId) => {
    const game = get().game;
    const next = toggleWatch(game, listingId);
    if (next === game) return;
    const watched = next.follow.watchedListingIds.includes(listingId);
    set({
      game: stampAndPersist(next),
      notice: watched
        ? t("notice.addedToFollow")
        : t("notice.removedFromFollow"),
    });
  },
  saveSearch: (
    familyId,
    maxPriceMinor,
    minCondition,
    evidencePreference = "ANY",
  ) => {
    const game = get().game;
    if (marketExpertiseLevel(game) < 3) {
      set({ notice: t("notice.alarmUnlockedLevel3") });
      return;
    }
    if (
      !isValidSavedSearch(
        familyId,
        maxPriceMinor,
        minCondition,
        evidencePreference,
      )
    ) {
      set({
        notice: t("notice.alarmInvalidCheck"),
      });
      return;
    }
    const next = addSavedSearch(
      game,
      familyId,
      maxPriceMinor,
      minCondition,
      evidencePreference,
    );
    set({
      game: stampAndPersist(next),
      notice:
        next === game ? t("notice.alarmAlreadySaved") : t("notice.alarmSaved"),
    });
  },
  removeSearch: (searchId) => {
    const next = removeSavedSearch(get().game, searchId);
    set({ game: stampAndPersist(next), notice: t("notice.alarmRemoved") });
  },
  recordImpressions: (listingIds) => {
    let next = get().game;
    for (const listingId of listingIds) {
      const listing = next.listings.find((item) => item.id === listingId);
      if (!listing) continue;
      next = trackAnalytics(
        next,
        "listing_impression",
        {
          listingId,
          familyId: listing.familyId,
          priceMinor: listing.priceMinor,
          condition: listing.instance.condition,
          valuationRevision: VALUATION_CONFIG.revision,
        },
        listingId,
      );
    }
    if (next !== get().game) set({ game: stampAndPersist(next) });
  },
  openJourney: () => {
    const game = get().game;
    const next = trackAnalytics(
      game,
      "career_timeline_opened",
      { eventCount: game.career.length },
      `open:${game.gameTimeMin}:${game.career.length}`,
    );
    if (next !== game) set({ game: stampAndPersist(next) });
  },
  setAnalytics: (enabled) => {
    const next = setAnalyticsEnabled(get().game, enabled);
    set({
      game: stampAndPersist(next),
      notice: enabled
        ? "İsteğe bağlı analitik açıldı."
        : "Analitik kapatıldı ve yerel olay kuyruğu temizlendi.",
    });
  },
  setHaptics: (enabled) => {
    const game = get().game;
    set({
      game: stampAndPersist({
        ...game,
        accessibility: { ...game.accessibility, hapticsEnabled: enabled },
      }),
      notice: enabled
        ? "Dokunsal geri bildirim açıldı."
        : "Dokunsal geri bildirim kapatıldı.",
    });
  },
  setReducedMotion: (enabled) => {
    const game = get().game;
    set({
      game: stampAndPersist({
        ...game,
        accessibility: { ...game.accessibility, reducedMotion: enabled },
      }),
      notice: enabled
        ? "Arayüz hareketleri azaltıldı."
        : "Arayüz hareketleri açıldı.",
    });
  },
  setLargeText: (enabled) => {
    const game = get().game;
    set({
      game: stampAndPersist({
        ...game,
        accessibility: { ...game.accessibility, largeText: enabled },
      }),
      notice: enabled
        ? "Büyük metin görünümü açıldı."
        : "Standart metin görünümü açıldı.",
    });
  },
  setSoundLevel: (level) => {
    const game = get().game;
    const label =
      level === "OFF" ? "kapalı" : level === "LOW" ? "düşük" : "normal";
    set({
      game: stampAndPersist({
        ...game,
        accessibility: { ...game.accessibility, soundLevel: level },
      }),
      notice: `Ses seviyesi ${label} olarak ayarlandı.`,
    });
  },
  setProfileName: (displayName) => {
    const normalized = displayName.trim().replace(/\s+/g, " ").slice(0, 20);
    if (!normalized) {
      set({ notice: "Oyuncu adı boş bırakılamaz." });
      return;
    }
    const game = get().game;
    set({
      game: stampAndPersist({
        ...game,
        profile: { ...game.profile, displayName: normalized },
      }),
      notice: "Profil adı kaydedildi.",
    });
  },
  setProfileAvatar: (avatarId) => {
    const game = get().game;
    const premiumAvatar = isAnimatedAvatar(avatarId);
    const ownsPremiumAvatars = ownsAnimatedAvatars(game);
    if (premiumAvatar && !ownsPremiumAvatars) {
      set({ notice: "Canlı avatar paketi bu avatar için gerekli." });
      return;
    }
    set({
      game: stampAndPersist({
        ...game,
        profile: { ...game.profile, avatarId },
      }),
      notice: "Profil avatarı değiştirildi.",
    });
  },
  completeProfileOnboarding: (displayName, avatarId) => {
    const normalized = displayName.trim().replace(/\s+/g, " ").slice(0, 20);
    if (!normalized) {
      set({ notice: "Oyuncu adı boş bırakılamaz." });
      return;
    }
    const game = get().game;
    const premiumAvatar = isAnimatedAvatar(avatarId);
    const ownsPremiumAvatars = ownsAnimatedAvatars(game);
    const safeAvatarId =
      premiumAvatar && !ownsPremiumAvatars ? "pazar-kasifi" : avatarId;
    set({
      game: stampAndPersist({
        ...game,
        profile: {
          displayName: normalized,
          avatarId: safeAvatarId,
          onboardingComplete: true,
        },
      }),
      notice: `Hoş geldin, ${normalized}. İlk fırsatın hazır.`,
    });
  },
  openPurchases: async () => {
    if (get().monetizationBusy) return;
    const game = trackAnalytics(
      get().game,
      "iap_opened",
      {},
      `store:${get().game.gameTimeMin}`,
    );
    set({ game: stampAndPersist(game), monetizationBusy: true });
    const refreshed = await refreshMonetization(
      game,
      getMonetizationAdapters(),
      () => get().game,
    );
    set({
      game: stampAndPersist(refreshed.state),
      storeProducts: refreshed.products,
      monetizationBusy: false,
      notice: refreshed.storeAvailable
        ? "Mağaza fiyatları güncellendi."
        : "Mağaza şu anda kullanılamıyor; satın alma kapalı.",
    });
  },
  purchaseProduct: async (productId) => {
    if (get().monetizationBusy) return;
    const metadata = get().storeProducts.find(
      (product) => product.productId === productId && product.available,
    );
    if (!metadata?.localizedPrice) {
      set({ notice: "Mağaza fiyatı yüklenmeden satın alma başlatılamaz." });
      return;
    }
    const before = trackAnalytics(
      get().game,
      "iap_purchase_started",
      { productId },
      `purchase-start:${productId}:${get().game.gameTimeMin}`,
    );
    set({ game: stampAndPersist(before), monetizationBusy: true });
    const result = await purchaseStoreProduct(
      before,
      productId,
      getMonetizationAdapters().billing,
      () => get().game,
    );
    const next =
      result.status === "OWNED"
        ? trackAnalytics(
            result.state,
            "iap_purchase_completed",
            { productId },
            `purchase-complete:${productId}`,
          )
        : result.state;
    const message = {
      OWNED: "Satın alma doğrulandı ve kalıcı olarak açıldı.",
      PENDING:
        "Ödeme beklemede. Uygulamaya döndüğünde tekrar kontrol edilecek.",
      CANCELLED: "Satın alma iptal edildi; herhangi bir hak verilmedi.",
      FAILED: "Satın alma doğrulanamadı; herhangi bir hak verilmedi.",
    }[result.status];
    set({
      game: stampAndPersist(next),
      monetizationBusy: false,
      notice: message,
    });
  },
  restorePurchases: async () => {
    if (get().monetizationBusy) return;
    const before = trackAnalytics(
      get().game,
      "iap_restore_started",
      {},
      `restore-start:${get().game.gameTimeMin}`,
    );
    set({ game: stampAndPersist(before), monetizationBusy: true });
    const result = await restoreStoreProducts(
      before,
      getMonetizationAdapters().billing,
      () => get().game,
    );
    const next = result.failed
      ? result.state
      : trackAnalytics(
          result.state,
          "iap_restore_completed",
          { entitlementCount: result.synced },
          `restore-complete:${result.state.gameTimeMin}:${result.synced}`,
        );
    set({
      game: stampAndPersist(next),
      monetizationBusy: false,
      notice: result.failed
        ? "Satın almalar geri yüklenemedi. Bağlantını kontrol edip tekrar dene."
        : result.synced
          ? `${result.synced} mağaza hakkı doğrulandı.`
          : "Geri yüklenecek doğrulanmış satın alma bulunamadı.",
    });
  },
  syncStoreEntitlements: async () => {
    if (!get().ready || get().monetizationBusy) return;
    const refreshed = await refreshMonetization(
      get().game,
      getMonetizationAdapters(),
      () => get().game,
    );
    set({
      game: stampAndPersist(refreshed.state),
      storeProducts: refreshed.products,
    });
  },
  showPrivacyOptions: async () => {
    const opened = await openPrivacyOptions(getMonetizationAdapters().consent);
    set({
      notice: opened
        ? "Gizlilik seçenekleri açıldı."
        : "Gizlilik seçenekleri bu cihazda kullanılamıyor.",
    });
  },
  claimReward: async (placementId) => {
    if (get().monetizationBusy) return;
    const state = get().game;
    recordReplayCommand(state, "CLAIM_REWARD", { placementId });
    const premium = state.monetization.entitlements.some(
      (entry) =>
        entry.entitlementId === "premium_lifetime" && entry.status === "OWNED",
    );
    set({ monetizationBusy: true });
    const result = await runRewardedAction(
      state,
      placementId,
      premium ? "premium" : "ad",
      getMonetizationAdapters().rewarded,
      {
        read: () => get().game,
        publish: (game) => set({ game: stampAndPersist(game) }),
      },
    );
    const eventName =
      result.status === "APPLIED"
        ? premium
          ? "premium_claim_used"
          : "reward_applied"
        : result.status === "CANCELLED"
          ? "reward_closed_early"
          : "reward_request_failed";
    const next = trackAnalytics(
      result.state,
      eventName,
      { placementId, status: result.status },
      `${placementId}:${result.status}:${state.gameTimeMin}`,
    );
    set({
      game: stampAndPersist(next),
      monetizationBusy: false,
      notice:
        result.status === "APPLIED"
          ? "İsteğe bağlı hızlandırma uygulandı."
          : result.status === "CANCELLED"
            ? "Video erken kapatıldı; hak ve limit kullanılmadı."
            : result.status === "INELIGIBLE"
              ? "Bu hızlandırma şu anda uygun değil."
              : "Video yüklenemedi; hak ve limit kullanılmadı.",
    });
  },
  dismissCoach: () => {
    const game = get().game;
    set({ game: stampAndPersist(dismissFtueStage(game)) });
  },
  reset: async () => {
    await saveQueue.catch(() => undefined);
    await clearGame();
    clearReplayDiagnostics();
    persistenceSuspended = false;
    const game = initialState(systemTimeProvider.nowWallMs());
    set({ game, notice: t("notice.newCareerStarted") });
    await saveGame(game);
  },
  toggleShowcase: (assetId: string) => {
    const current = get().showcaseAssetIds;
    const capacity = maxShowcaseCapacity(get().game.home);
    const result = toggleShowcaseItem(current, assetId, capacity);
    saveShowcaseIds(result.showcaseAssetIds);
    set({
      showcaseAssetIds: result.showcaseAssetIds,
      notice:
        result.reason === "CAPACITY_REACHED"
          ? t("showcase.capacityFull") || "Vitrin kapasitesi dolu!"
          : result.added
            ? t("showcase.addedNotice") || "Eşya vitrine eklendi."
            : t("showcase.removedNotice") || "Eşya vitrinden çıkarıldı.",
    });
    buzz(get().game, result.added);
  },
  setSpecialization: (spec: SpecializationId) => {
    saveSpecialization(spec);
    set({
      specialization: spec,
      notice: t("specialization.selectedNotice") || "Kariyer uzmanlığı güncellendi.",
    });
    buzz(get().game, true);
  },
}));
