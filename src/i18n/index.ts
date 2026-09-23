import { useSyncExternalStore } from "react";
import type { Language } from "./types";
import { SUPPORTED_LANGUAGES } from "./types";
import { translations } from "./translations";
import {
  productTranslations,
  trNameToId,
  idToTrName,
} from "./productTranslations";

const STORAGE_KEY = "tradeup_language";

function detectInitialLanguage(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (saved && (saved === "tr" || saved === "en" || saved === "de" || saved === "es")) {
      return saved;
    }
  } catch {
    // Ignore storage errors in sandbox/testing
  }

  return "tr";
}

let currentLanguage: Language = detectInitialLanguage();
const listeners = new Set<() => void>();

export function getLanguage(): Language {
  return currentLanguage;
}

export function setLanguage(lang: Language): void {
  if (currentLanguage === lang) return;
  currentLanguage = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  } catch {
    // Ignore storage errors
  }
  listeners.forEach((listener) => listener());
}

export function subscribeLanguage(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useLanguage(): Language {
  return useSyncExternalStore(subscribeLanguage, getLanguage, () => "tr");
}

export function t(key: string, params?: Record<string, string | number>): string {
  const lang = currentLanguage;
  let text = translations[lang]?.[key] ?? translations.tr[key] ?? key;
  if (params) {
    Object.entries(params).forEach(([param, val]) => {
      text = text.replace(new RegExp(`\\{${param}\\}`, "g"), String(val));
    });
  }
  return text;
}

export function useTranslation() {
  const lang = useLanguage();
  return {
    lang,
    t: (key: string, params?: Record<string, string | number>) => {
      let text = translations[lang]?.[key] ?? translations.tr[key] ?? key;
      if (params) {
        Object.entries(params).forEach(([param, val]) => {
          text = text.replace(new RegExp(`\\{${param}\\}`, "g"), String(val));
        });
      }
      return text;
    },
    setLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
  };
}

// Product name localization
export function localizeProduct(
  idOrName: string,
  defaultName: string = idOrName,
  lang = currentLanguage,
): string {
  if (lang === "tr") {
    return idToTrName[idOrName] ?? defaultName;
  }
  const id = trNameToId[idOrName] ?? idOrName;
  const translation = productTranslations[id]?.[lang];
  return translation ?? defaultName;
}

// Currency symbol & formatting (Fixed rate: 1 USD = 50 TRY / 5,000 minor)
export function currencySymbol(lang = currentLanguage): string {
  return lang === "tr" ? "₺" : "$";
}

const formatterTr = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const formatterUsdInt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const formatterUsdDec = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatMoney(minor: number, lang = currentLanguage): string {
  if (lang === "tr") {
    return formatterTr.format(minor / 100);
  }
  const usd = minor / 5000;
  return Number.isInteger(usd)
    ? formatterUsdInt.format(usd)
    : formatterUsdDec.format(usd);
}

// Category localization map
const categoryMap: Record<string, Record<Language, string>> = {
  "Küçük Eşya": { tr: "Küçük Eşya", en: "Small Goods", de: "Kleinartikel", es: "Artículos pequeños" },
  "Ses": { tr: "Ses", en: "Audio", de: "Audio", es: "Audio" },
  "Ev/Yaşam": { tr: "Ev/Yaşam", en: "Home & Living", de: "Haus & Wohnen", es: "Hogar y Vida" },
  "Oyun": { tr: "Oyun", en: "Gaming", de: "Gaming", es: "Videojuegos" },
  "Müzik": { tr: "Müzik", en: "Music", de: "Musik", es: "Música" },
  "Telefon": { tr: "Telefon", en: "Phones", de: "Smartphones", es: "Telefonía" },
  "Bilgisayar": { tr: "Bilgisayar", en: "Computers", de: "Computer", es: "Informática" },
  "Fotoğraf": { tr: "Fotoğraf", en: "Photography", de: "Fotografie", es: "Fotografía" },
  "Moda/Bakım": { tr: "Moda/Bakım", en: "Fashion & Care", de: "Mode & Pflege", es: "Moda y Cuidado" },
  "Araç": { tr: "Araç", en: "Vehicles", de: "Fahrzeuge", es: "Vehículos" },
  "Görüntü": { tr: "Görüntü", en: "Visual", de: "Video", es: "Imagen" },
  "Hobi": { tr: "Hobi", en: "Hobbies", de: "Hobbys", es: "Afición" },
  "Ev": { tr: "Ev", en: "Home", de: "Wohnen", es: "Hogar" },
  "Atölye": { tr: "Atölye", en: "Workshop", de: "Werkstatt", es: "Taller" },
  "Retro": { tr: "Retro", en: "Retro", de: "Retro", es: "Retro" },
};

export function localizeCategory(category: string, lang = currentLanguage): string {
  return categoryMap[category]?.[lang] ?? category;
}

// Confidence label
export function localizeConfidence(confidence: number, lang = currentLanguage): string {
  if (confidence >= 0.72) return translations[lang]["market.confidenceHigh"] || "Yüksek";
  if (confidence >= 0.46) return translations[lang]["market.confidenceMedium"] || "Orta";
  return translations[lang]["market.confidenceLow"] || "Düşük";
}

// Home localization map
const homeCopies: Record<string, Record<Language, { name: string; location: string; summary: string }>> = {
  garden_edge: {
    tr: { name: "Bahçeli Başlangıç Evi", location: "Şehir çeperi", summary: "Sakin sokak, küçük bahçe ve korunaklı veranda." },
    en: { name: "Starter Garden Home", location: "City outskirts", summary: "Quiet street, cozy garden, and sheltered porch." },
    de: { name: "Garten-Starterhaus", location: "Stadtrand", summary: "Ruhige Straße, kleiner Garten und geschützte Veranda." },
    es: { name: "Casa Inicial con Jardín", location: "Periferia", summary: "Calle tranquila, pequeño jardín y porche cubierto." },
  },
  city_residence: {
    tr: { name: "Şehir Rezidans Dairesi", location: "Merkeze yakın", summary: "Düşük katlı yapıda balkonlu, kompakt şehir yaşamı." },
    en: { name: "City Residence Apartment", location: "Near city center", summary: "Low-rise building with balcony, compact urban living." },
    de: { name: "Stadt-Residenz", location: "Zentrumsnah", summary: "Niedrige Bauweise mit Balkon, kompaktes urbanes Wohnen." },
    es: { name: "Apartamento Residencia Urbana", location: "Cerca del centro", summary: "Edificio de pocas plantas con balcón, vida urbana compacta." },
  },
  terrace_duplex: {
    tr: { name: "Teraslı Dubleks", location: "Yamaç mahallesi", summary: "Geniş teras, iki kat ve ferah bir özel bahçe." },
    en: { name: "Terrace Duplex", location: "Hillside neighborhood", summary: "Spacious terrace, two floors, and a private garden." },
    de: { name: "Terrassen-Maisonette", location: "Hanglage", summary: "Große Terrasse, zwei Etagen und privater Garten." },
    es: { name: "Dúplex con Terraza", location: "Barrio de colina", summary: "Amplia terraza, dos plantas y jardín privado." },
  },
  stone_courtyard: {
    tr: { name: "Taş Avlulu Ev", location: "Tarihi doku", summary: "Restore edilmiş taş yapı ve sakin iç avlu." },
    en: { name: "Stone Courtyard Manor", location: "Historic district", summary: "Restored stone heritage with a peaceful inner courtyard." },
    de: { name: "Historisches Steinhaus mit Innenhof", location: "Historisches Viertel", summary: "Restaurierter Steinbau mit idyllischem Innenhof." },
    es: { name: "Casa con Patio de Piedra", location: "Casco histórico", summary: "Estructura de piedra restaurada con patio interior sereno." },
  },
  coastal_villa: {
    tr: { name: "Sahil Yamaç Villası", location: "Deniz manzarası", summary: "Manzaralı teras ve ölçülü, çağdaş yaşam alanı." },
    en: { name: "Coastal Hillside Villa", location: "Sea view", summary: "Panoramic terrace with refined, contemporary living spaces." },
    de: { name: "Küsten-Hangvilla", location: "Meerblick", summary: "Aussichtsterrasse und modernes, elegantes Wohnen." },
    es: { name: "Villa Costera en la Colina", location: "Vistas al mar", summary: "Terraza panorámica y espacios de vida contemporáneos y elegantes." },
  },
};

export function localizeHome(
  homeId: string,
  defaultName: string,
  defaultLocation: string,
  defaultSummary: string,
  lang = currentLanguage,
) {
  const item = homeCopies[homeId]?.[lang];
  return {
    name: item?.name ?? defaultName,
    location: item?.location ?? defaultLocation,
    summary: item?.summary ?? defaultSummary,
  };
}

// Avatar localization map
const avatarCopies: Record<string, Record<Language, { name: string; role: string }>> = {
  "pazar-kasifi": {
    tr: { name: "Pazar Kaşifi", role: "Fırsat avcısı" },
    en: { name: "Market Scout", role: "Bargain Hunter" },
    de: { name: "Markt-Scout", role: "Schnäppchenjäger" },
    es: { name: "Explorador del Mercado", role: "Cazador de Oportunidades" },
  },
  "atolye-ustasi": {
    tr: { name: "Atölye Ustası", role: "Ürün yenileyici" },
    en: { name: "Workshop Master", role: "Restoration Specialist" },
    de: { name: "Werkstatt-Meister", role: "Restaurierungs-Spezialist" },
    es: { name: "Maestro del Taller", role: "Especialista en Restauración" },
  },
  "koleksiyon-uzmani": {
    tr: { name: "Koleksiyon Uzmanı", role: "Detay gözlemcisi" },
    en: { name: "Collector Expert", role: "Detail Connoisseur" },
    de: { name: "Sammler-Experte", role: "Detailkenner" },
    es: { name: "Experto Coleccionista", role: "Observador de Detalles" },
  },
  "neon-araci": {
    tr: { name: "Neon Aracı", role: "Canlı avatar" },
    en: { name: "Neon Broker", role: "Animated Avatar" },
    de: { name: "Neon-Broker", role: "Animierter Avatar" },
    es: { name: "Operador Neón", role: "Avatar Animado" },
  },
  "altin-vizyoner": {
    tr: { name: "Altın Vizyoner", role: "Canlı avatar" },
    en: { name: "Golden Visionary", role: "Animated Avatar" },
    de: { name: "Goldener Visionär", role: "Animierter Avatar" },
    es: { name: "Visionario Dorado", role: "Avatar Animado" },
  },
  "gece-analisti": {
    tr: { name: "Gece Analisti", role: "Canlı avatar" },
    en: { name: "Night Analyst", role: "Animated Avatar" },
    de: { name: "Nacht-Analyst", role: "Animierter Avatar" },
    es: { name: "Analista Nocturno", role: "Avatar Animado" },
  },
};

export function localizeAvatar(
  avatarId: string,
  defaultName: string,
  defaultRole: string,
  lang = currentLanguage,
) {
  const item = avatarCopies[avatarId]?.[lang];
  return {
    name: item?.name ?? defaultName,
    role: item?.role ?? defaultRole,
  };
}

// Preparation actions localization map
const preparationMap: Record<string, Record<Language, string>> = {
  CLEAN: { tr: "Temizle", en: "Clean", de: "Reinigen", es: "Limpiar" },
  TEST: { tr: "Test et", en: "Test", de: "Testen", es: "Probar" },
  COMPLETE: { tr: "Eksik tamamla", en: "Complete parts", de: "Teile ergänzen", es: "Completar partes" },
  RESTORE: { tr: "Bakım yap", en: "Restore", de: "Restaurieren", es: "Restaurar" },
  REFURBISH: { tr: "Detaylı yenile", en: "Refurbish", de: "Generalüberholen", es: "Reacondicionar" },
};

export function localizePreparation(
  kind: string,
  defaultLabel = kind,
  lang = currentLanguage,
): string {
  return preparationMap[kind]?.[lang] ?? defaultLabel;
}

// Seller label localization map
const sellerMap: Record<string, Record<Language, string>> = {
  urgent: { tr: "Acilci", en: "Urgent", de: "Eilig", es: "Urgente" },
  expert: { tr: "Piyasacı", en: "Market Pro", de: "Markt-Profi", es: "Experto de mercado" },
  uninformed: { tr: "Bilgisiz", en: "Uninformed", de: "Ahnungslos", es: "Desinformado" },
  emotional: { tr: "Duygusal", en: "Sentimental", de: "Emotional", es: "Sentimental" },
  merchant: { tr: "Tüccar", en: "Merchant", de: "Händler", es: "Comerciante" },
  risky: { tr: "Riskli", en: "Risky", de: "Riskant", es: "Arriesgado" },
};

export function localizeSeller(
  seller: string,
  defaultLabel = seller,
  lang = currentLanguage,
): string {
  return sellerMap[seller]?.[lang] ?? defaultLabel;
}

// Market signal localization map
const signalMap: Record<string, Record<Language, string>> = {
  "Belirsiz": { tr: "Belirsiz", en: "Uncertain", de: "Ungewiss", es: "Incierto" },
  "Sıcak fırsat": { tr: "Sıcak fırsat", en: "Hot Deal", de: "Heißer Deal", es: "Gran Oportunidad" },
  "İyi fiyat": { tr: "İyi fiyat", en: "Good Price", de: "Guter Preis", es: "Buen Precio" },
  "Pahalı": { tr: "Pahalı", en: "Overpriced", de: "Teuer", es: "Caro" },
  "Piyasa fiyatı": { tr: "Piyasa fiyatı", en: "Fair Market", de: "Marktpreis", es: "Precio de Mercado" },
};

export function localizeSignal(text: string, lang = currentLanguage): string {
  return signalMap[text]?.[lang] ?? text;
}


// Store product localized copies
const storeCopies: Record<string, Record<Language, { title: string; detail: string }>> = {
  tradeup_premium_lifetime: {
    tr: {
      title: "TradeUp Premium",
      detail: "Hızlandırmaları video izlemeden kullan; 30 ticaret reklamını atla. Hak sınırları değişmez.",
    },
    en: {
      title: "TradeUp Premium",
      detail: "Use boosts without watching ads; skip 30 trade ads. Gameplay limits unchanged.",
    },
    de: {
      title: "TradeUp Premium",
      detail: "Boosts ohne Werbung nutzen; 30 Handels-Werbungen überspringen. Grenzen unverändert.",
    },
    es: {
      title: "TradeUp Premium",
      detail: "Usa mejoras sin ver anuncios; salta 30 anuncios de comercio. Límites intactos.",
    },
  },
  tradeup_theme_night_market: {
    tr: {
      title: "Gece Pazarı teması",
      detail: "Yalnız arayüz görünümünü kişiselleştirir.",
    },
    en: {
      title: "Night Market theme",
      detail: "Customizes interface appearance only.",
    },
    de: {
      title: "Nachtmarkt-Design",
      detail: "Passt ausschließlich das Oberflächen-Design an.",
    },
    es: {
      title: "Tema Mercado Nocturno",
      detail: "Personaliza únicamente el aspecto de la interfaz.",
    },
  },
  tradeup_theme_workshop: {
    tr: {
      title: "Endüstriyel Atölye teması",
      detail: "Yalnız arayüz görünümünü kişiselleştirir.",
    },
    en: {
      title: "Industrial Workshop theme",
      detail: "Customizes interface appearance only.",
    },
    de: {
      title: "Industriewerkstatt-Design",
      detail: "Passt ausschließlich das Oberflächen-Design an.",
    },
    es: {
      title: "Tema Taller Industrial",
      detail: "Personaliza únicamente el aspecto de la interfaz.",
    },
  },
  tradeup_home_styles_01: {
    tr: {
      title: "Ev stilleri paketi",
      detail: "Ev finali için üç görsel stil; ilerlemeye para eklemez.",
    },
    en: {
      title: "Home Styles Pack",
      detail: "Three visual styles for the home finale; cosmetic only.",
    },
    de: {
      title: "Hausstile-Paket",
      detail: "Drei visuelle Stile für das Hausfinale; rein kosmetisch.",
    },
    es: {
      title: "Paquete de Estilos de Casa",
      detail: "Tres estilos visuales para el final de la casa; puramente cosmético.",
    },
  },
  tradeup_animated_avatars_01: {
    tr: {
      title: "Canlı avatar koleksiyonu",
      detail: "Üç hareketli profil görünümü; yalnız kozmetiktir.",
    },
    en: {
      title: "Live Avatar Collection",
      detail: "Three animated profile avatars; purely cosmetic.",
    },
    de: {
      title: "Live-Avatar-Kollektion",
      detail: "Drei animierte Profil-Avatare; rein kosmetisch.",
    },
    es: {
      title: "Colección de Avatares Animados",
      detail: "Tres avatares de perfil con animación; solo cosmético.",
    },
  },
};

export function localizeStoreProduct(productId: string, defaultTitle: string, defaultDetail: string, lang = currentLanguage) {
  const item = storeCopies[productId]?.[lang];
  return {
    title: item?.title || defaultTitle,
    detail: item?.detail || defaultDetail,
  };
}

export * from "./types";
