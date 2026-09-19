// Radar tiers: HIGH and RISING are the only ones a positive Radar signal
// ever shows; CALM events keep whatever (mild, pre-existing) demand effect
// they already had but never light up the Radar panel -- "Sakin" reads as
// "nothing special right now", not a penalty notice.
export type RadarTier = "HIGH" | "RISING" | "CALM";

export type MarketEventDefinition = {
  id: string;
  title: string;
  message: string;
  affectedCategories: readonly string[];
  demandMultiplier: number;
  radarTier: RadarTier;
};

export const MARKET_EVENTS: readonly MarketEventDefinition[] = [
  {
    id: "game-launch",
    title: "Oyun lansmanı haftası",
    message: "Oyun ve bilgisayar ürünlerinde alıcı ilgisi yükseliyor.",
    affectedCategories: ["Oyun", "Bilgisayar"],
    demandMultiplier: 1.15,
    radarTier: "RISING",
  },
  {
    id: "moving-season",
    title: "Taşınma dönemi",
    message: "Ev ürünleri pazara daha sık geliyor; fiyatları karşılaştır.",
    affectedCategories: ["Ev/Yaşam"],
    demandMultiplier: 0.96,
    radarTier: "CALM",
  },
  {
    id: "collector-interest",
    title: "Koleksiyon ilgisi",
    message: "Nadir küçük eşya, fotoğraf ve müzik ürünleri öne çıkıyor.",
    affectedCategories: ["Küçük Eşya", "Fotoğraf", "Müzik"],
    demandMultiplier: 1.3,
    radarTier: "HIGH",
  },
  {
    id: "mobility-season",
    title: "Yol sezonu",
    message: "Araç ve mobil ürünlerde talep hareketleniyor.",
    affectedCategories: ["Araç", "Telefon"],
    demandMultiplier: 1.15,
    radarTier: "RISING",
  },
  {
    id: "quiet-market",
    title: "Piyasa sakinliği",
    message: "Alıcılar daha seçici; kanıtı güçlü ve dengeli ilanlar öne çıkar.",
    affectedCategories: [],
    demandMultiplier: 0.92,
    radarTier: "CALM",
  },
] as const;

const EVENT_DELAY_MIN = 180;
const EVENT_PERIOD_MIN = 360;
const EVENT_DURATION_MIN = 120;

export function activeMarketEvent(seed: number, gameTimeMin: number) {
  if (gameTimeMin < EVENT_DELAY_MIN) return null;
  const elapsed = gameTimeMin - EVENT_DELAY_MIN;
  if (elapsed % EVENT_PERIOD_MIN >= EVENT_DURATION_MIN) return null;
  const epoch = Math.floor(elapsed / EVENT_PERIOD_MIN);
  return MARKET_EVENTS[(Math.abs(seed) + epoch) % MARKET_EVENTS.length];
}

export function eventAffectsCategory(
  event: MarketEventDefinition,
  category: string,
) {
  return (
    event.affectedCategories.length === 0 ||
    event.affectedCategories.includes(category)
  );
}

// Pazar Radarı: surfaces the same activeMarketEvent already driving buyer
// arrival chance and offer amount (see buyerOfferForMinute) instead of
// running a second, parallel demand simulation. Only HIGH/RISING windows
// light the radar up; CALM and "no active event" both read as "nothing
// special right now" -- every category outside the returned list is
// implicitly normal.
export type RadarSignal = {
  tier: Exclude<RadarTier, "CALM">;
  categories: readonly string[];
  headline: string;
  message: string;
};

const RADAR_HEADLINE: Record<Exclude<RadarTier, "CALM">, string> = {
  HIGH: "Talep yüksek",
  RISING: "Yükselişte",
};

export function radarSignal(
  seed: number,
  gameTimeMin: number,
): RadarSignal | null {
  const event = activeMarketEvent(seed, gameTimeMin);
  if (
    !event ||
    event.radarTier === "CALM" ||
    event.affectedCategories.length === 0
  ) {
    return null;
  }
  return {
    tier: event.radarTier,
    categories: event.affectedCategories,
    headline: RADAR_HEADLINE[event.radarTier],
    message: event.message,
  };
}
