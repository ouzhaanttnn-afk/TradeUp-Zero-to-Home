import type { OwnedAsset, PreparationDefinition } from "../domain/models";
import { preparationOutcome } from "../domain/preparation";

const percent = (value: number) =>
  new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(value);

export function preparationPresentation(
  asset: OwnedAsset,
  action: PreparationDefinition,
) {
  const outcome = preparationOutcome(asset, action);
  const effects = [];
  if (action.conditionGain) {
    const gain = outcome.condition - asset.instance.condition;
    effects.push(
      gain === 0
        ? "Kondisyon sınırda"
        : `Kondisyon ${gain > 0 ? "+" : ""}${gain} puan`,
    );
  }
  if (action.confidenceGain) {
    const gain =
      (outcome.evidenceConfidence - asset.instance.evidenceConfidence) * 100;
    effects.push(
      gain === 0 ? "Bilgi güveni tam" : `Bilgi güveni +${percent(gain)} puan`,
    );
  }
  effects.push(
    action.valueGainBps
      ? `Değer etkisi +%${percent(action.valueGainBps / 100)}`
      : "Doğrudan değer artışı yok",
  );
  effects.push(`Satış hızı +${percent(action.liquidityGainBps / 100)} puan`);
  if (action.kind === "COMPLETE")
    effects.push(
      asset.instance.accessoryComplete
        ? "Aksesuarlar zaten tam"
        : "Eksik aksesuarlar tamamlanır",
    );
  return effects;
}
