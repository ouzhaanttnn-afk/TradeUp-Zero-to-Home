import { useSyncExternalStore } from "react";
import type { Language } from "./types";
import { SUPPORTED_LANGUAGES } from "./types";
import { translations } from "./translations";

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

// Category localization map
const categoryMap: Record<string, Record<Language, string>> = {
  "Küçük Eşya": { tr: "Küçük Eşya", en: "Small Goods", de: "Kleinartikel", es: "Artículos pequeños" },
  "Ses": { tr: "Ses", en: "Audio", de: "Audio", es: "Audio" },
  "Görüntü": { tr: "Görüntü", en: "Visual", de: "Video", es: "Imagen" },
  "Araç": { tr: "Araç", en: "Vehicles", de: "Fahrzeuge", es: "Vehículos" },
  "Hobi": { tr: "Hobi", en: "Hobbies", de: "Hobbys", es: "Afición" },
  "Ev": { tr: "Ev", en: "Home", de: "Wohnen", es: "Hogar" },
  "Atölye": { tr: "Atölye", en: "Workshop", de: "Werkstatt", es: "Taller" },
  "Retro": { tr: "Retro", en: "Retro", de: "Retro", es: "Retro" },
  "Müzik": { tr: "Müzik", en: "Music", de: "Musik", es: "Música" },
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
