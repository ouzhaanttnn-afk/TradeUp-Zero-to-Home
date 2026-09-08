export type MarketEventDefinition = {
  id: string;
  title: string;
  message: string;
  affectedCategories: readonly string[];
  demandMultiplier: number;
};

export const MARKET_EVENTS: readonly MarketEventDefinition[] = [
  {
    id: "game-launch",
    title: "Oyun lansmanı haftası",
    message: "Oyun ve bilgisayar ürünlerinde alıcı ilgisi yükseliyor.",
    affectedCategories: ["Oyun", "Bilgisayar"],
    demandMultiplier: 1.1,
  },
  {
    id: "moving-season",
    title: "Taşınma dönemi",
    message: "Ev ürünleri pazara daha sık geliyor; fiyatları karşılaştır.",
    affectedCategories: ["Ev/Yaşam"],
    demandMultiplier: 0.96,
  },
  {
    id: "collector-interest",
    title: "Koleksiyon ilgisi",
    message: "Nadir küçük eşya, fotoğraf ve müzik ürünleri öne çıkıyor.",
    affectedCategories: ["Küçük Eşya", "Fotoğraf", "Müzik"],
    demandMultiplier: 1.12,
  },
  {
    id: "mobility-season",
    title: "Yol sezonu",
    message: "Araç ve mobil ürünlerde talep hareketleniyor.",
    affectedCategories: ["Araç", "Telefon"],
    demandMultiplier: 1.08,
  },
  {
    id: "quiet-market",
    title: "Piyasa sakinliği",
    message: "Alıcılar daha seçici; kanıtı güçlü ve dengeli ilanlar öne çıkar.",
    affectedCategories: [],
    demandMultiplier: 0.92,
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
