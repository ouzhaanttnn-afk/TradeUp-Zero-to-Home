import { market } from "../game";
import { WORLD_CONFIG } from "./config";
import { netWorthMinor } from "./economy";
import type { FtueStage, GameState } from "./models";

// The guided first-purchase walkthrough (compare/evidence/negotiation
// gating and its coach card) is disabled. The underlying stage machine
// below still runs in the background — it's what reveals the market
// after the player sells their starting notebook — but the UI no longer
// treats any stage as "active" for gating or coaching purposes.
export const isFtueActive = (_state: GameState) => false;

export function dismissFtueStage(state: GameState): GameState {
  if (state.ftue.dismissedStages.includes(state.ftue.stage)) return state;
  return {
    ...state,
    ftue: {
      ...state.ftue,
      dismissedStages: [...state.ftue.dismissedStages, state.ftue.stage],
    },
  };
}

export function revealFirstMarket(state: GameState): GameState {
  if (state.ftue.stage !== "STARTING_SALE") return state;
  const marketCycle = 1;
  const listings = market(
    state.seed,
    netWorthMinor(state),
    marketCycle,
    state.gameTimeMin,
    WORLD_CONFIG.minActiveListings,
  );
  return {
    ...state,
    listings,
    marketCycle,
    // The guided walkthrough is disabled (see isFtueActive above); jump
    // straight to COMPLETE so normal market arrivals start flowing right
    // away instead of waiting on tutorial steps nothing triggers anymore.
    ftue: { ...state.ftue, stage: "COMPLETE" },
  };
}

const move = (state: GameState, from: FtueStage, to: FtueStage): GameState =>
  state.ftue.stage === from
    ? { ...state, ftue: { ...state.ftue, stage: to } }
    : state;

export const recordFtueCompare = (state: GameState) =>
  move(state, "COMPARE", "EVIDENCE");
export const recordFtueEvidence = (state: GameState) =>
  move(state, "EVIDENCE", "NEGOTIATION");
export const recordFtuePurchase = (
  state: GameState,
  assetId: string,
): GameState =>
  state.ftue.stage === "NEGOTIATION"
    ? {
        ...state,
        ftue: { ...state.ftue, stage: "PREPARATION", firstAssetId: assetId },
      }
    : state;
export const recordFtuePreparation = (
  state: GameState,
  assetId: string,
): GameState =>
  state.ftue.stage === "PREPARATION" && state.ftue.firstAssetId === assetId
    ? { ...state, ftue: { ...state.ftue, stage: "LISTING" } }
    : state;

export function recordFtueListing(
  state: GameState,
  assetId: string,
): GameState {
  if (state.ftue.stage !== "LISTING" || state.ftue.firstAssetId !== assetId)
    return state;
  const asset = state.ownedAssets.find((item) => item.id === assetId);
  const listing = state.playerListings.find(
    (item) => item.ownedAssetId === assetId && item.state === "ACTIVE",
  );
  if (!asset || !listing) return state;
  const amountMinor = Math.min(
    listing.askingPriceMinor,
    Math.max(
      asset.bookCostMinor + 2_000,
      Math.round((asset.instance.fairValueMinor * 1.01) / 1_000) * 1_000,
    ),
  );
  return {
    ...state,
    buyerOffers: [
      ...state.buyerOffers,
      {
        id: `offer:ftue-first-flip:${listing.id}`,
        listingId: listing.id,
        amountMinor,
        buyer: "Deniz",
        expiresAtGameMin: state.gameTimeMin + 60,
      },
    ],
    ftue: {
      ...state.ftue,
      stage: "BUYER_SALE",
      firstPlayerListingId: listing.id,
    },
  };
}

export function recordFtueBuyerSale(
  state: GameState,
  listingId: string,
): GameState {
  if (
    state.ftue.stage !== "BUYER_SALE" ||
    state.ftue.firstPlayerListingId !== listingId
  )
    return state;
  return { ...state, ftue: { ...state.ftue, stage: "COMPLETE" } };
}

export function recordFtueWithdrawal(
  state: GameState,
  listingId: string,
): GameState {
  if (
    state.ftue.stage !== "BUYER_SALE" ||
    state.ftue.firstPlayerListingId !== listingId
  )
    return state;
  return {
    ...state,
    ftue: { ...state.ftue, stage: "LISTING", firstPlayerListingId: undefined },
  };
}

export const ftueStageLabel: Record<FtueStage, string> = {
  STARTING_SALE: "BAŞLANGIÇ SATIŞI",
  COMPARE: "KARŞILAŞTIR",
  EVIDENCE: "ÜRÜNÜ KONTROL ET",
  NEGOTIATION: "PAZARLIK",
  PREPARATION: "HAZIRLIK",
  LISTING: "İLAN",
  BUYER_SALE: "ALICI TEKLİFİ",
  COMPLETE: "TAMAMLANDI",
};

export const ftueCopy: Record<FtueStage, { title: string; body: string }> = {
  STARTING_SALE: {
    title: "İlk sermayeni çıkar",
    body: "Eski defterini sat. Kazandığın parayla ilk ürününü alabilirsin.",
  },
  COMPARE: {
    title: "Fiyat tek başına yetmez",
    body: "İki benzer defter var. Fiyatlarına ve durumlarına bak, hangisini alacağına sen karar ver.",
  },
  EVIDENCE: {
    title: "Ürün anlatıldığı gibi mi?",
    body: "Fotoğrafa bak, satıcıya sor ya da hızlı test yap. Bir kontrol seç.",
  },
  NEGOTIATION: {
    title: "İki teklif hakkın var",
    body: "Daha iyi bir fiyat iste. En fazla iki teklif verebilirsin.",
  },
  PREPARATION: {
    title: "Ürüne değer ekle",
    body: "Temizle, test et veya eksiklerini tamamla. Ücreti ve etkisini görüp birini seç.",
  },
  LISTING: {
    title: "Satışa çıkar",
    body: "Ürünün hazır. İlanını oluştur, alıcı tekliflerini değerlendir.",
  },
  BUYER_SALE: {
    title: "Teklif geldi",
    body: "Ne harcadın, ne kazanacaksın? Teklifi incele; satıp satmamaya sen karar ver.",
  },
  COMPLETE: {
    title: "İlk döngü tamamlandı",
    body: "Artık yeni fırsatlar arayabilir, ürünlerini hazırlayıp satabilirsin.",
  },
};
