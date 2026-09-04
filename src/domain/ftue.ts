import { market } from "../game";
import type { FtueStage, GameState } from "./models";

export const isFtueActive = (state: GameState) =>
  state.ftue.stage !== "COMPLETE";

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
  const listings = market(1_972, state.cashMinor, 0, state.gameTimeMin, 3).map(
    (listing, index) => ({
      ...listing,
      id: `ftue-choice:${index}`,
      seller: "urgent" as const,
      urgency: 0,
      interest: 12 + index * 9,
      priceMinor: Math.max(
        2_000,
        Math.round((listing.instance.fairValueMinor * 0.95) / 1_000) * 1_000,
      ),
      expiresAtGameMin: state.gameTimeMin + 60,
    }),
  );
  return {
    ...state,
    listings,
    marketCycle: 1,
    ftue: { ...state.ftue, stage: "COMPARE" },
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
  EVIDENCE: "KANIT",
  NEGOTIATION: "PAZARLIK",
  PREPARATION: "HAZIRLIK",
  LISTING: "İLAN",
  BUYER_SALE: "ALICI TEKLİFİ",
  COMPLETE: "TAMAMLANDI",
};

export const ftueCopy: Record<FtueStage, { title: string; body: string }> = {
  STARTING_SALE: {
    title: "İlk sermayeni çıkar",
    body: "Eski defterin için gerçek bir alıcı teklifi geldi. Satış tamamlanınca kâr nakde dönüşür.",
  },
  COMPARE: {
    title: "Fiyat tek başına yetmez",
    body: "Üç ilandan ikisi aynı aile. Birini açıp benzerlerini karşılaştır; kondisyon ve kanıt farkını oku.",
  },
  EVIDENCE: {
    title: "İddiayı kontrol et",
    body: "Bir kanıt şüpheli olabilir. Fotoğraf, satıcı sorusu veya hızlı test ile belirsizliği azalt.",
  },
  NEGOTIATION: {
    title: "İki teklif hakkın var",
    body: "Seçtiğin üründe pazarlık yap. Satıcının cevabı ek hak tüketmez; oyuncu teklifleri iki hakla sınırlıdır.",
  },
  PREPARATION: {
    title: "Ürüne değer ekle",
    body: "Envanterde temizle, test et veya eksikleri tamamla. Maliyet defter değerine eklenir.",
  },
  LISTING: {
    title: "Kâr için listele",
    body: "Hazırladığın ürünü dengeli fiyatla ilana koy. İlan fiyatı maliyet değildir; kâr satışta hesaplanır.",
  },
  BUYER_SALE: {
    title: "Alıcı teklifini değerlendir",
    body: "İlanına teklif geldi. Gelir, defter maliyetini aşıyorsa satış gerçek kâr üretir.",
  },
  COMPLETE: {
    title: "İlk döngü tamamlandı",
    body: "Compare, kanıt, pazarlık, hazırlık ve satış artık serbest rotanda birlikte çalışıyor.",
  },
};
