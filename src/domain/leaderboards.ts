import { homeOptionById } from "../content/homes";
import { careerRecords } from "./careerRecords";
import { netWorthMinor, reconcileJournal } from "./economy";
import type { GameState } from "./models";

export const LEADERBOARDS = {
  wealth: "tradeup.wealth.v1",
  profit100: "tradeup.profit100.v1",
  homebudget: "tradeup.homebudget.v1",
} as const;
export type LeaderboardKind = keyof typeof LEADERBOARDS;
export type CareerScore = { leaderboardId: string; value: number };

/** Local integrity checks, NOT a server verifier or anti-cheat guarantee. */
export function leaderboardScores(state: GameState): CareerScore[] {
  const opening = state.transactionJournal[0];
  if (
    opening?.kind !== "OPENING_BALANCE" ||
    opening.cashDeltaMinor !== 0 ||
    opening.metadata.reason === "test-sandbox" ||
    !Object.values(reconcileJournal(state)).every(Boolean) ||
    state.cashMinor < 0 ||
    !state.transactionJournal.every((entry) =>
      [
        entry.cashDeltaMinor,
        entry.costBasisDeltaMinor,
        entry.realizedProfitDeltaMinor,
      ].every(Number.isSafeInteger),
    )
  )
    return [];
  const records = careerRecords(state);
  if (!records.complete) return [];
  const currentHome = state.home.purchased
    ? homeOptionById(state.home.purchasedHomeId)
    : undefined;
  const wealth = netWorthMinor(state) + (currentHome?.priceMinor ?? 0);
  const scores: CareerScore[] = [];
  if (Number.isSafeInteger(wealth) && wealth >= 0)
    scores.push({ leaderboardId: LEADERBOARDS.wealth, value: wealth });
  if (Number.isSafeInteger(records.profitAt100Minor))
    scores.push({
      leaderboardId: LEADERBOARDS.profit100,
      value: records.profitAt100Minor!,
    });
  if (
    Number.isSafeInteger(records.firstHomeBudgetTradeCount) &&
    records.firstHomeBudgetTradeCount! > 0
  )
    scores.push({
      leaderboardId: LEADERBOARDS.homebudget,
      value: records.firstHomeBudgetTradeCount!,
    });
  return scores;
}
