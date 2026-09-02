import { z } from "zod";
export const SAVE_VERSION = 2;
export type SellerKind =
  "urgent" | "expert" | "uninformed" | "emotional" | "merchant" | "risky";
export type ListingState =
  "ACTIVE" | "NEGOTIATING" | "SOLD_TO_PLAYER" | "SOLD_TO_NPC" | "EXPIRED";
export type Family = {
  id: string;
  name: string;
  assetKey: string;
  base: number;
  demand: number;
  liquidity: number;
  category: string;
  tier: number;
  attributes: string[];
};
export type Listing = {
  id: string;
  family: Family;
  price: number;
  fair: number;
  condition: number;
  seller: SellerKind;
  urgency: number;
  interest: number;
  createdAt: number;
  expiresAt: number;
  state: ListingState;
  seed: number;
};
export type Owned = {
  id: string;
  family: Family;
  paid: number;
  fair: number;
  condition: number;
  acquiredAt: number;
};
export type CareerEvent = {
  id: string;
  type: "BUY" | "SALE" | "PROFIT" | "MILESTONE" | "MISSED";
  at: number;
  label: string;
  amount?: number;
};
export type Negotiation = {
  listingId: string;
  offersRemaining: 0 | 1 | 2 | 3;
  sellerFloor: number;
  counter?: number;
  closed: boolean;
  retryGranted: boolean;
};
export type GameState = {
  version: number;
  cash: number;
  inventory: Owned[];
  realizedProfit: number;
  seed: number;
  marketCycle: number;
  listings: Listing[];
  negotiation?: Negotiation;
  expertise: Record<string, number>;
  career: CareerEvent[];
  lastSeenAt: number;
};
export const families: Family[] = [
  {
    id: "notebook",
    name: "Kuzey Defteri",
    assetKey: "prd_notebook",
    base: 180,
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
    base: 640,
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
    base: 1450,
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
    base: 3200,
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
    base: 5100,
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
    base: 8200,
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
    base: 14500,
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
    base: 22000,
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
    base: 36000,
    demand: 0.62,
    liquidity: 0.53,
    category: "Ulaşım",
    tier: 3,
    attributes: ["Menzil", "Batarya"],
  },
];
const stateSchema = z.object({
  version: z.number(),
  cash: z.number(),
  inventory: z.array(z.any()),
  realizedProfit: z.number(),
  seed: z.number(),
  marketCycle: z.number(),
  listings: z.array(z.any()),
  expertise: z.record(z.string(), z.number()),
  career: z.array(z.any()),
  lastSeenAt: z.number(),
  negotiation: z.any().optional(),
});
export const validateState = (value: unknown) =>
  stateSchema.parse(value) as GameState;
export function rng(seed: number) {
  let value = seed >>> 0;
  return () =>
    (value = (Math.imul(1664525, value) + 1013904223) >>> 0) / 4294967296;
}
export function wealth(state: Pick<GameState, "cash" | "inventory">) {
  return Math.round(
    state.cash + state.inventory.reduce((sum, item) => sum + item.fair, 0),
  );
}
export function market(
  seed: number,
  totalWealth: number,
  cycle = 0,
): Listing[] {
  const r = rng(seed + cycle * 7919);
  const tier = totalWealth < 10000 ? 1 : totalWealth < 75000 ? 2 : 3;
  const pool = families.filter((f) => f.tier <= tier);
  const now = Date.now();
  return Array.from({ length: 24 }, (_, i) => {
    const family = pool[Math.floor(r() * pool.length)];
    const condition = Math.round(48 + r() * 51);
    const fair = Math.round(
      family.base * (0.55 + condition / 190) * (0.94 + r() * 0.13),
    );
    const price = Math.max(
      20,
      Math.round((fair * (0.72 + r() * 0.56)) / 10) * 10,
    );
    const life = Math.round(
      (2 + (1 - family.liquidity) * 30 + r() * 25) * 60000,
    );
    return {
      id: `${seed}-${cycle}-${i}`,
      family,
      fair,
      price,
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
  }).sort((a, b) => a.price / a.fair - b.price / b.fair);
}
export function signal(item: Listing) {
  const ratio = item.price / item.fair;
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
  return Math.round((item.fair * (factor + item.urgency * 0.06)) / 10) * 10;
}
export function resolveOffer(item: Listing, offer: number, index: number) {
  const floor = sellerFloor(item);
  const roll = rng(item.seed + offer * 17 + index * 101)();
  if (offer >= floor) return { result: "accepted" as const, floor };
  if (offer >= floor * (0.88 + roll * 0.08))
    return {
      result: "counter" as const,
      floor,
      counter: Math.round((offer + floor) / 20) * 10,
    };
  return { result: "rejected" as const, floor };
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
export const money = (n: number) => `₺${Math.round(n).toLocaleString("tr-TR")}`;
export const initialState = (): GameState => {
  const base: GameState = {
    version: SAVE_VERSION,
    cash: 420,
    inventory: [],
    realizedProfit: 0,
    seed: 90421,
    marketCycle: 0,
    listings: [],
    expertise: {},
    career: [],
    lastSeenAt: Date.now(),
  };
  return { ...base, listings: market(base.seed, base.cash) };
};
