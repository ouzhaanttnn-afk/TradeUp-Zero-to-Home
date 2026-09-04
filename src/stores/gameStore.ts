import { Haptics, NotificationType } from "@capacitor/haptics";
import { create } from "zustand";
import {
  activePlayerListings,
  createPlayerListing,
  purchaseListing,
  quoteAssetExit,
  settleAssetSale,
  withdrawPlayerListing,
} from "../domain/economy";
import {
  initialState,
  market,
  money,
  resolveOffer,
  sellerFloor,
  wealth,
  type GameState,
  type Listing,
  type OwnedAsset,
} from "../game";
import { clearGame, loadGame, saveGame } from "../services/persistence";

type Store = {
  game: GameState;
  ready: boolean;
  notice: string;
  hydrate: () => Promise<void>;
  refresh: () => void;
  buy: (item: Listing, priceMinor?: number) => boolean;
  offer: (item: Listing) => void;
  sell: (item: OwnedAsset, quick: boolean) => void;
  list: (item: OwnedAsset, askingPriceMinor: number) => void;
  withdrawListing: (listingId: string) => void;
  acceptBuyer: (offerId: string) => void;
  advanceWorld: () => void;
  reset: () => Promise<void>;
};

const buzz = (success = false) => {
  void Haptics.notification({
    type: success ? NotificationType.Success : NotificationType.Warning,
  }).catch(() => undefined);
};

const persist = (state: GameState) => {
  void saveGame(state);
  return state;
};

export const useGameStore = create<Store>((set, get) => ({
  game: initialState(),
  ready: false,
  notice: "Piyasa canlı. İyi fırsatlar beklemez.",
  hydrate: async () => set({ game: await loadGame(), ready: true }),
  refresh: () => {
    const game = get().game;
    const next = {
      ...game,
      marketCycle: game.marketCycle + 1,
      listings: market(game.seed, wealth(game), game.marketCycle + 1),
    };
    set({ game: persist(next), notice: "Pazar yenilendi." });
  },
  buy: (item, priceMinor = item.priceMinor) => {
    const game = get().game;
    const result = purchaseListing(game, item, priceMinor, Date.now());
    if (!result.ok) {
      const notice =
        result.reason === "INSUFFICIENT_CASH"
          ? `${money(priceMinor - game.cashMinor)} nakit eksik. Önce satış yap.`
          : "Bu ilan artık satın alınamıyor.";
      set({ notice });
      buzz();
      return false;
    }
    set({
      game: persist(result.state),
      notice: `${item.family.name} envanterine eklendi.`,
    });
    buzz(true);
    return true;
  },
  offer: (item) => {
    const game = get().game;
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
    const remaining = (current.offersRemaining - 1) as 0 | 1;
    if (result.result === "accepted") {
      get().buy(item, offerMinor);
      return;
    }
    const negotiation = {
      ...current,
      offersRemaining: remaining,
      counterMinor: result.counterMinor,
      closed: remaining === 0,
    };
    const next = { ...game, negotiation };
    set({
      game: persist(next),
      notice:
        result.result === "counter"
          ? `Satıcı ${money(result.counterMinor ?? 0)} karşı teklif verdi.`
          : remaining
            ? "Teklif reddedildi. Son hakkın kaldı."
            : "Son teklif reddedildi.",
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
      Date.now(),
      item.currentListingId,
    );
    if (!result.ok) {
      set({ notice: "Bu ürün artık satılamıyor." });
      buzz();
      return;
    }
    set({
      game: persist(result.state),
      notice: `${item.instance.family.name} ${money(saleMinor)} fiyatına satıldı.`,
    });
    buzz(true);
  },
  list: (item, askingPriceMinor) => {
    const result = createPlayerListing(
      get().game,
      item.id,
      askingPriceMinor,
      Date.now(),
    );
    if (!result.ok) {
      set({ notice: "Bu ürün ilana çıkarılamıyor." });
      buzz();
      return;
    }
    set({
      game: persist(result.state),
      notice: `${item.instance.family.name} ilana çıktı. Alıcılar aranıyor.`,
    });
  },
  withdrawListing: (listingId) => {
    const game = get().game;
    const listing = game.playerListings.find((item) => item.id === listingId);
    const asset = listing
      ? game.ownedAssets.find((item) => item.id === listing.ownedAssetId)
      : undefined;
    const result = withdrawPlayerListing(game, listingId, Date.now());
    if (!result.ok) {
      set({ notice: "İlan geri çekilemedi." });
      buzz();
      return;
    }
    set({
      game: persist(result.state),
      notice: `${asset?.instance.family.name ?? "Ürün"} envantere döndü.`,
    });
  },
  acceptBuyer: (offerId) => {
    const game = get().game;
    const offer = game.buyerOffers.find((item) => item.id === offerId);
    const listing = offer
      ? game.playerListings.find((item) => item.id === offer.listingId)
      : undefined;
    if (!offer || !listing) return;
    const result = settleAssetSale(
      game,
      listing.ownedAssetId,
      offer.amountMinor,
      `sale:buyer:${offer.id}`,
      Date.now(),
      listing.id,
    );
    if (!result.ok) {
      set({ notice: "Bu teklif artık kabul edilemiyor." });
      buzz();
      return;
    }
    set({
      game: persist(result.state),
      notice: `Alıcı teklifi kabul edildi: ${money(offer.amountMinor)}.`,
    });
    buzz(true);
  },
  advanceWorld: () => {
    const game = get().game;
    const roll = (game.seed + game.marketCycle * 17) % 100;
    const offers = activePlayerListings(game).flatMap((listing, index) => {
      const asset = game.ownedAssets.find(
        (item) => item.id === listing.ownedAssetId,
      );
      if (
        !asset ||
        listing.askingPriceMinor > asset.instance.fairValueMinor * 1.12 ||
        roll % 3 === 0
      ) {
        return [];
      }
      return [
        {
          id: `offer-${listing.id}-${game.marketCycle}`,
          listingId: listing.id,
          amountMinor:
            Math.round(
              (listing.askingPriceMinor * (0.96 + ((roll + index) % 9) / 100)) /
                1_000,
            ) * 1_000,
          buyer: ["Deniz", "Ece", "Mert", "Selin"][index % 4],
          expiresAt: Date.now() + 3_600_000,
        },
      ];
    });
    const next = {
      ...game,
      marketCycle: game.marketCycle + 1,
      listings: market(game.seed, wealth(game), game.marketCycle + 1),
      buyerOffers: [...game.buyerOffers, ...offers],
    };
    set({
      game: persist(next),
      notice: offers.length
        ? `${offers.length} yeni alıcı teklifi geldi.`
        : "Piyasa ilerledi; yeni teklifler bekleniyor.",
    });
  },
  reset: async () => {
    await clearGame();
    const game = initialState();
    set({ game, notice: "Yeni kariyer başladı." });
    await saveGame(game);
  },
}));
