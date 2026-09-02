import { create } from "zustand";
import { Haptics, NotificationType } from "@capacitor/haptics";
import {
  initialState,
  market,
  money,
  resolveOffer,
  sellerFloor,
  wealth,
  type GameState,
  type Listing,
  type Owned,
} from "../game";
import { clearGame, loadGame, saveGame } from "../services/persistence";
type Store = {
  game: GameState;
  ready: boolean;
  notice: string;
  hydrate: () => Promise<void>;
  refresh: () => void;
  buy: (item: Listing, price?: number) => boolean;
  offer: (item: Listing) => void;
  sell: (item: Owned, quick: boolean) => void;
  list: (item: Owned, askingPrice: number) => void;
  acceptBuyer: (offerId: string) => void;
  advanceWorld: () => void;
  reset: () => Promise<void>;
};
const buzz = (success = false) => {
  void Haptics.notification({
    type: success ? NotificationType.Success : NotificationType.Warning,
  }).catch(() => undefined);
};
export const useGameStore = create<Store>((set, get) => ({
  game: initialState(),
  ready: false,
  notice: "Piyasa canlı. İyi fırsatlar beklemez.",
  hydrate: async () => set({ game: await loadGame(), ready: true }),
  refresh: () => {
    const g = get().game;
    const next = {
      ...g,
      marketCycle: g.marketCycle + 1,
      listings: market(g.seed, wealth(g), g.marketCycle + 1),
    };
    set({ game: next, notice: "Pazar yenilendi." });
    void saveGame(next);
  },
  buy: (item, price = item.price) => {
    const g = get().game;
    if (g.cash < price) {
      set({ notice: `${money(price - g.cash)} nakit eksik. Önce satış yap.` });
      buzz();
      return false;
    }
    const owned: Owned = {
      id: `owned-${Date.now()}`,
      family: item.family,
      paid: price,
      fair: item.fair,
      condition: item.condition,
      acquiredAt: Date.now(),
    };
    const next = {
      ...g,
      cash: g.cash - price,
      inventory: [...g.inventory, owned],
      listings: g.listings.filter((x) => x.id !== item.id),
      negotiation: undefined,
      career: [
        ...g.career,
        {
          id: crypto.randomUUID(),
          type: "BUY" as const,
          at: Date.now(),
          label: `${item.family.name} alındı`,
          amount: price,
        },
      ],
    };
    set({ game: next, notice: `${item.family.name} envanterine eklendi.` });
    void saveGame(next);
    buzz(true);
    return true;
  },
  offer: (item) => {
    const g = get().game;
    const current =
      g.negotiation?.listingId === item.id
        ? g.negotiation
        : {
            listingId: item.id,
            offersRemaining: 2 as const,
            sellerFloor: sellerFloor(item),
            closed: false,
            retryGranted: false,
          };
    if (current.closed || current.offersRemaining === 0) {
      set({ notice: "Görüşme kapandı." });
      return;
    }
    const index = 3 - current.offersRemaining;
    const offer =
      Math.round((item.price * (index === 1 ? 0.82 : 0.91)) / 10) * 10;
    const result = resolveOffer(item, offer, index);
    const remaining = (current.offersRemaining - 1) as 0 | 1 | 2 | 3;
    if (result.result === "accepted") {
      get().buy(item, offer);
      return;
    }
    const negotiation = {
      ...current,
      offersRemaining: remaining,
      counter: result.counter,
      closed: remaining === 0,
    };
    const next = { ...g, negotiation };
    set({
      game: next,
      notice:
        result.result === "counter"
          ? `Satıcı ${money(result.counter ?? 0)} karşı teklif verdi; hakkın azalmadı.`
          : remaining
            ? "Teklif reddedildi. Son hakkın kaldı."
            : "Son teklif reddedildi.",
    });
    void saveGame(next);
    buzz();
  },
  sell: (item, quick) => {
    const g = get().game;
    const sale = Math.round((item.fair * (quick ? 0.82 : 1.05)) / 10) * 10;
    const profit = sale - item.paid;
    const next = {
      ...g,
      cash: g.cash + sale,
      inventory: g.inventory.filter((x) => x.id !== item.id),
      playerListings: g.playerListings.filter(
        (x) => x.id !== `player-${item.id}`,
      ),
      realizedProfit: g.realizedProfit + profit,
      career: [
        ...g.career,
        {
          id: crypto.randomUUID(),
          type: "SALE" as const,
          at: Date.now(),
          label: `${item.family.name} satıldı`,
          amount: profit,
        },
      ],
    };
    set({
      game: next,
      notice: `${item.family.name} ${money(sale)} fiyatına satıldı.`,
    });
    void saveGame(next);
    buzz(true);
  },
  list: (item, askingPrice) => {
    const g = get().game;
    const listing: Listing = {
      id: `player-${item.id}`,
      family: item.family,
      fair: item.fair,
      price: askingPrice,
      condition: item.condition,
      seller: "merchant",
      urgency: 0.5,
      interest: 0,
      createdAt: Date.now(),
      expiresAt: Date.now() + 86_400_000,
      state: "ACTIVE",
      seed: g.seed + item.id.length,
    };
    const next = {
      ...g,
      inventory: g.inventory.filter((x) => x.id !== item.id),
      playerListings: [...g.playerListings, listing],
    };
    set({
      game: next,
      notice: `${item.family.name} ilana çıktı. Alıcılar aranıyor.`,
    });
    void saveGame(next);
  },
  acceptBuyer: (offerId) => {
    const g = get().game;
    const offer = g.buyerOffers.find((x) => x.id === offerId);
    if (!offer) return;
    const listing = g.playerListings.find((x) => x.id === offer.listingId);
    if (!listing) return;
    const next = {
      ...g,
      cash: g.cash + offer.amount,
      playerListings: g.playerListings.filter((x) => x.id !== listing.id),
      buyerOffers: g.buyerOffers.filter((x) => x.id !== offerId),
      realizedProfit: g.realizedProfit + offer.amount - listing.price,
      career: [
        ...g.career,
        {
          id: crypto.randomUUID(),
          type: "SALE" as const,
          at: Date.now(),
          label: `${listing.family.name} alıcıya satıldı`,
          amount: offer.amount - listing.price,
        },
      ],
    };
    set({
      game: next,
      notice: `Alıcı teklifi kabul edildi: ${money(offer.amount)}.`,
    });
    void saveGame(next);
    buzz(true);
  },
  advanceWorld: () => {
    const g = get().game;
    const r = (g.seed + g.marketCycle * 17) % 100;
    const offers = g.playerListings
      .filter(
        (x) => x.state === "ACTIVE" && x.price <= x.fair * 1.12 && r % 3 !== 0,
      )
      .map((x, i) => ({
        id: `offer-${x.id}-${g.marketCycle}`,
        listingId: x.id,
        amount: Math.round((x.price * (0.96 + ((r + i) % 9) / 100)) / 10) * 10,
        buyer: ["Deniz", "Ece", "Mert", "Selin"][i % 4],
        expiresAt: Date.now() + 3_600_000,
      }));
    const next = {
      ...g,
      marketCycle: g.marketCycle + 1,
      listings: market(g.seed, wealth(g), g.marketCycle + 1),
      buyerOffers: [...g.buyerOffers, ...offers],
    };
    set({
      game: next,
      notice: offers.length
        ? `${offers.length} yeni alıcı teklifi geldi.`
        : "Piyasa ilerledi; yeni teklifler bekleniyor.",
    });
    void saveGame(next);
  },
  reset: async () => {
    await clearGame();
    const game = initialState();
    set({ game, notice: "Yeni kariyer başladı." });
    await saveGame(game);
  },
}));
