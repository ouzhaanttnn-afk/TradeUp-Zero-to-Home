import type { GameState } from "../domain/models";

export function latestSaleResult(state: GameState) {
  const entry = state.transactionJournal
    .toReversed()
    .find((item) => item.kind === "SALE" && item.assetId);
  if (!entry?.assetId) return null;
  const asset = state.ownedAssets.find((item) => item.id === entry.assetId);
  if (!asset) return null;
  return {
    transactionId: entry.id,
    assetName: asset.instance.family.name,
    proceedsMinor: entry.cashDeltaMinor,
    bookCostMinor: -entry.costBasisDeltaMinor,
    profitMinor: entry.realizedProfitDeltaMinor,
  };
}
