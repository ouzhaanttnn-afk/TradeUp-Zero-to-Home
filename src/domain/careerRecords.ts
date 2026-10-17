import { FTUE_STARTING_ASSET_ID } from "./config";
import type { FirstHomeSummary, GameState, MarketSaleMemory } from "./models";

export const FIRST_HOME_BUDGET_MINOR = 375_000_000;
export const PROFIT_RECORD_TRADE_COUNT = 100;

/** Journal order, not mutable career labels, defines historical achievements. */
export function careerRecords(
  state: Pick<GameState, "ownedAssets" | "transactionJournal">,
  throughIndex = state.transactionJournal.length - 1,
) {
  const assets = new Map(state.ownedAssets.map((asset) => [asset.id, asset]));
  const purchased = new Map<string, number>();
  const sold = new Set<string>();
  const categories = new Map<string, number>();
  const sales: MarketSaleMemory[] = [];
  const recordedSales = new Set(
    state.transactionJournal
      .filter((entry) => entry.kind === "SALE")
      .map((entry) => entry.assetId),
  );
  // A closed asset without any sale evidence cannot be silently counted as a
  // genuine zero-trade career, including when reconstructing a legacy home.
  let complete = state.ownedAssets.every(
    (asset) =>
      asset.id === FTUE_STARTING_ASSET_ID ||
      asset.state !== "SOLD_COMPLETE" ||
      recordedSales.has(asset.id),
  );
  let cashMinor = 0;
  let marketProfitMinor = 0;
  let firstHomeBudgetTradeCount: number | undefined;
  let profitAt100Minor: number | undefined;
  let firstProfitableSale: MarketSaleMemory | undefined;
  let bestSale: MarketSaleMemory | undefined;

  for (const [index, entry] of state.transactionJournal.entries()) {
    if (index > throughIndex) break;
    cashMinor += entry.cashDeltaMinor;
    if (entry.kind === "PURCHASE" && entry.assetId)
      purchased.set(entry.assetId, -entry.cashDeltaMinor);
    if (entry.kind === "SALE" && entry.assetId !== FTUE_STARTING_ASSET_ID) {
      const asset = entry.assetId ? assets.get(entry.assetId) : undefined;
      const price = entry.assetId ? purchased.get(entry.assetId) : undefined;
      if (
        !asset ||
        asset.state !== "SOLD_COMPLETE" ||
        price === undefined ||
        sold.has(asset.id)
      ) {
        complete = false;
      } else {
        sold.add(asset.id);
        const sale: MarketSaleMemory = {
          transactionId: entry.id,
          assetId: asset.id,
          familyId: asset.familyId,
          assetKey: asset.instance.family.assetKey,
          categoryId: asset.instance.family.category,
          purchasePriceMinor: price,
          salePriceMinor: entry.cashDeltaMinor,
          bookCostMinor: entry.cashDeltaMinor - entry.realizedProfitDeltaMinor,
          profitMinor: entry.realizedProfitDeltaMinor,
          atGameMin: entry.gameTime,
        };
        sales.push(sale);
        marketProfitMinor += sale.profitMinor;
        categories.set(
          sale.categoryId,
          (categories.get(sale.categoryId) ?? 0) + sale.profitMinor,
        );
        if (sale.profitMinor > 0) {
          firstProfitableSale ??= sale;
          if (!bestSale || sale.profitMinor > bestSale.profitMinor)
            bestSale = sale;
        }
        if (sales.length === PROFIT_RECORD_TRADE_COUNT)
          profitAt100Minor = marketProfitMinor;
      }
    }
    if (
      firstHomeBudgetTradeCount === undefined &&
      cashMinor >= FIRST_HOME_BUDGET_MINOR
    )
      firstHomeBudgetTradeCount = sales.length;
  }
  const dominantCategoryId = [...categories]
    .filter(([, profit]) => profit > 0)
    .sort(
      ([leftId, leftProfit], [rightId, rightProfit]) =>
        rightProfit - leftProfit ||
        (leftId < rightId ? -1 : leftId > rightId ? 1 : 0),
    )[0]?.[0];
  return {
    sales,
    marketTradeCount: sales.length,
    marketProfitMinor,
    firstProfitableSale,
    bestSale,
    dominantCategoryId,
    firstHomeBudgetTradeCount: complete ? firstHomeBudgetTradeCount : undefined,
    profitAt100Minor: complete ? profitAt100Minor : undefined,
    complete,
  };
}

export function createFirstHomeSummary(
  state: GameState,
  origin: FirstHomeSummary["origin"],
): FirstHomeSummary | undefined {
  if (state.firstHomeSummary) return state.firstHomeSummary;
  const index = state.transactionJournal.findIndex(
    (entry) => entry.kind === "HOME_PURCHASE",
  );
  if (index < 0) {
    return state.home.purchased
      ? {
          summaryVersion: 1,
          careerId: state.careerId,
          completeness: "PARTIAL",
          origin,
        }
      : undefined;
  }
  const entry = state.transactionJournal[index];
  const records = careerRecords(state, index);
  const homeId =
    typeof entry.metadata.homeId === "string"
      ? entry.metadata.homeId
      : undefined;
  return {
    summaryVersion: 1,
    careerId: state.careerId,
    sourceTransactionId: entry.id,
    homeId,
    homePriceMinor:
      entry.cashDeltaMinor < 0 ? -entry.cashDeltaMinor : undefined,
    atGameMin: entry.gameTime,
    marketTradeCount: records.marketTradeCount,
    marketProfitMinor: records.marketProfitMinor,
    firstProfitableSale: records.firstProfitableSale,
    bestSale: records.bestSale,
    dominantCategoryId: records.dominantCategoryId,
    completeness:
      records.complete && homeId !== undefined && entry.cashDeltaMinor < 0
        ? "COMPLETE"
        : "PARTIAL",
    origin,
  };
}
