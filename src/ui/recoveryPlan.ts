import { activeOwnedAssets, activePlayerListings } from "../domain/economy";
import type { GameState } from "../domain/models";
import { t, type Language } from "../i18n";

export function recoveryPlan(state: GameState, lang?: Language) {
  const assets = activeOwnedAssets(state);
  const assetValueMinor = assets.reduce(
    (total, asset) => total + asset.instance.fairValueMinor,
    0,
  );
  const totalMinor = state.cashMinor + assetValueMinor;
  const cashShare = totalMinor > 0 ? state.cashMinor / totalMinor : 1;
  const level =
    cashShare < 0.05
      ? "LOCKED"
      : cashShare < 0.1
        ? "TIGHT"
        : cashShare < 0.25
          ? "CAUTION"
          : null;
  if (!level || assets.length === 0) return null;

  return {
    level,
    title:
      level === "LOCKED"
        ? t("recovery.tiedInGoods", undefined, lang)
        : level === "TIGHT"
          ? t("recovery.tightCash", undefined, lang)
          : t("recovery.openCash", undefined, lang),
    canQuickSell: assets.some((asset) =>
      ["IN_INVENTORY", "READY"].includes(asset.state),
    ),
    canRevise: activePlayerListings(state).length > 0,
  };
}
