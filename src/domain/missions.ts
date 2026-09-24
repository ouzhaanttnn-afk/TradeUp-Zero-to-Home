import type { GameState } from "./models";
import type { Language } from "../i18n";
import { completedTradeCount } from "./economy";

export type FlippingMission = {
  id: string;
  badge: Record<Language, string>;
  title: Record<Language, string>;
  description: Record<Language, string>;
  current: number;
  target: number;
  completed: boolean;
  rewardXp: number;
};

export function getActiveMissions(state: GameState): FlippingMission[] {
  const trades = completedTradeCount(state);
  const prepCount = state.ownedAssets.reduce(
    (count, a) => count + a.instance.preparationHistory.length,
    0,
  );
  const profitableSales = state.transactionJournal.filter(
    (entry) => entry.kind === "SALE" && entry.realizedProfitDeltaMinor > 0,
  ).length;

  const missions: FlippingMission[] = [
    {
      id: "prep_mastery",
      badge: {
        tr: "Atölye Görevi",
        en: "Workshop Task",
        de: "Werkstatt-Aufgabe",
        es: "Misión de Taller",
      },
      title: {
        tr: "Usta Restorasyonu",
        en: "Master Restoration",
        de: "Meister-Restaurierung",
        es: "Restauración Maestra",
      },
      description: {
        tr: "En az 2 eşyayı temizle veya test ederek hazırla.",
        en: "Prepare at least 2 items via cleaning or testing.",
        de: "Bereite mindestens 2 Artikel durch Reinigung oder Testen vor.",
        es: "Prepara al menos 2 artículos limpiando o probando.",
      },
      current: Math.min(2, prepCount),
      target: 2,
      completed: prepCount >= 2,
      rewardXp: 120,
    },
    {
      id: "profitable_trader",
      badge: {
        tr: "Ticaret Hedefi",
        en: "Trading Target",
        de: "Handelsziel",
        es: "Meta Comercial",
      },
      title: {
        tr: "Kârlı Satış Serisi",
        en: "Profitable Run",
        de: "Gewinnbringende Serie",
        es: "Racha de Ganancias",
      },
      description: {
        tr: "3 kârlı satışı başarıyla tamamla.",
        en: "Complete 3 profitable sales successfully.",
        de: "Schließe 3 gewinnbringende Verkäufe erfolgreich ab.",
        es: "Completa 3 ventas con ganancia exitosamente.",
      },
      current: Math.min(3, profitableSales),
      target: 3,
      completed: profitableSales >= 3,
      rewardXp: 200,
    },
    {
      id: "market_volume",
      badge: {
        tr: "Hacim Hedefi",
        en: "Volume Target",
        de: "Volumen-Ziel",
        es: "Meta de Volumen",
      },
      title: {
        tr: "Piyasa Hacmi",
        en: "Market Volume",
        de: "Marktvolumen",
        es: "Volumen de Mercado",
      },
      description: {
        tr: "Toplamda 5 işlem tamamlayarak piyasada yer edin.",
        en: "Complete 5 total trades to establish your market presence.",
        de: "Schließe 5 Trades ab, um deine Marktpräsenz aufzubauen.",
        es: "Completa 5 operaciones para consolidar tu presencia.",
      },
      current: Math.min(5, trades),
      target: 5,
      completed: trades >= 5,
      rewardXp: 250,
    },
  ];

  return missions;
}
