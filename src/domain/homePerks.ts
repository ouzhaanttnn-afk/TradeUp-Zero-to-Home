import type { HomeState } from "./models";
import type { Language } from "../i18n";

export type HomePerk = {
  id: string;
  badge: Record<Language, string>;
  title: Record<Language, string>;
  description: Record<Language, string>;
  inventoryBonus: number;
  listingBonus: number;
  prepDurationDiscount: number;
  buyerTempoBonus: number;
  showcaseCapacity: number;
};

export const HOME_PERKS: Record<string, HomePerk> = {
  garden_edge: {
    id: "garden_edge",
    badge: {
      tr: "Huzurlu Veranda",
      en: "Peaceful Veranda",
      de: "Ruhige Veranda",
      es: "Veranda Serena",
    },
    title: {
      tr: "Geniş Bahçe Deposu",
      en: "Spacious Garden Storage",
      de: "Großer Garten-Lagerraum",
      es: "Almacén de Jardín",
    },
    description: {
      tr: "+1 Ekstra Envanter Yuvası ve alıcı tekliflerinde %10 daha hızlı akış.",
      en: "+1 Extra inventory slot and 10% faster buyer offer flow.",
      de: "+1 Extra Inventarplatz und 10% schnellerer Käuferfluss.",
      es: "+1 espacio de inventario adicional y ofertas 10% más rápidas.",
    },
    inventoryBonus: 1,
    listingBonus: 0,
    prepDurationDiscount: 0,
    buyerTempoBonus: 0.1,
    showcaseCapacity: 3,
  },
  city_residence: {
    id: "city_residence",
    badge: {
      tr: "Merkezi Konum",
      en: "Central Hub",
      de: "Zentraler Standort",
      es: "Ubicación Céntrica",
    },
    title: {
      tr: "Ticaret Ağı & İlan Erişimi",
      en: "Trade Network & Listing Reach",
      de: "Handelsnetz & Reichweite",
      es: "Red Comercial y Visibilidad",
    },
    description: {
      tr: "+1 Ekstra İlan Yuvası ve pazar taramalarında hızlı yenilenme.",
      en: "+1 Extra listing slot and accelerated market scan recovery.",
      de: "+1 Extra Angebotsplatz und schnellere Marktsuche-Erholung.",
      es: "+1 espacio de anuncio adicional y recarga de escaneos más rápida.",
    },
    inventoryBonus: 1,
    listingBonus: 1,
    prepDurationDiscount: 0,
    buyerTempoBonus: 0.15,
    showcaseCapacity: 3,
  },
  terrace_duplex: {
    id: "terrace_duplex",
    badge: {
      tr: "Özel Atölye",
      en: "Private Workshop",
      de: "Eigene Werkstatt",
      es: "Taller Privado",
    },
    title: {
      tr: "Hızlı Restorasyon & Geniş Depolama",
      en: "Rapid Restoration & Deep Storage",
      de: "Schnell-Restaurierung & Tiefenlager",
      es: "Restauración Rápida y Espacio",
    },
    description: {
      tr: "+2 Ekstra Envanter Yuvası ve tüm hazırlık/bakım sürelerinde %20 zaman tasarrufu.",
      en: "+2 Extra inventory slots and 20% faster preparation turnarounds.",
      de: "+2 Extra Inventarplätze und 20% schnellere Vorbereitungszeit.",
      es: "+2 espacios de inventario y 20% más rápido en preparación.",
    },
    inventoryBonus: 2,
    listingBonus: 1,
    prepDurationDiscount: 0.2,
    buyerTempoBonus: 0.15,
    showcaseCapacity: 4,
  },
  stone_courtyard: {
    id: "stone_courtyard",
    badge: {
      tr: "Tarihi Galeri",
      en: "Historic Gallery",
      de: "Historische Galerie",
      es: "Galería Histórica",
    },
    title: {
      tr: "Geniş Koleksiyon Vitrini",
      en: "Expanded Collector Showcase",
      de: "Erweiterte Sammler-Vitrine",
      es: "Vitrina de Colección Ampliada",
    },
    description: {
      tr: "Vitrin kapasitesi 5'e çıkar, koleksiyoncu ve kalite arayan alıcılar %30 daha sık gelir.",
      en: "Showcase capacity expands to 5 items; collectors visit 30% more often.",
      de: "Vitrine fasst bis zu 5 Stücke; Sammler kommen 30% häufiger.",
      es: "La vitrina se amplía a 5 piezas; los coleccionistas vienen 30% más a menudo.",
    },
    inventoryBonus: 2,
    listingBonus: 1,
    prepDurationDiscount: 0.2,
    buyerTempoBonus: 0.25,
    showcaseCapacity: 5,
  },
  coastal_villa: {
    id: "coastal_villa",
    badge: {
      tr: "Mogul Genel Merkezi",
      en: "Mogul Headquarters",
      de: "Mogul-Hauptquartier",
      es: "Sede del Magnate",
    },
    title: {
      tr: "Zirve Yaşamı & Prestij",
      en: "Peak Living & Elite Prestige",
      de: "Gipfelleben & Elite-Prestige",
      es: "Vida en la Cima y Prestigio",
    },
    description: {
      tr: "+3 Ekstra Envanter, 5'li Vitrin ve VIP alıcıların açılış tekliflerinde %10 artış.",
      en: "+3 Extra inventory, 5-slot showcase, and VIP buyer opening bids 10% higher.",
      de: "+3 Extra Inventar, 5er-Vitrine und VIP-Eröffnungsgebote 10% höher.",
      es: "+3 de inventario, vitrina de 5 piezas y ofertas de compradores VIP 10% más altas.",
    },
    inventoryBonus: 3,
    listingBonus: 2,
    prepDurationDiscount: 0.25,
    buyerTempoBonus: 0.35,
    showcaseCapacity: 5,
  },
};

export function getActiveHomePerk(home?: HomeState): HomePerk | null {
  if (!home?.purchased || !home.purchasedHomeId) return null;
  return HOME_PERKS[home.purchasedHomeId] ?? null;
}
