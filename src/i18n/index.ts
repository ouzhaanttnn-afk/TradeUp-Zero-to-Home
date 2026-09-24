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

export function t(
  key: string,
  params?: Record<string, string | number>,
  lang: Language = currentLanguage,
): string {
  const textLang = lang ?? currentLanguage;
  let text = translations[textLang]?.[key] ?? translations.tr[key] ?? key;
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

const trHomeNameToId: Record<string, string> = {
  "Bahçeli Başlangıç Evi": "garden_edge",
  "Şehir Rezidans Dairesi": "city_residence",
  "Teraslı Dubleks": "terrace_duplex",
  "Taş Avlulu Ev": "stone_courtyard",
  "Sahil Yamaç Villası": "coastal_villa",
};

export function localizeHome(
  homeId: string,
  defaultName: string,
  defaultLocation: string,
  defaultSummary: string,
  lang = currentLanguage,
) {
  const resolvedId = homeCopies[homeId] ? homeId : trHomeNameToId[defaultName] ?? trHomeNameToId[homeId] ?? homeId;
  const item = homeCopies[resolvedId]?.[lang];
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

// Risk signal localization
const riskMap: Record<string, Record<Language, string>> = {
  "Başka teklif var": { tr: "Başka teklif var", en: "Other offer present", de: "Anderes Angebot", es: "Hay otra oferta" },
  "İlgi artıyor": { tr: "İlgi artıyor", en: "Interest rising", de: "Interesse steigt", es: "Interés en aumento" },
  "Talep çok": { tr: "Talep çok", en: "High demand", de: "Hohe Nachfrage", es: "Mucha demanda" },
  "İlgi sakin": { tr: "İlgi sakin", en: "Interest calm", de: "Ruhiges Interesse", es: "Interés tranquilo" },
};

export function localizeRisk(text: string, lang = currentLanguage): string {
  return riskMap[text]?.[lang] ?? text;
}

// Buyer persona localization
const buyerPersonaMap: Record<string, Record<Language, { label: string; tendency: string }>> = {
  QUICK: {
    tr: { label: "Hızlı alıcı", tendency: "Bugün teslim ister · daha düşük açar" },
    en: { label: "Quick buyer", tendency: "Wants same-day delivery · opens lower" },
    de: { label: "Schneller Käufer", tendency: "Will sofortige Übergabe · startet niedriger" },
    es: { label: "Comprador rápido", tendency: "Quiere entrega hoy · empieza más bajo" },
  },
  QUALITY: {
    tr: { label: "Kalite arayan", tendency: "Kondisyon ve ürün bilgisine önem verir" },
    en: { label: "Quality seeker", tendency: "Values condition and item details" },
    de: { label: "Qualitätskäufer", tendency: "Achtet auf Zustand und Produktdetails" },
    es: { label: "Busca calidad", tendency: "Valora la condición y los detalles" },
  },
  NEGOTIATOR: {
    tr: { label: "Pazarlıkçı", tendency: "Düşük açar · karşı teklife dirençlidir" },
    en: { label: "Negotiator", tendency: "Opens low · resists counter-offers" },
    de: { label: "Verhandler", tendency: "Startet niedrig · widersteht Gegenangeboten" },
    es: { label: "Negociador", tendency: "Empieza bajo · resiste contraofertas" },
  },
  COLLECTOR: {
    tr: { label: "Koleksiyoncu", tendency: "Nadir ve doğrulanmış ürüne daha çok öder" },
    en: { label: "Collector", tendency: "Pays more for rare and verified items" },
    de: { label: "Sammler", tendency: "Zahlt mehr für seltene und geprüfte Ware" },
    es: { label: "Coleccionista", tendency: "Paga más por artículos raros y verificados" },
  },
  RISK_AVERSE: {
    tr: { label: "Temkinli alıcı", tendency: "Belirsiz üründen uzak durur" },
    en: { label: "Cautious buyer", tendency: "Avoids uncertain items" },
    de: { label: "Vorsichtiger Käufer", tendency: "Meidet ungewisse Artikel" },
    es: { label: "Comprador precavido", tendency: "Evita artículos inciertos" },
  },
  BULK: {
    tr: { label: "Toplu alıcı", tendency: "Aynı türden ürün arar · indirim bekler" },
    en: { label: "Bulk buyer", tendency: "Looks for same-type items · expects discount" },
    de: { label: "Großkäufer", tendency: "Sucht gleiche Artikel · erwartet Rabatt" },
    es: { label: "Comprador al por mayor", tendency: "Busca artículos similares · espera descuento" },
  },
};

export function localizeBuyerPersona(
  buyerType: string,
  defaultPersonaOrLang?: { label: string; tendency: string } | Language,
  langArg?: Language,
) {
  const lang = typeof defaultPersonaOrLang === "string" ? defaultPersonaOrLang : (langArg ?? currentLanguage);
  const defaultPersona = typeof defaultPersonaOrLang === "object" && defaultPersonaOrLang !== null ? defaultPersonaOrLang : undefined;
  const item = buyerPersonaMap[buyerType]?.[lang];
  return {
    label: item?.label ?? defaultPersona?.label ?? buyerType,
    tendency: item?.tendency ?? defaultPersona?.tendency ?? "",
  };
}

// Market events localization
const marketEventMap: Record<string, Record<Language, { title: string; message: string }>> = {
  "game-launch": {
    tr: { title: "Oyun lansmanı haftası", message: "Oyun ve bilgisayar ürünlerinde alıcı ilgisi yükseliyor." },
    en: { title: "Game Launch Week", message: "Buyer interest in gaming and computer gear is rising." },
    de: { title: "Spiel-Launch-Woche", message: "Käuferinteresse an Gaming- und Computerartikeln steigt." },
    es: { title: "Semana de Lanzamiento", message: "El interés del comprador en juegos y ordenadores está aumentando." },
  },
  "moving-season": {
    tr: { title: "Taşınma dönemi", message: "Ev ürünleri pazara daha sık geliyor; fiyatları karşılaştır." },
    en: { title: "Moving Season", message: "Home items appear more frequently; compare prices." },
    de: { title: "Umzugssaison", message: "Haushaltsartikel erscheinen häufiger; Preise vergleichen." },
    es: { title: "Temporada de Mudanzas", message: "Los artículos del hogar aparecen con más frecuencia; compara precios." },
  },
  "collector-interest": {
    tr: { title: "Koleksiyon ilgisi", message: "Nadir küçük eşya, fotoğraf ve müzik ürünleri öne çıkıyor." },
    en: { title: "Collector Interest", message: "Rare small goods, photo, and music items stand out." },
    de: { title: "Sammler-Interesse", message: "Seltene Kleinartikel, Foto- und Musikgeräte rücken in den Fokus." },
    es: { title: "Interés de Coleccionistas", message: "Destacan artículos pequeños raros, fotografía y música." },
  },
  "mobility-season": {
    tr: { title: "Yol sezonu", message: "Araç ve mobil ürünlerde talep hareketleniyor." },
    en: { title: "Travel Season", message: "Demand for vehicles and mobile gear is moving up." },
    de: { title: "Reisesaison", message: "Die Nachfrage nach Fahrzeugen und Mobilgeräten zieht an." },
    es: { title: "Temporada de Viajes", message: "Aumenta la demanda de vehículos y dispositivos móviles." },
  },
  "quiet-market": {
    tr: { title: "Piyasa sakinliği", message: "Alıcılar daha seçici; kanıtı güçlü ve dengeli ilanlar öne çıkar." },
    en: { title: "Quiet Market", message: "Buyers are choosier; strong evidence and balanced listings stand out." },
    de: { title: "Ruhiger Markt", message: "Käufer sind wählerischer; fundierte und ausgewogene Inserate punkten." },
    es: { title: "Mercado Tranquilo", message: "Los compradores son más selectivos; destacan anuncios bien verificados y equilibrados." },
  },
};

export function localizeMarketEvent(
  event: { id: string; title: string; message: string },
  lang = currentLanguage,
) {
  const item = marketEventMap[event.id]?.[lang];
  return {
    title: item?.title ?? event.title,
    message: item?.message ?? event.message,
  };
}

const marketEventByMessageMap: Record<string, Record<Language, string>> = {
  "Oyun ve bilgisayar ürünlerinde alıcı ilgisi yükseliyor.": {
    tr: "Oyun ve bilgisayar ürünlerinde alıcı ilgisi yükseliyor.",
    en: "Buyer interest in gaming and computer gear is rising.",
    de: "Käuferinteresse an Gaming- und Computerartikeln steigt.",
    es: "El interés del comprador en juegos y ordenadores está aumentando.",
  },
  "Ev ürünleri pazara daha sık geliyor; fiyatları karşılaştır.": {
    tr: "Ev ürünleri pazara daha sık geliyor; fiyatları karşılaştır.",
    en: "Home items appear more frequently; compare prices.",
    de: "Haushaltsartikel erscheinen häufiger; Preise vergleichen.",
    es: "Los artículos del hogar aparecen con más frecuencia; compara precios.",
  },
  "Nadir küçük eşya, fotoğraf ve müzik ürünleri öne çıkıyor.": {
    tr: "Nadir küçük eşya, fotoğraf ve müzik ürünleri öne çıkıyor.",
    en: "Rare small goods, photo, and music items stand out.",
    de: "Seltene Kleinartikel, Foto- und Musikgeräte rücken in den Fokus.",
    es: "Destacan artículos pequeños raros, fotografía y música.",
  },
  "Araç ve mobil ürünlerde talep hareketleniyor.": {
    tr: "Araç ve mobil ürünlerde talep hareketleniyor.",
    en: "Demand for vehicles and mobile gear is moving up.",
    de: "Die Nachfrage nach Fahrzeugen und Mobilgeräten zieht an.",
    es: "Aumenta la demanda de vehículos y dispositivos móviles.",
  },
  "Alıcılar daha seçici; kanıtı güçlü ve dengeli ilanlar öne çıkar.": {
    tr: "Alıcılar daha seçici; kanıtı güçlü ve dengeli ilanlar öne çıkar.",
    en: "Buyers are choosier; strong evidence and balanced listings stand out.",
    de: "Käufer sind wählerischer; fundierte und ausgewogene Inserate punkten.",
    es: "Los compradores son más selectivos; destacan anuncios bien verificados y equilibrados.",
  },
};

export function localizeMarketMessage(msg: string, lang = currentLanguage): string {
  return marketEventByMessageMap[msg]?.[lang] ?? msg;
}


// Radar headline
const radarHeadlineMap: Record<string, Record<Language, string>> = {
  HIGH: { tr: "Talep yüksek", en: "High demand", de: "Hohe Nachfrage", es: "Alta demanda" },
  RISING: { tr: "Yükselişte", en: "On the rise", de: "Im Aufwärtstrend", es: "En alza" },
};

export function localizeRadarHeadline(tier: "HIGH" | "RISING", lang = currentLanguage): string {
  return radarHeadlineMap[tier]?.[lang] ?? (tier === "HIGH" ? "Talep yüksek" : "Yükselişte");
}

// FTUE Stage labels
const ftueStageMap: Record<string, Record<Language, string>> = {
  STARTING_SALE: { tr: "BAŞLANGIÇ SATIŞI", en: "STARTING SALE", de: "ERSTVERKAUF", es: "VENTA INICIAL" },
  COMPARE: { tr: "KARŞILAŞTIR", en: "COMPARE", de: "VERGLEICHEN", es: "COMPARAR" },
  EVIDENCE: { tr: "ÜRÜNÜ KONTROL ET", en: "CHECK ITEM", de: "ARTIKEL PRÜFEN", es: "VERIFICAR ARTÍCULO" },
  NEGOTIATION: { tr: "PAZARLIK", en: "NEGOTIATION", de: "VERHANDLUNG", es: "NEGOCIACIÓN" },
  PREPARATION: { tr: "HAZIRLIK", en: "PREPARATION", de: "VORBEREITUNG", es: "PREPARACIÓN" },
  LISTING: { tr: "İLAN", en: "LISTING", de: "INSERAT", es: "ANUNCIO" },
  BUYER_SALE: { tr: "ALICI TEKLİFİ", en: "BUYER OFFER", de: "KÄUFERANGEBOT", es: "OFERTA DE COMPRADOR" },
  COMPLETE: { tr: "TAMAMLANDI", en: "COMPLETE", de: "ABGESCHLOSSEN", es: "COMPLETO" },
};

export function localizeFtueStage(stage: string, lang = currentLanguage): string {
  return ftueStageMap[stage]?.[lang] ?? stage;
}

// FTUE Copy
const ftueCopyMap: Record<string, Record<Language, { title: string; body: string }>> = {
  STARTING_SALE: {
    tr: { title: "İlk sermayeni çıkar", body: "Eski defterini sat. Kazandığın parayla ilk ürününü alabilirsin." },
    en: { title: "Raise your starting capital", body: "Sell your old notebook. Use the proceeds to buy your first trade item." },
    de: { title: "Startkapital beschaffen", body: "Verkaufe dein altes Notizbuch. Nutze den Erlös für deinen ersten Deal." },
    es: { title: "Consigue tu capital inicial", body: "Vende tu viejo cuaderno. Con lo que ganes podrás comprar tu primer producto." },
  },
  COMPARE: {
    tr: { title: "Fiyat tek başına yetmez", body: "İki benzer defter var. Fiyatlarına ve durumlarına bak, hangisini alacağına sen karar ver." },
    en: { title: "Price alone is not enough", body: "There are two similar items. Compare prices and conditions to decide which to buy." },
    de: { title: "Der Preis allein reicht nicht", body: "Es gibt zwei ähnliche Artikel. Vergleiche Preise und Zustand vor dem Kauf." },
    es: { title: "El precio no lo es todo", body: "Hay dos artículos similares. Compara precios y condiciones antes de decidir." },
  },
  EVIDENCE: {
    tr: { title: "Ürün anlatıldığı gibi mi?", body: "Fotoğrafa bak, satıcıya sor ya da hızlı test yap. Bir kontrol seç." },
    en: { title: "Is the item as described?", body: "Check photos, ask the seller, or run a quick test. Pick an inspection." },
    de: { title: "Ist der Artikel wie beschrieben?", body: "Prüfe Fotos, frage den Verkäufer oder mache einen Schnelltest." },
    es: { title: "¿Está el artículo según lo descrito?", body: "Revisa las fotos, pregunta al vendedor o haz una prueba rápida." },
  },
  NEGOTIATION: {
    tr: { title: "İki teklif hakkın var", body: "Daha iyi bir fiyat iste. En fazla iki teklif verebilirsin." },
    en: { title: "You have two offers", body: "Ask for a better price. You can make up to two counter-offers." },
    de: { title: "Du hast zwei Angebote", body: "Verhandle einen besseren Preis. Du hast bis zu zwei Angebote frei." },
    es: { title: "Tienes dos intentos de oferta", body: "Pide un mejor precio. Puedes hacer hasta dos ofertas." },
  },
  PREPARATION: {
    tr: { title: "Ürüne değer ekle", body: "Temizle, test et veya eksiklerini tamamla. Ücreti ve etkisini görüp birini seç." },
    en: { title: "Add value to your item", body: "Clean, test, or complete parts. Review the cost and impact to choose one." },
    de: { title: "Artikel aufwerten", body: "Reinigen, testen oder Teile ergänzen. Prüfe Kosten und Wirkung." },
    es: { title: "Añade valor al artículo", body: "Limpia, prueba o completa partes. Revisa el coste y su impacto." },
  },
  LISTING: {
    tr: { title: "Satışa çıkar", body: "Ürünün hazır. İlanını oluştur, alıcı tekliflerini değerlendir." },
    en: { title: "Put on sale", body: "Your item is ready. Create your listing and evaluate buyer offers." },
    de: { title: "Zum Verkauf anbieten", body: "Dein Artikel ist bereit. Erstelle dein Inserat und prüfe Angebote." },
    es: { title: "Poner a la venta", body: "Tu artículo está listo. Crea tu anuncio y evalúa las ofertas." },
  },
  BUYER_SALE: {
    tr: { title: "Teklif geldi", body: "Ne harcadın, ne kazanacaksın? Teklifi incele; satıp satmamaya sen karar ver." },
    en: { title: "Offer received", body: "What did you spend vs earn? Review the offer and decide whether to sell." },
    de: { title: "Angebot erhalten", body: "Was hast du investiert, was springt heraus? Entscheide über den Verkauf." },
    es: { title: "Oferta recibida", body: "¿Cuánto gastaste y cuánto ganarás? Revisa la oferta y decide si vender." },
  },
  COMPLETE: {
    tr: { title: "İlk döngü tamamlandı", body: "Artık yeni fırsatlar arayabilir, ürünlerini hazırlayıp satabilirsin." },
    en: { title: "First loop complete", body: "Now you can scout new deals, prepare items, and flip for profit." },
    de: { title: "Erster Zyklus abgeschlossen", body: "Jetzt kannst du neue Deals suchen, Artikel vorbereiten und handeln." },
    es: { title: "Primer ciclo completado", body: "Ahora puedes buscar nuevas oportunidades, preparar artículos y vender." },
  },
};

export function localizeFtueCopy(
  stage: string,
  defaultCopy: { title: string; body: string },
  lang = currentLanguage,
) {
  const item = ftueCopyMap[stage]?.[lang];
  return {
    title: item?.title ?? defaultCopy.title,
    body: item?.body ?? defaultCopy.body,
  };
}

// Inspection options localization
const inspectionMap: Record<string, Record<Language, string>> = {
  PHOTO: { tr: "Fotoğrafları incele", en: "Examine photos", de: "Fotos prüfen", es: "Examinar fotos" },
  ASK_SELLER: { tr: "Satıcıya sor", en: "Ask seller", de: "Verkäufer fragen", es: "Preguntar al vendedor" },
  QUICK_TEST: { tr: "Hızlı test", en: "Quick test", de: "Schnelltest", es: "Prueba rápida" },
};

export function localizeInspection(
  kind: string,
  defaultLabel = kind,
  lang = currentLanguage,
): string {
  return inspectionMap[kind]?.[lang] ?? defaultLabel;
}

// Attribute value localization
export function localizeAttributeValue(
  value: string | number | boolean,
  lang = currentLanguage,
): string {
  if (typeof value === "boolean") {
    if (value) {
      return lang === "tr" ? "Var" : lang === "de" ? "Ja" : lang === "es" ? "Sí" : "Yes";
    }
    return lang === "tr" ? "Yok" : lang === "de" ? "Nein" : "No";
  }
  if (typeof value === "string") {
    if (value === "Temel") return lang === "tr" ? "Temel" : lang === "de" ? "Basis" : lang === "es" ? "Básico" : "Basic";
    if (value === "Plus") return "Plus";
    if (value === "Pro") return "Pro";
  }
  return String(value);
}

// Visual condition label
export function localizeVisualCondition(condition: number, lang = currentLanguage): string {
  if (condition < 55) {
    return translations[lang]?.["visual.conditionWorn"] || "Yıpranmış";
  }
  if (condition < 80) {
    return translations[lang]?.["visual.conditionUsed"] || "Kullanılmış";
  }
  return translations[lang]?.["visual.conditionClean"] || "Temiz";
}

export * from "./types";
export * from "./labelTranslations";

