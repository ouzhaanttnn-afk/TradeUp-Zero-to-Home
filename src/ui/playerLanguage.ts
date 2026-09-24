import { getLanguage, localizeCategory, localizeProduct, type Language } from "../i18n";

const legacyTerms: ReadonlyArray<readonly [string, string]> = [
  ["Pazar okuryazarlığı", "Pazar deneyimi"],
];

export function simplifyLegacyPlayerCopy(value: string, lang: Language = getLanguage()): string {
  const simplified = legacyTerms.reduce(
    (copy, [technical, simple]) => copy.replaceAll(technical, simple),
    value,
  );
  const normalized = simplified.replace(/\bLv\s?(\d+)\b/g, "Seviye $1");
  if (lang === "tr") return normalized;

  // First profitable sale
  let match = normalized.match(/^İlk kârlı satış: (.*)$/);
  if (match) {
    const item = localizeProduct("", match[1], lang);
    if (lang === "de") return `Erster profitabler Verkauf: ${item}`;
    if (lang === "es") return `Primera venta rentable: ${item}`;
    return `First profitable sale: ${item}`;
  }

  // First sale
  match = normalized.match(/^İlk satış: (.*)$/);
  if (match) {
    const item = localizeProduct("", match[1], lang);
    if (lang === "de") return `Erster Verkauf: ${item}`;
    if (lang === "es") return `Primera venta: ${item}`;
    return `First sale: ${item}`;
  }

  // New profit record
  match = normalized.match(/^Yeni kâr rekoru: (.*)$/);
  if (match) {
    const item = localizeProduct("", match[1], lang);
    if (lang === "de") return `Neuer Gewinnrekord: ${item}`;
    if (lang === "es") return `Nuevo récord de beneficio: ${item}`;
    return `New profit record: ${item}`;
  }

  // Prep contribution record
  match = normalized.match(/^Hazırlık katkısı rekoru: (.*)$/);
  if (match) {
    const item = localizeProduct("", match[1], lang);
    if (lang === "de") return `Vorbereitungsrekord: ${item}`;
    if (lang === "es") return `Récord de preparación: ${item}`;
    return `Prep contribution record: ${item}`;
  }

  // Wealth milestone reached
  if (normalized === "Servet eşiği aşıldı") {
    if (lang === "de") return "Vermögensmeilenstein erreicht";
    if (lang === "es") return "Hito de riqueza alcanzado";
    return "Wealth milestone reached";
  }

  // First high ticket trade
  match = normalized.match(/^İlk büyük işlem: (.*)$/);
  if (match) {
    const item = localizeProduct("", match[1], lang);
    if (lang === "de") return `Erster großer Deal: ${item}`;
    if (lang === "es") return `Primera gran operación: ${item}`;
    return `First big trade: ${item}`;
  }

  // Dominant category changed
  match = normalized.match(/^(.*) rotan öne çıktı$/);
  if (match) {
    const cat = localizeCategory(match[1], lang);
    if (lang === "de") return `${cat}-Route führend`;
    if (lang === "es") return `Ruta destacada: ${cat}`;
    return `${cat} route became prominent`;
  }

  // First home purchased
  match = normalized.match(/^İlk ev satın alındı: (.*)$/);
  if (match) {
    if (lang === "de") return `Erstes Haus gekauft: ${match[1]}`;
    if (lang === "es") return `Primera casa comprada: ${match[1]}`;
    return `First home purchased: ${match[1]}`;
  }

  // Home upgraded
  match = normalized.match(/^Ev yükseltildi: (.*)$/);
  if (match) {
    if (lang === "de") return `Haus aufgewertet: ${match[1]}`;
    if (lang === "es") return `Casa mejorada: ${match[1]}`;
    return `Home upgraded: ${match[1]}`;
  }

  // Market experience level
  match = normalized.match(/^Pazar deneyimi Seviye (\d+)$/);
  if (match) {
    if (lang === "de") return `Markterfahrung Stufe ${match[1]}`;
    if (lang === "es") return `Experiencia de mercado Nivel ${match[1]}`;
    return `Market experience Level ${match[1]}`;
  }

  // Category level
  match = normalized.match(/^(.*) Seviye (\d+)$/);
  if (match) {
    const cat = localizeCategory(match[1], lang);
    if (lang === "de") return `${cat} Stufe ${match[2]}`;
    if (lang === "es") return `${cat} Nivel ${match[2]}`;
    return `${cat} Level ${match[2]}`;
  }

  return normalized;
}

