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
import { inspectListing } from "../domain/decision";
import { startPreparation } from "../domain/preparation";
import {
  addSavedSearch,
  gainExpertise,
  recordCompletedSaleMeta,
  removeSavedSearch,
  toggleWatch,
} from "../domain/meta";
import {
  setAnalyticsEnabled,
  trackAnalytics,
} from "../infrastructure/analytics";
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
  PreparationKind,
  SavedSearch,
} from "../domain/models";
import {
  advanceWorldTo,
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
import { clearGame, loadGame, saveGame } from "../services/persistence";

type Store = {
  game: GameState;
  ready: boolean;
  notice: string;
  hydrate: () => Promise<void>;
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
  markCompared: (listingId?: string) => void;
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
  dismissCoach: () => void;
  reset: () => Promise<void>;
};

const buzz = (success = false) => {
  void Haptics.notification({
    type: success ? NotificationType.Success : NotificationType.Warning,
  }).catch(() => undefined);
};

let saveQueue = Promise.resolve();

const enqueueSave = (state: GameState, wallClockMs: number) => {
  saveQueue = saveQueue
    .catch(() => undefined)
    .then(() => saveGame(state, { nowWallMs: () => wallClockMs }));
  void saveQueue.catch(() => undefined);
};

const stampAndPersist = (state: GameState) => {
  const wallClockMs = Math.max(
    state.lastWallClockMs,
    systemTimeProvider.nowWallMs(),
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
  notice: "Piyasa canlı. İyi fırsatlar beklemez.",
  hydrate: async () => {
    await saveQueue.catch(() => undefined);
    const game = await loadGame();
    set({ game, ready: true });
  },
  flush: async () => {
    await saveQueue.catch(() => undefined);
    const state = get().game;
    const wallClockMs = Math.max(
      state.lastWallClockMs,
      systemTimeProvider.nowWallMs(),
    );
    await saveGame(
      { ...state, lastWallClockMs: wallClockMs },
      { nowWallMs: () => wallClockMs },
    );
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
      buzz();
      return false;
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
    buzz(true);
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
    const current =
      game.negotiation?.listingId === item.id
        ? game.negotiation
        : {
            listingId: item.id,
            offersRemaining: 2 as const,
            sellerFloorMinor: sellerFloor(item),
            closed: false,
          };
    if (current.closed || current.offersRemaining === 0) {
      set({ notice: "Görüşme kapandı." });
      return;
    }
    const index = 3 - current.offersRemaining;
    const offerMinor =
      Math.round((item.priceMinor * (index === 1 ? 0.82 : 0.91)) / 1_000) *
      1_000;
    const result = resolveOffer(item, offerMinor, index);
    const offeredGame = trackAnalytics(
      game,
      "offer_submitted",
      { familyId: item.familyId, offerMinor, offerIndex: index },
      `${item.id}:${index}`,
    );
    if (result.result === "accepted") {
      if (offeredGame !== game) set({ game: offeredGame });
      get().buy(item, offerMinor);
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
    buzz();
  },
  sell: (item, quick) => {
    const game = get().game;
    if (isFtueActive(game) && game.ftue.firstAssetId === item.id) {
      set({ notice: "İlk döngüde bu ürünü dengeli fiyatla listele." });
      return;
    }
    const quote = quoteAssetExit(item);
    const saleMinor = quick ? quote.quickSaleMinor : quote.balancedAskingMinor;
    const transactionId = `sale:direct:${item.id}`;
    const result = settleAssetSale(
      game,
      item.id,
      saleMinor,
      transactionId,
      game.gameTimeMin,
      item.currentListingId,
    );
    if (!result.ok) {
      set({ notice: "Bu ürün artık satılamıyor." });
      buzz();
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
        `${item.instance.family.name} ${money(saleMinor)} fiyatına satıldı.`,
      ),
    });
    buzz(true);
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
      buzz();
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
      buzz();
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
      buzz();
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
    buzz(true);
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
        result.idempotent
          ? "Bu kontrol zaten yapıldı."
          : "Yeni kanıtlar tahmin aralığını daralttı.",
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
    if (!listing) return;
    let next = gainExpertise(game, "listingOpen", listing.familyId, listing.id);
    next = trackAnalytics(
      next,
      "listing_open",
      { listingId, familyId: listing.familyId },
      listingId,
    );
    set({ game: stampAndPersist(next) });
  },
  markCompared: (listingId = "ftue-compare") => {
    const game = get().game;
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
        next === game ? "Bu arama zaten kayıtlı." : "Family alarmı kaydedildi.",
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
  dismissCoach: () => {
    const game = get().game;
    set({ game: stampAndPersist(dismissFtueStage(game)) });
  },
  reset: async () => {
    await clearGame();
    const game = initialState(systemTimeProvider.nowWallMs());
    set({ game, notice: "Yeni kariyer başladı." });
    await saveGame(game);
  },
}));
