import type { GameState, OwnedAsset } from "../domain/models";
import { money } from "../game";
import { t, getLanguage, type Language } from "../i18n";

const metadataAmount = (value: unknown) =>
  typeof value === "number" && Number.isInteger(value) ? value : undefined;

export function purchaseDecisionCause(
  state: Pick<GameState, "transactionJournal">,
  asset: OwnedAsset,
  lang: Language = getLanguage(),
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
    return t("decision.negotiationSaving", { saving: money(negotiatedSavingMinor, lang) }, lang);
  }
  if (asset.instance.evidenceConfidence < 0.46) {
    return t("decision.uncertaintyWeak", undefined, lang);
  }
  return t("decision.groundedPrice", undefined, lang);
}

export function saleDecisionCause(
  asset: OwnedAsset,
  proceedsMinor: number,
  lang: Language = getLanguage(),
) {
  const profitMinor = proceedsMinor - asset.bookCostMinor;
  if (profitMinor < 0) {
    return t("decision.lossCause", { amount: money(-profitMinor, lang) }, lang);
  }
  if (profitMinor === 0) {
    return t("decision.breakeven", undefined, lang);
  }
  const completedPreparation = asset.instance.preparationHistory.some(
    (record) => record.state === "COMPLETE" && record.kind !== "TEST",
  );
  if (completedPreparation && asset.preparationCostMinor > 0) {
    return t("decision.prepProfit", { amount: money(profitMinor, lang) }, lang);
  }
  return t("decision.profitCause", { amount: money(profitMinor, lang) }, lang);
}
