import type { GameState, OwnedAsset } from "../domain/models";
import { money } from "../game";

const metadataAmount = (value: unknown) =>
  typeof value === "number" && Number.isInteger(value) ? value : undefined;

export function purchaseDecisionCause(
  state: Pick<GameState, "transactionJournal">,
  asset: OwnedAsset,
) {
  const purchase = state.transactionJournal.find(
    (entry) => entry.kind === "PURCHASE" && entry.assetId === asset.id,
  );
  const askingMinor = metadataAmount(purchase?.metadata.askingPriceMinor);
  const paidMinor = metadataAmount(purchase?.metadata.purchasePriceMinor);
  const negotiatedSavingMinor =
    askingMinor !== undefined && paidMinor !== undefined
      ? Math.max(0, askingMinor - paidMinor)
      : 0;

  if (negotiatedSavingMinor > 0) {
    return `Pazarlık, liste fiyatına göre ${money(negotiatedSavingMinor)} tasarruf sağladı.`;
  }
  if (asset.instance.evidenceConfidence < 0.46) {
    return "Bu alımdaki en büyük belirsizlik, ürün bilgilerinin hâlâ zayıf olması.";
  }
  return "Bu kararın dayanağı, görünür fiyat aralığı ve kontrol edilen ürün bilgileri.";
}

export function saleDecisionCause(asset: OwnedAsset, proceedsMinor: number) {
  const profitMinor = proceedsMinor - asset.bookCostMinor;
  if (profitMinor < 0) {
    return `Zararın ana nedeni: satış fiyatı toplam harcamanın ${money(-profitMinor)} altında kaldı.`;
  }
  if (profitMinor === 0) {
    return "Satış fiyatı toplam harcamayı tam karşıladı; kâr veya zarar oluşmadı.";
  }
  const completedPreparation = asset.instance.preparationHistory.some(
    (record) => record.state === "COMPLETE" && record.kind !== "TEST",
  );
  if (completedPreparation && asset.preparationCostMinor > 0) {
    return `Hazırlık maliyeti dahil, satış fiyatı toplam harcamanı ${money(profitMinor)} aştı.`;
  }
  return `Kârın ana nedeni: satış fiyatı toplam harcamanı ${money(profitMinor)} aştı.`;
}
