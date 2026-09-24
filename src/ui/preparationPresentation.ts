import type { OwnedAsset, PreparationDefinition } from "../domain/models";
import { preparationOutcome } from "../domain/preparation";
import { getLanguage, t, type Language } from "../i18n";

const percent = (value: number, lang: Language) =>
  new Intl.NumberFormat(lang === "tr" ? "tr-TR" : lang === "de" ? "de-DE" : lang === "es" ? "es-ES" : "en-US", { maximumFractionDigits: 2 }).format(value);

export function preparationPresentation(
  asset: OwnedAsset,
  action: PreparationDefinition,
  lang: Language = getLanguage(),
) {
  const outcome = preparationOutcome(asset, action);
  const effects = [];
  if (action.conditionGain) {
    const gain = outcome.condition - asset.instance.condition;
    effects.push(
      gain === 0
        ? t("prep.conditionAtCap", undefined, lang)
        : t("prep.conditionGain", { sign: gain > 0 ? "+" : "", gain }, lang),
    );
  }
  if (action.confidenceGain) {
    const gain =
      (outcome.evidenceConfidence - asset.instance.evidenceConfidence) * 100;
    effects.push(
      gain === 0
        ? t("prep.confidenceMax", undefined, lang)
        : t("prep.confidenceGain", { gain: percent(gain, lang) }, lang),
    );
  }
  effects.push(
    action.valueGainBps
      ? t("prep.valueGain", { gain: percent(action.valueGainBps / 100, lang) }, lang)
      : t("prep.noDirectValue", undefined, lang),
  );
  effects.push(t("prep.speedGain", { gain: percent(action.liquidityGainBps / 100, lang) }, lang));
  if (action.kind === "COMPLETE")
    effects.push(
      asset.instance.accessoryComplete
        ? t("prep.accComplete", undefined, lang)
        : t("prep.accMissingRestored", undefined, lang),
    );
  return effects;
}
