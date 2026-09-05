import { instanceEstimateBand } from "../domain/decision";
import { activeBookCostMinor, activeOwnedAssets } from "../domain/economy";
import { categoryExpertiseLevel } from "../domain/meta";
import type { GameState } from "../domain/models";
import { money, signedMoney } from "../game";

export function wealthPresentation(state: GameState) {
  const assets = activeOwnedAssets(state);
  const portfolio = assets.reduce(
    (sum, asset) => {
      const band = instanceEstimateBand(
        asset.instance,
        categoryExpertiseLevel(state, asset.instance.family.category),
      );
      return {
        lowMinor: sum.lowMinor + band.lowMinor,
        highMinor: sum.highMinor + band.highMinor,
      };
    },
    { lowMinor: 0, highMinor: 0 },
  );
  const total = {
    lowMinor: state.cashMinor + portfolio.lowMinor,
    highMinor: state.cashMinor + portfolio.highMinor,
  };
  const cost = activeBookCostMinor(state);
  const difference = {
    lowMinor: portfolio.lowMinor - cost,
    highMinor: portfolio.highMinor - cost,
  };
  const share = (value: number) =>
    value ? Math.round((state.cashMinor / value) * 100) : 0;
  return {
    portfolio,
    total,
    difference,
    cashShare: { low: share(total.highMinor), high: share(total.lowMinor) },
  };
}

export function formatEstimate(
  band: { lowMinor: number; highMinor: number },
  signed = false,
) {
  const format = signed ? signedMoney : money;
  return band.lowMinor === band.highMinor
    ? format(band.lowMinor)
    : `${format(band.lowMinor)}–${format(band.highMinor)}`;
}
