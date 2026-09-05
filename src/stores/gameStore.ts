import { Haptics, NotificationType } from "@capacitor/haptics";
import { create } from "zustand";
import {
  createPlayerListing,
  purchaseListing,
  quoteAssetExit,
  settleAssetSale,
  withdrawPlayerListing,
} from "../domain/economy";
import { WORLD_CONFIG } from "../domain/config";
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
import { advanceRewardState } from "../domain/monetization";
import type {
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
  resolveOffer,
  sellerFloor,
  type GameState,
  type Listing,
  type OwnedAsset,
} from "../game";
import { systemTimeProvider } from "../infrastructure/time";
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
  tick: () => void;
  buy: (item: Listing, priceMinor?: number) => boolean;
  offer: (item: Listing) => void;
  sell: (item: OwnedAsset, quick: boolean) => void;
  list: (item: OwnedAsset, askingPriceMinor: number) => void;
  withdrawListing: (listingId: string) => void;
  acceptBuyer: (offerId: string) => void;
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
  openPurchases: () => Promise<void>;
  purchaseProduct: (productId: MonetizationProductId) => Promise<void>;
  restorePurchases: () => Promise<void>;
  showPrivacyOptions: () => Promise<void>;
  claimReward: (placementId: RewardPlacementId) => Promise<void>;
  dismissCoach: () => void;
  reset: () => Promise<void>;
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
    return `${summary.buyerOffers} yeni alıcı teklifi geldi.`;
  }
  if (summary.npcSales > 0) {
    return `${summary.npcSales} ilan başka alıcılara gitti; pazar akmaya devam ediyor.`;
  }
  if (summary.marketExpirations > 0) {
    return `${summary.marketExpirations} ilanının süresi doldu.`;
  }
  if (summary.playerListingExpirations > 0) {
    return "Süresi dolan ilanındaki ürün envantere döndü.";
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
          { listingId: offer.listingId, amountMinor: offer.amountMinor },
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
  hydrate: () => {
    if (hydration) return hydration;
    hydration = (async () => {
      await saveQueue.catch(() => undefined);
      const { state: game, recovery } = await loadGameWithStatus();
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
        notice: recoveryNotice ?? current.notice,
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
    const result = advanceOffline(previous, systemTimeProvider.nowWallMs());
    const game = withBuyerOfferAnalytics(previous, result.state);
    set({
      sessionActive: true,
      game: stampAndPersist(game),
      notice: worldNotice(result, "Kaldığın yerden devam ediyorsun."),
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
    const previous = get().game;
    const scanned = scanMarket(previous);
    const result = {
      ...scanned,
      state: withBuyerOfferAnalytics(previous, scanned.state),
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
  tick: () => {
    if (!get().sessionActive || !get().ready) return;
    const result = progressBy(get().game, WORLD_CONFIG.activeTickMin);
    const eventCount =
      result.summary.buyerOffers +
      result.summary.npcSales +
      result.summary.marketExpirations +
      result.summary.playerListingExpirations;
    set((current) => ({
      game: stampAndPersist(result.state),
      notice: eventCount
        ? (worldEventNotice(result) ?? current.notice)
        : current.notice,
    }));
  },
  buy: (item, priceMinor = item.priceMinor) => {
    const game = get().game;
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
      { familyId: item.familyId, priceMinor },
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
  offer: (item) => {
    const game = get().game;
    if (isFtueActive(game) && game.ftue.stage !== "NEGOTIATION") {
      set({ notice: "Önce karşılaştır ve bir kanıtı kontrol et." });
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
      set({ notice: "Bu ilan artık pazarda değil." });
      return;
    }
    if (currentListing.priceMinor !== item.priceMinor) {
      set({
        notice:
          "İlan fiyatı değişti. Güncel fiyatı kontrol edip teklifini yeniden gönder.",
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
      set({ notice: "Görüşme kapandı." });
      return;
    }
    const index = 3 - current.offersRemaining;
    const offerMinor =
      Math.round(
        (currentListing.priceMinor * (index === 1 ? 0.82 : 0.91)) / 1_000,
      ) * 1_000;
    const result = resolveOffer(
      currentListing,
      offerMinor,
      index,
      current.sellerFloorMinor,
    );
    const offeredGame = trackAnalytics(
      game,
      "offer_submitted",
      { familyId: item.familyId, offerMinor, offerIndex: index },
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
        ? `Satıcı ${money(result.counterMinor ?? 0)} karşı teklif verdi.`
        : remaining
          ? "Teklif reddedildi. Son hakkın kaldı."
          : "Son teklif reddedildi.";
    set({
      game: stampAndPersist(progressed.state),
      notice: worldNotice(progressed, fallback),
    });
    buzz(game);
    sound(game, "OFFER");
  },
  sell: (item, quick) => {
    const game = get().game;
    if (isFtueActive(game) && game.ftue.firstAssetId === item.id) {
      set({ notice: "İlk döngüde bu ürünü dengeli fiyatla listele." });
      return;
    }
    const transactionId = `sale:direct:${item.id}`;
    if (game.transactionJournal.some((entry) => entry.id === transactionId)) {
      set({ notice: "Bu satış zaten tamamlandı." });
      return;
    }
    const currentAsset = game.ownedAssets.find((asset) => asset.id === item.id);
    if (
      !currentAsset ||
      !["IN_INVENTORY", "READY"].includes(currentAsset.state)
    ) {
      set({
        notice:
          "Bu ürün şu anda hızlı satışa uygun değil. Portföydeki durumunu kontrol et.",
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
        notice:
          "Ürünün satış bilgileri değişti. Güncel tutarı kontrol edip satışı yeniden onayla.",
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
      set({ notice: "Bu ürün artık satılamıyor." });
      buzz(game);
      sound(game, "WARNING");
      return;
    }
    if (result.idempotent) {
      set({ notice: "Bu satış zaten tamamlandı." });
      return;
    }
    const withMeta = recordCompletedSaleMeta(
      game,
      result.state,
      item.id,
      transactionId,
    );
    const progressed = progressBy(withMeta);
    set({
      game: stampAndPersist(progressed.state),
      notice: worldNotice(
        progressed,
        `${currentAsset.instance.family.name} ${money(saleMinor)} fiyatına satıldı.`,
      ),
    });
    const profitable = saleMinor >= currentAsset.bookCostMinor;
    buzz(game, profitable);
    sound(game, profitable ? "SALE_PROFIT" : "SALE_LOSS");
  },
  list: (item, askingPriceMinor) => {
    const game = get().game;
    if (isFtueActive(game) && game.ftue.stage !== "LISTING") {
      set({ notice: "İlk ürün için önce bir hazırlık tamamla." });
      return;
    }
    const result = createPlayerListing(
      game,
      item.id,
      askingPriceMinor,
      game.gameTimeMin,
    );
    if (!result.ok) {
      set({ notice: "Bu ürün ilana çıkarılamıyor." });
      buzz(game);
      sound(game, "WARNING");
      return;
    }
    if (result.idempotent) {
      set({ notice: "Bu ilan zaten oluşturuldu." });
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
    set({
      game: stampAndPersist(progressed.state),
      notice: worldNotice(
        progressed,
        `${item.instance.family.name} ilana çıktı. Alıcılar aranıyor.`,
      ),
    });
  },
  withdrawListing: (listingId) => {
    const game = get().game;
    const listing = game.playerListings.find((item) => item.id === listingId);
    const asset = listing
      ? game.ownedAssets.find((item) => item.id === listing.ownedAssetId)
      : undefined;
    const result = withdrawPlayerListing(game, listingId, game.gameTimeMin);
    if (!result.ok) {
      set({ notice: "İlan geri çekilemedi." });
      buzz(game);
      sound(game, "WARNING");
      return;
    }
    if (result.idempotent) {
      set({ notice: "Bu ilan zaten geri çekildi." });
      return;
    }
    const progressed = progressBy(
      recordFtueWithdrawal(result.state, listingId),
    );
    set({
      game: stampAndPersist(progressed.state),
      notice: worldNotice(
        progressed,
        `${asset?.instance.family.name ?? "Ürün"} envantere döndü.`,
      ),
    });
  },
  acceptBuyer: (offerId) => {
    const game = get().game;
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
        notice:
          "Bu teklif artık kabul edilemiyor. Güncel teklifleri kontrol et.",
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
      set({ notice: "Bu teklif artık kabul edilemiyor." });
      buzz(game);
      sound(game, "WARNING");
      return;
    }
    if (result.idempotent) {
      set({ notice: "Bu satış zaten tamamlandı." });
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
        `Alıcı teklifi kabul edildi: ${money(buyerOffer.amountMinor)}.`,
      ),
    });
    const soldAsset = game.ownedAssets.find(
      (item) => item.id === listing.ownedAssetId,
    );
    const profitable =
      buyerOffer.amountMinor >= (soldAsset?.bookCostMinor ?? 0);
    buzz(game, profitable);
    sound(game, profitable ? "SALE_PROFIT" : "SALE_LOSS");
  },
  inspect: (listingId, kind) => {
    const game = get().game;
    if (isFtueActive(game) && game.ftue.stage !== "EVIDENCE") {
      set({ notice: "Önce benzer ilanları karşılaştır." });
      return;
    }
    const result = inspectListing(game, listingId, kind);
    if (!result.ok) {
      set({ notice: "Bu ilan artık incelenemiyor." });
      return;
    }
    if (result.idempotent) {
      set({ notice: "Bu kontrol zaten yapıldı." });
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
        "Yeni kanıtlar tahmin aralığını daralttı.",
      ),
    });
  },
  prepare: (assetId, kind) => {
    const game = get().game;
    if (isFtueActive(game) && game.ftue.stage !== "PREPARATION") {
      set({ notice: "Bu hazırlık ilk satın almadan sonra açılır." });
      return;
    }
    const result = startPreparation(game, assetId, kind);
    if (!result.ok) {
      set({
        notice:
          result.reason === "INSUFFICIENT_CASH"
            ? "Bu hazırlık için yeterli nakit yok."
            : "Bu hazırlık şu anda yapılamıyor.",
      });
      return;
    }
    if (result.idempotent) {
      set({ notice: "Bu hazırlık zaten yapıldı." });
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
    const progressed = progressBy(tracked, Math.max(1, result.durationMin));
    set({
      game: stampAndPersist(recordFtuePreparation(progressed.state, assetId)),
      notice: worldNotice(
        progressed,
        "Hazırlık tamamlandı; maliyet defter değerine işlendi.",
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
      notice: "Farkları gördün. Şimdi seçtiğin ilandaki kanıtı kontrol et.",
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
        ? "İlan Takip listene eklendi."
        : "İlan Takip listesinden çıkarıldı.",
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
      set({ notice: "Ürün alarmı Pazar Seviye 3'te açılır." });
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
        notice:
          "Alarm kaydedilemedi; ürün, fiyat ve kondisyon bilgilerini kontrol et.",
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
        next === game ? "Bu arama zaten kayıtlı." : "Ürün alarmı kaydedildi.",
    });
  },
  removeSearch: (searchId) => {
    const next = removeSavedSearch(get().game, searchId);
    set({ game: stampAndPersist(next), notice: "Kayıtlı arama kaldırıldı." });
  },
  recordImpressions: (listingIds) => {
    let next = get().game;
    for (const listingId of listingIds) {
      const listing = next.listings.find((item) => item.id === listingId);
      if (!listing) continue;
      next = trackAnalytics(
        next,
        "listing_impression",
        { listingId, familyId: listing.familyId },
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
    persistenceSuspended = false;
    const game = initialState(systemTimeProvider.nowWallMs());
    set({ game, notice: "Yeni kariyer başladı." });
    await saveGame(game);
  },
}));
