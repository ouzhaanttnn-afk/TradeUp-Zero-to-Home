import type { Language } from "../i18n";

export type SpecializationId = "RESTORER" | "NEGOTIATOR" | "SCOUT";

export type SpecializationMeta = {
  id: SpecializationId;
  title: Record<Language, string>;
  subtitle: Record<Language, string>;
  perks: Record<Language, string[]>;
  icon: string;
};

export const SPEC_ICONS: Record<SpecializationId, string> = {
  RESTORER: "🔧",
  NEGOTIATOR: "💼",
  SCOUT: "🧭",
};

export const SPECIALIZATIONS: Record<SpecializationId, SpecializationMeta> = {
  RESTORER: {
    id: "RESTORER",
    icon: "atolye-ustasi",
    title: {
      tr: "Atölye Ustası",
      en: "Master Restorer",
      de: "Restaurierungsmeister",
      es: "Maestro Restaurador",
    },
    subtitle: {
      tr: "Kusurları giderir, kondisyonu zirveye taşır",
      en: "Fixes defects, elevates condition to the max",
      de: "Behebt Mängel, maximiert den Zustand",
      es: "Corrige defectos, eleva el estado al máximo",
    },
    perks: {
      tr: [
        "Temizlik ve bakımda +2 bonus kondisyon kazanımı",
        "Hazırlık tamir sürelerinde %25 zaman tasarrufu",
        "Eksik parça tamamlama işlemlerinde ek değer artışı",
      ],
      en: [
        "+2 bonus condition gain on cleaning and care",
        "25% faster preparation and repair turnaround",
        "Enhanced value boost on missing accessory completion",
      ],
      de: [
        "+2 Bonus-Zustand bei Reinigung und Pflege",
        "25% schnellere Vorbereitungs- und Reparaturzeit",
        "Erhöhter Wertzuwachs bei Ergänzung fehlender Teile",
      ],
      es: [
        "+2 de condición adicional en limpieza y cuidado",
        "25% más rápido en preparación y reparaciones",
        "Mayor aumento de valor al completar accesorios faltantes",
      ],
    },
  },
  NEGOTIATOR: {
    id: "NEGOTIATOR",
    icon: "altin-vizyoner",
    title: {
      tr: "Kurt Pazarlıkçı",
      en: "Shark Negotiator",
      de: "Meisterverhandler",
      es: "Hábil Negociador",
    },
    subtitle: {
      tr: "Ucuza alır, tok satıcıları ikna eder",
      en: "Buys low, convinces stubborn sellers",
      de: "Kauft günstig, überzeugt sture Verkäufer",
      es: "Compra barato, convence a vendedores difíciles",
    },
    perks: {
      tr: [
        "Satıcılar daha düşük teklifleri kabul eder (%5 pazarlık esnekliği)",
        "Alıcıların açılış teklifleri %8 daha yüksek başlar",
        "Karşı tekliflerde alıcıların vazgeçme riski azalır",
      ],
      en: [
        "Sellers accept lower bids (5% floor discount leeway)",
        "Buyer opening bids start 8% higher",
        "Reduced buyer walkaway risk on counter-offers",
      ],
      de: [
        "Verkäufer akzeptieren niedrigere Gebote (5% Verhandlungsspielraum)",
        "Käufer starten ihre Eröffnungsgebote 8% höher",
        "Geringeres Absprungrisiko der Käufer bei Gegenangeboten",
      ],
      es: [
        "Vendedores aceptan ofertas más bajas (5% de margen)",
        "Las ofertas iniciales de compradores empiezan 8% más altas",
        "Menor riesgo de que el comprador se retire al contraofertar",
      ],
    },
  },
  SCOUT: {
    id: "SCOUT",
    icon: "pazar-kasifi",
    title: {
      tr: "Pazar Avcısı",
      en: "Market Scout",
      de: "Marktkundschafter",
      es: "Cazador de Mercado",
    },
    subtitle: {
      tr: "Gizli fırsatları ve trend dalgalarını önceden yakalar",
      en: "Spots hidden steals and rides trend waves early",
      de: "Entdeckt verborgene Schnäppchen und Trendwellen frühzeitig",
      es: "Encuentra gangas ocultas y aprovecha tendencias antes",
    },
    perks: {
      tr: [
        "Radar etkinliklerindeki kategorilerde talep +%20 daha güçlü",
        "Pazar taramalarında yüksek kâr marjlı fırsat ilanları öne çıkar",
        "Takipteki ilanlarda fiyat indirim alarmları öncelikli düşer",
      ],
      en: [
        "+20% stronger demand on active Radar event categories",
        "High-margin steal deals appear more prominently",
        "Priority alert notifications on watched listing price drops",
      ],
      de: [
        "+20% stärkere Nachfrage bei aktiven Radar-Event-Kategorien",
        "Hochmargige Schnäppchen-Angebote werden hervorgehoben",
        "Prioritäts-Benachrichtigungen bei Preissenkungen beobachteter Artikel",
      ],
      es: [
        "+20% más demanda en categorías de eventos de Radar activos",
        "Las ofertas de alto margen aparecen destacadas",
        "Notificaciones prioritarias en bajadas de precio de seguidos",
      ],
    },
  },
};

export function getSpecialization(
  specId?: SpecializationId | null,
): SpecializationMeta | null {
  if (!specId || !SPECIALIZATIONS[specId]) return null;
  return SPECIALIZATIONS[specId];
}
