import type { GameState, HomeState } from "../domain/models";

export const HOME_SEARCH_DELAY_MIN = 180;
export const HOME_RESULT_INTERVAL_MIN = 90;

export type HomeOption = {
  id: string;
  name: string;
  location: string;
  summary: string;
  priceMinor: number;
  assetKey: string;
  revealOffsetMin: number;
};

export const HOME_OPTIONS: readonly HomeOption[] = [
  {
    id: "garden_edge",
    name: "Bahçeli Başlangıç Evi",
    location: "Şehir çeperi",
    summary: "Sakin sokak, küçük bahçe ve korunaklı veranda.",
    priceMinor: 350_000_000,
    assetKey: "home_garden_edge",
    revealOffsetMin: HOME_SEARCH_DELAY_MIN,
  },
  {
    id: "city_residence",
    name: "Şehir Rezidans Dairesi",
    location: "Merkeze yakın",
    summary: "Düşük katlı yapıda balkonlu, kompakt şehir yaşamı.",
    priceMinor: 385_000_000,
    assetKey: "home_city_residence",
    revealOffsetMin: HOME_SEARCH_DELAY_MIN,
  },
  {
    id: "terrace_duplex",
    name: "Teraslı Dubleks",
    location: "Yamaç mahallesi",
    summary: "Geniş teras, iki kat ve ferah bir özel bahçe.",
    priceMinor: 425_000_000,
    assetKey: "home_terrace_duplex",
    revealOffsetMin: HOME_SEARCH_DELAY_MIN + HOME_RESULT_INTERVAL_MIN,
  },
  {
    id: "stone_courtyard",
    name: "Taş Avlulu Ev",
    location: "Tarihi doku",
    summary: "Restore edilmiş taş yapı ve sakin iç avlu.",
    priceMinor: 470_000_000,
    assetKey: "home_stone_courtyard",
    revealOffsetMin: HOME_SEARCH_DELAY_MIN + HOME_RESULT_INTERVAL_MIN * 2,
  },
  {
    id: "coastal_villa",
    name: "Sahil Yamaç Villası",
    location: "Deniz manzarası",
    summary: "Manzaralı teras ve ölçülü, çağdaş yaşam alanı.",
    priceMinor: 525_000_000,
    assetKey: "home_coastal_villa",
    revealOffsetMin: HOME_SEARCH_DELAY_MIN + HOME_RESULT_INTERVAL_MIN * 3,
  },
] as const;

export const homeOptionById = (id?: string) =>
  HOME_OPTIONS.find((home) => home.id === id);

export const homeSearchElapsedMin = (home: HomeState, gameTimeMin: number) =>
  home.searchStartedAtGameMin === undefined
    ? 0
    : Math.max(0, gameTimeMin - home.searchStartedAtGameMin);

export const availableHomeOptions = (home: HomeState, gameTimeMin: number) => {
  const elapsed = homeSearchElapsedMin(home, gameTimeMin);
  return home.searchStartedAtGameMin === undefined
    ? []
    : HOME_OPTIONS.filter((option) => elapsed >= option.revealOffsetMin);
};

export const nextHomeResult = (home: HomeState, gameTimeMin: number) => {
  const elapsed = homeSearchElapsedMin(home, gameTimeMin);
  return HOME_OPTIONS.find((option) => elapsed < option.revealOffsetMin);
};

export const startHomeSearch = (
  state: GameState,
  eligible: boolean,
  atGameMin: number,
): GameState =>
  eligible &&
  state.home.unlocked &&
  !state.home.purchased &&
  state.home.searchStartedAtGameMin === undefined
    ? {
        ...state,
        home: { ...state.home, searchStartedAtGameMin: atGameMin },
      }
    : state;
