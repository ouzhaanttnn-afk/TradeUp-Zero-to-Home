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

const progressBy = (state: GameState, minutes = 1) =>
  advanceWorldTo(state, state.gameTimeMin + minutes);

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
    const result = scanMarket(get().game);
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
    const progressed = progressBy(result.state);
    set({
      game: stampAndPersist(progressed.state),
      notice: worldNotice(
        progressed,
        `${item.family.name} envanterine eklendi.`,
      ),
    });
    buzz(true);
    return true;
  },
  offer: (item) => {
    const game = get().game;
    const currentListing = game.listings.find(
      (listing) => listing.id === item.id,
    );
    if (
      !currentListing ||
      (currentListing.state !== "ACTIVE" &&
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
    if (result.result === "accepted") {
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
      ...game,
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
    const quote = quoteAssetExit(item);
    const saleMinor = quick ? quote.quickSaleMinor : quote.balancedAskingMinor;
    const result = settleAssetSale(
      game,
      item.id,
      saleMinor,
      `sale:direct:${item.id}`,
      game.gameTimeMin,
      item.currentListingId,
    );
    if (!result.ok) {
      set({ notice: "Bu ürün artık satılamıyor." });
      buzz();
      return;
    }
    const progressed = progressBy(result.state);
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
    const progressed = progressBy(result.state);
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
    const progressed = progressBy(result.state);
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
    const result = settleAssetSale(
      game,
      listing.ownedAssetId,
      buyerOffer.amountMinor,
      `sale:buyer:${buyerOffer.id}`,
      game.gameTimeMin,
      listing.id,
    );
    if (!result.ok) {
      set({ notice: "Bu teklif artık kabul edilemiyor." });
      buzz();
      return;
    }
    const progressed = progressBy(result.state);
    set({
      game: stampAndPersist(progressed.state),
      notice: worldNotice(
        progressed,
        `Alıcı teklifi kabul edildi: ${money(buyerOffer.amountMinor)}.`,
      ),
    });
    buzz(true);
  },
  reset: async () => {
    await clearGame();
    const game = initialState(systemTimeProvider.nowWallMs());
    set({ game, notice: "Yeni kariyer başladı." });
    await saveGame(game);
  },
}));
