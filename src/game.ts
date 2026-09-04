import { z } from "zod";
import { netWorthMinor } from "./domain/economy";
import type { Family, GameState, Listing, SellerKind } from "./domain/models";

export type {
  BuyerOffer,
  CareerEvent,
  Family,
  GameState,
  Listing,
  Negotiation,
  OwnedAsset,
  PlayerListing,
  SellerKind,
  TransactionJournalEntry,
} from "./domain/models";

export const SAVE_VERSION = 3;
export const families: Family[] = [
  {
    id: "notebook",
    name: "Kuzey Defteri",
    assetKey: "prd_notebook",
    baseValueMinor: 18_000,
    demand: 0.82,
    liquidity: 0.9,
    category: "Küçük Eşya",
    tier: 0,
    attributes: ["Kapak", "Sayfa"],
  },
  {
    id: "headset",
    name: "Echo Mini Kulaklık",
    assetKey: "prd_headset",
    baseValueMinor: 64_000,
    demand: 0.76,
    liquidity: 0.82,
    category: "Ses",
    tier: 0,
    attributes: ["Pil", "Bağlantı"],
  },
  {
    id: "watch",
    name: "Mira Classic Saat",
    assetKey: "prd_watch",
    baseValueMinor: 145_000,
    demand: 0.66,
    liquidity: 0.7,
    category: "Saat",
    tier: 1,
    attributes: ["Mekanizma", "Kordon"],
  },
  {
    id: "console",
    name: "PixelGo Konsol",
    assetKey: "prd_console",
    baseValueMinor: 320_000,
    demand: 0.79,
    liquidity: 0.78,
    category: "Oyun",
    tier: 1,
    attributes: ["Depolama", "Kontrolcü"],
  },
  {
    id: "guitar",
    name: "Arda S1 Gitar",
    assetKey: "prd_guitar",
    baseValueMinor: 510_000,
    demand: 0.58,
    liquidity: 0.55,
    category: "Müzik",
    tier: 1,
    attributes: ["Gövde", "Aksesuar"],
  },
  {
    id: "phone",
    name: "Nova X1 Telefon",
    assetKey: "prd_phone",
    baseValueMinor: 820_000,
    demand: 0.88,
    liquidity: 0.88,
    category: "Telefon",
    tier: 2,
    attributes: ["Pil sağlığı", "Depolama"],
  },
  {
    id: "laptop",
    name: "Atlas Air Bilgisayar",
    assetKey: "prd_laptop",
    baseValueMinor: 1_450_000,
    demand: 0.75,
    liquidity: 0.72,
    category: "Bilgisayar",
    tier: 2,
    attributes: ["Bellek", "Pil"],
  },
  {
    id: "camera",
    name: "Luma C2 Kamera",
    assetKey: "prd_camera",
    baseValueMinor: 2_200_000,
    demand: 0.59,
    liquidity: 0.56,
    category: "Kamera",
    tier: 3,
    attributes: ["Perde sayısı", "Lens"],
  },
  {
    id: "scooter",
    name: "Vela Şehir Scooter",
    assetKey: "prd_scooter",
    baseValueMinor: 3_600_000,
    demand: 0.62,
    liquidity: 0.53,
    category: "Ulaşım",
    tier: 3,
    attributes: ["Menzil", "Batarya"],
  },
  {
    id: "turntable",
    name: "Orion Pikap",
    assetKey: "prd_turntable",
    baseValueMinor: 280_000,
    demand: 0.68,
    liquidity: 0.62,
    category: "Plak & Ses",
    tier: 1,
    attributes: ["İğne", "Kayış", "Toz kapağı"],
  },
  {
    id: "vinyl",
    name: "Klasik Plak Koleksiyonu",
    assetKey: "prd_vinyl",
    baseValueMinor: 42_000,
    demand: 0.72,
    liquidity: 0.75,
    category: "Plak & Ses",
    tier: 0,
    attributes: ["Baskı", "Çizik", "Kapak"],
  },
  {
    id: "speaker",
    name: "Sera Raf Hoparlörü",
    assetKey: "prd_speaker",
    baseValueMinor: 185_000,
    demand: 0.66,
    liquidity: 0.64,
    category: "Plak & Ses",
    tier: 1,
    attributes: ["Sürücü", "Kabin", "Kablo"],
  },
  {
    id: "desk",
    name: "Atölye Çalışma Masası",
    assetKey: "prd_desk",
    baseValueMinor: 360_000,
    demand: 0.7,
    liquidity: 0.64,
    category: "Mobilya",
    tier: 1,
    attributes: ["Malzeme", "Ölçü", "Çekmece"],
  },
  {
    id: "chair",
    name: "Kavak Ahşap Sandalye",
    assetKey: "prd_chair",
    baseValueMinor: 76_000,
    demand: 0.74,
    liquidity: 0.8,
    category: "Mobilya",
    tier: 0,
    attributes: ["Kumaş", "Ayak", "Renk"],
  },
  {
    id: "sofa",
    name: "Liman Üçlü Koltuk",
    assetKey: "prd_sofa",
    baseValueMinor: 720_000,
    demand: 0.6,
    liquidity: 0.48,
    category: "Mobilya",
    tier: 2,
    attributes: ["Kumaş", "Sünger", "Leke"],
  },
  {
    id: "wardrobe",
    name: "Mimoza Gardırop",
    assetKey: "prd_wardrobe",
    baseValueMinor: 580_000,
    demand: 0.54,
    liquidity: 0.45,
    category: "Mobilya",
    tier: 2,
    attributes: ["Kapak", "Ray", "Malzeme"],
  },
  {
    id: "tv",
    name: "Vista 4K Televizyon",
    assetKey: "prd_tv",
    baseValueMinor: 1_280_000,
    demand: 0.82,
    liquidity: 0.8,
    category: "Elektronik",
    tier: 2,
    attributes: ["Panel", "HDR", "Kumanda"],
  },
  {
    id: "monitor",
    name: "Frame 27 Monitör",
    assetKey: "prd_monitor",
    baseValueMinor: 620_000,
    demand: 0.78,
    liquidity: 0.75,
    category: "Elektronik",
    tier: 2,
    attributes: ["Ölü piksel", "Yenileme", "Stand"],
  },
  {
    id: "printer",
    name: "Inkjet Ofis Yazıcı",
    assetKey: "prd_printer",
    baseValueMinor: 210_000,
    demand: 0.55,
    liquidity: 0.52,
    category: "Elektronik",
    tier: 1,
    attributes: ["Kartuş", "Baskı", "Wi-Fi"],
  },
  {
    id: "fridge",
    name: "Frost Mini Buzdolabı",
    assetKey: "prd_fridge",
    baseValueMinor: 940_000,
    demand: 0.58,
    liquidity: 0.44,
    category: "Beyaz Eşya",
    tier: 2,
    attributes: ["Soğutma", "Conta", "Çizik"],
  },
  {
    id: "washer",
    name: "Aqua Çamaşır Makinesi",
    assetKey: "prd_washer",
    baseValueMinor: 1_120_000,
    demand: 0.57,
    liquidity: 0.42,
    category: "Beyaz Eşya",
    tier: 2,
    attributes: ["Tambur", "Program", "Pas"],
  },
  {
    id: "bicycle",
    name: "Rota Şehir Bisikleti",
    assetKey: "prd_bicycle",
    baseValueMinor: 480_000,
    demand: 0.7,
    liquidity: 0.68,
    category: "Ulaşım",
    tier: 1,
    attributes: ["Kadro", "Vites", "Fren"],
  },
  {
    id: "motorcycle",
    name: "Kanyon 250 Motosiklet",
    assetKey: "prd_motorcycle",
    baseValueMinor: 8_800_000,
    demand: 0.51,
    liquidity: 0.35,
    category: "Araç",
    tier: 3,
    attributes: ["Kilometre", "Boya", "Servis"],
  },
  {
    id: "car",
    name: "Mira Hatchback",
    assetKey: "prd_car",
    baseValueMinor: 36_000_000,
    demand: 0.5,
    liquidity: 0.25,
    category: "Araç",
    tier: 3,
    attributes: ["Kilometre", "Tramer", "Muayene"],
  },
  {
    id: "book",
    name: "İmzalı İlk Baskı Kitap",
    assetKey: "prd_book",
    baseValueMinor: 98_000,
    demand: 0.64,
    liquidity: 0.7,
    category: "Koleksiyon",
    tier: 0,
    attributes: ["Baskı", "İmza", "Kapak"],
  },
  {
    id: "camera_lens",
    name: "Vela 50mm Lens",
    assetKey: "prd_camera_lens",
    baseValueMinor: 760_000,
    demand: 0.61,
    liquidity: 0.58,
    category: "Kamera",
    tier: 2,
    attributes: ["Cam", "Mantar", "Kapak"],
  },
  {
    id: "sneaker",
    name: "Kanvas Koleksiyon Ayakkabı",
    assetKey: "prd_sneaker",
    baseValueMinor: 240_000,
    demand: 0.8,
    liquidity: 0.86,
    category: "Moda",
    tier: 1,
    attributes: ["Numara", "Taban", "Kutu"],
  },
  {
    id: "coffee",
    name: "Barista Espresso Makinesi",
    assetKey: "prd_coffee",
    baseValueMinor: 690_000,
    demand: 0.68,
    liquidity: 0.6,
    category: "Ev",
    tier: 2,
    attributes: ["Pompa", "Kireç", "Aksesuar"],
  },
  {
    id: "lamp",
    name: "Lumen Masa Lambası",
    assetKey: "prd_lamp",
    baseValueMinor: 52_000,
    demand: 0.78,
    liquidity: 0.88,
    category: "Ev",
    tier: 0,
    attributes: ["Ampul", "Kablo", "Gövde"],
  },
  {
    id: "record_player",
    name: "Mono Taşınabilir Plak Çalar",
    assetKey: "prd_record_player",
    baseValueMinor: 175_000,
    demand: 0.7,
    liquidity: 0.65,
    category: "Plak & Ses",
    tier: 1,
    attributes: ["İğne", "Hoparlör", "Kasa"],
  },
];
export const HOME_GOAL_MINOR = 350_000_000;

const sellerKindSchema = z.enum([
  "urgent",
  "expert",
  "uninformed",
  "emotional",
  "merchant",
  "risky",
]);
const familySchema = z.object({
  id: z.string(),
  name: z.string(),
  assetKey: z.string(),
  baseValueMinor: z.number().int().nonnegative(),
  demand: z.number(),
  liquidity: z.number(),
  category: z.string(),
  tier: z.number().int().nonnegative(),
  attributes: z.array(z.string()),
});
const listingSchema = z.object({
  id: z.string(),
  family: familySchema,
  priceMinor: z.number().int().nonnegative(),
  fairValueMinor: z.number().int().nonnegative(),
  condition: z.number(),
  seller: sellerKindSchema,
  urgency: z.number(),
  interest: z.number(),
  createdAt: z.number(),
  expiresAt: z.number(),
  state: z.enum([
    "ACTIVE",
    "NEGOTIATING",
    "SOLD_TO_PLAYER",
    "SOLD_TO_NPC",
    "EXPIRED",
  ]),
  seed: z.number().int(),
});
const ownedAssetSchema = z
  .object({
    id: z.string(),
    familyId: z.string(),
    sourceListingId: z.string(),
    instance: z.object({
      family: familySchema,
      fairValueMinor: z.number().int().nonnegative(),
      condition: z.number(),
    }),
    state: z.enum([
      "IN_INVENTORY",
      "PREPARING",
      "READY",
      "LISTED",
      "RESERVED",
      "SOLD_PENDING",
      "SOLD_COMPLETE",
    ]),
    purchasePriceMinor: z.number().int().nonnegative(),
    preparationCostMinor: z.number().int().nonnegative(),
    inspectionCostMinor: z.number().int().nonnegative(),
    transparentFeesMinor: z.number().int().nonnegative(),
    bookCostMinor: z.number().int().nonnegative(),
    acquiredAtGameMin: z.number().nonnegative(),
    currentListingId: z.string().optional(),
  })
  .refine(
    (asset) =>
      asset.bookCostMinor ===
      asset.purchasePriceMinor +
        asset.preparationCostMinor +
        asset.inspectionCostMinor +
        asset.transparentFeesMinor,
    { message: "bookCostMinor must equal every capitalized asset cost" },
  );
const playerListingSchema = z.object({
  id: z.string(),
  ownedAssetId: z.string(),
  askingPriceMinor: z.number().int().nonnegative(),
  interest: z.number(),
  createdAtGameMin: z.number().nonnegative(),
  state: z.enum([
    "ACTIVE",
    "RESERVED",
    "SOLD_PENDING",
    "SOLD_COMPLETE",
    "WITHDRAWN",
    "EXPIRED",
  ]),
});
const buyerOfferSchema = z.object({
  id: z.string(),
  listingId: z.string(),
  amountMinor: z.number().int().nonnegative(),
  buyer: z.string(),
  expiresAt: z.number(),
});
const journalEntrySchema = z.object({
  id: z.string(),
  kind: z.enum([
    "OPENING_BALANCE",
    "MIGRATION",
    "PURCHASE",
    "PREPARATION",
    "INSPECTION",
    "FEE",
    "LISTING",
    "RESERVATION",
    "SALE",
    "REFUND",
    "REWARD",
  ]),
  gameTime: z.number(),
  assetId: z.string().optional(),
  cashDeltaMinor: z.number().int(),
  costBasisDeltaMinor: z.number().int(),
  realizedProfitDeltaMinor: z.number().int(),
  metadata: z.record(z.string(), z.unknown()),
});
const careerEventSchema = z.object({
  id: z.string(),
  type: z.enum(["BUY", "SALE", "PROFIT", "MILESTONE", "MISSED"]),
  at: z.number(),
  label: z.string(),
  amountMinor: z.number().int().optional(),
});
const negotiationSchema = z.object({
  listingId: z.string(),
  offersRemaining: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  sellerFloorMinor: z.number().int().nonnegative(),
  counterMinor: z.number().int().nonnegative().optional(),
  closed: z.boolean(),
});
const stateSchema = z
  .object({
    version: z.literal(SAVE_VERSION),
    cashMinor: z.number().int().nonnegative(),
    ownedAssets: z.array(ownedAssetSchema),
    realizedProfitMinor: z.number().int(),
    transactionJournal: z.array(journalEntrySchema),
    seed: z.number().int(),
    marketCycle: z.number().int().nonnegative(),
    listings: z.array(listingSchema),
    expertise: z.record(z.string(), z.number()),
    career: z.array(careerEventSchema),
    lastSeenAt: z.number(),
    negotiation: negotiationSchema.optional(),
    playerListings: z.array(playerListingSchema),
    buyerOffers: z.array(buyerOfferSchema),
  })
  .superRefine((state, context) => {
    const assetIds = new Set<string>();
    for (const asset of state.ownedAssets) {
      if (assetIds.has(asset.id)) {
        context.addIssue({
          code: "custom",
          message: `OwnedAsset id must be unique: ${asset.id}`,
          path: ["ownedAssets"],
        });
      }
      assetIds.add(asset.id);
      if (asset.state === "SOLD_COMPLETE" && asset.currentListingId) {
        context.addIssue({
          code: "custom",
          message: `SoldComplete asset cannot have an active listing: ${asset.id}`,
          path: ["ownedAssets"],
        });
      }
    }

    const activeAssetListings = new Set<string>();
    for (const listing of state.playerListings) {
      if (
        listing.state !== "ACTIVE" &&
        listing.state !== "RESERVED" &&
        listing.state !== "SOLD_PENDING"
      ) {
        continue;
      }
      const asset = state.ownedAssets.find(
        (item) => item.id === listing.ownedAssetId,
      );
      if (!asset || asset.currentListingId !== listing.id) {
        context.addIssue({
          code: "custom",
          message: `Active player listing must reference its current OwnedAsset: ${listing.id}`,
          path: ["playerListings"],
        });
      }
      if (activeAssetListings.has(listing.ownedAssetId)) {
        context.addIssue({
          code: "custom",
          message: `OwnedAsset cannot have two active listings: ${listing.ownedAssetId}`,
          path: ["playerListings"],
        });
      }
      activeAssetListings.add(listing.ownedAssetId);
    }

    const transactionIds = new Set<string>();
    for (const entry of state.transactionJournal) {
      if (transactionIds.has(entry.id)) {
        context.addIssue({
          code: "custom",
          message: `Transaction id must be unique: ${entry.id}`,
          path: ["transactionJournal"],
        });
      }
      transactionIds.add(entry.id);
    }

    const journalTotals = state.transactionJournal.reduce(
      (totals, entry) => ({
        cashMinor: totals.cashMinor + entry.cashDeltaMinor,
        activeBookCostMinor:
          totals.activeBookCostMinor + entry.costBasisDeltaMinor,
        realizedProfitMinor:
          totals.realizedProfitMinor + entry.realizedProfitDeltaMinor,
      }),
      { cashMinor: 0, activeBookCostMinor: 0, realizedProfitMinor: 0 },
    );
    const activeBookCostMinor = state.ownedAssets
      .filter((asset) => asset.state !== "SOLD_COMPLETE")
      .reduce((total, asset) => total + asset.bookCostMinor, 0);
    if (
      journalTotals.cashMinor !== state.cashMinor ||
      journalTotals.activeBookCostMinor !== activeBookCostMinor ||
      journalTotals.realizedProfitMinor !== state.realizedProfitMinor
    ) {
      context.addIssue({
        code: "custom",
        message: "Transaction journal does not reconcile with account totals",
        path: ["transactionJournal"],
      });
    }
  });
export const validateState = (value: unknown) =>
  stateSchema.parse(value) as GameState;
export function rng(seed: number) {
  let value = seed >>> 0;
  return () =>
    (value = (Math.imul(1664525, value) + 1013904223) >>> 0) / 4294967296;
}
export const wealth = netWorthMinor;
export function market(
  seed: number,
  totalWealthMinor: number,
  cycle = 0,
): Listing[] {
  const r = rng(seed + cycle * 7919);
  const tier =
    totalWealthMinor < 1_000_000 ? 1 : totalWealthMinor < 7_500_000 ? 2 : 3;
  const pool = families.filter((f) => f.tier <= tier);
  const now = Date.now();
  return Array.from({ length: 24 }, (_, i) => {
    const family = pool[Math.floor(r() * pool.length)];
    const condition = Math.round(48 + r() * 51);
    const fairValueMinor = Math.round(
      family.baseValueMinor * (0.55 + condition / 190) * (0.94 + r() * 0.13),
    );
    const priceMinor = Math.max(
      2_000,
      Math.round((fairValueMinor * (0.72 + r() * 0.56)) / 1_000) * 1_000,
    );
    const life = Math.round(
      (2 + (1 - family.liquidity) * 30 + r() * 25) * 60000,
    );
    return {
      id: `${seed}-${cycle}-${i}`,
      family,
      fairValueMinor,
      priceMinor,
      condition,
      seller: (
        [
          "urgent",
          "expert",
          "uninformed",
          "emotional",
          "merchant",
          "risky",
        ] as SellerKind[]
      )[Math.floor(r() * 6)],
      urgency: r(),
      interest: Math.round(r() * 98),
      createdAt: now,
      expiresAt: now + life,
      state: "ACTIVE" as const,
      seed: Math.floor(r() * 1e9),
    };
  }).sort(
    (a, b) => a.priceMinor / a.fairValueMinor - b.priceMinor / b.fairValueMinor,
  );
}
export function signal(item: Listing) {
  const ratio = item.priceMinor / item.fairValueMinor;
  if (ratio < 0.78) return { text: "Sıcak fırsat", cls: "hot" };
  if (ratio < 0.88) return { text: "İyi fiyat", cls: "good" };
  if (ratio > 1.15) return { text: "Pahalı", cls: "bad" };
  return { text: "Piyasa fiyatı", cls: "neutral" };
}
export function sellerFloor(item: Listing) {
  const factor = {
    urgent: 0.76,
    expert: 0.94,
    uninformed: 0.72,
    emotional: 1.02,
    merchant: 0.96,
    risky: 0.7,
  }[item.seller];
  return (
    Math.round((item.fairValueMinor * (factor + item.urgency * 0.06)) / 1_000) *
    1_000
  );
}
export function resolveOffer(item: Listing, offer: number, index: number) {
  const floorMinor = sellerFloor(item);
  const roll = rng(item.seed + offer * 17 + index * 101)();
  if (offer >= floorMinor) return { result: "accepted" as const, floorMinor };
  if (offer >= floorMinor * (0.88 + roll * 0.08))
    return {
      result: "counter" as const,
      floorMinor,
      counterMinor: Math.round((offer + floorMinor) / 2_000) * 1_000,
    };
  return { result: "rejected" as const, floorMinor };
}
export function applyOffline(state: GameState, now = Date.now()): GameState {
  const elapsed = Math.max(
    0,
    Math.min(now - state.lastSeenAt, 4 * 60 * 60 * 1000),
  );
  if (elapsed < 60000) return { ...state, lastSeenAt: now };
  const kept = state.listings.filter(
    (l) =>
      l.expiresAt + elapsed * 0.35 > now ||
      rng(l.seed + Math.floor(elapsed / 60000))() > 0.55,
  );
  return {
    ...state,
    listings:
      kept.length >= 8
        ? kept
        : market(state.seed, wealth(state), state.marketCycle + 1),
    marketCycle: kept.length >= 8 ? state.marketCycle : state.marketCycle + 1,
    lastSeenAt: now,
  };
}
const tryFormatter = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});
export const money = (minor: number) => tryFormatter.format(minor / 100);
export const initialState = (): GameState => {
  const initialCashMinor = 42_000;
  const base: GameState = {
    version: SAVE_VERSION,
    cashMinor: initialCashMinor,
    ownedAssets: [],
    realizedProfitMinor: 0,
    transactionJournal: [
      {
        id: "opening-balance:v3",
        kind: "OPENING_BALANCE",
        gameTime: 0,
        cashDeltaMinor: initialCashMinor,
        costBasisDeltaMinor: 0,
        realizedProfitDeltaMinor: 0,
        metadata: { reason: "prototype-starting-balance" },
      },
    ],
    seed: 90421,
    marketCycle: 0,
    listings: [],
    playerListings: [],
    buyerOffers: [],
    expertise: {},
    career: [],
    lastSeenAt: Date.now(),
  };
  return { ...base, listings: market(base.seed, base.cashMinor) };
};
