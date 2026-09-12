import { describe, expect, it } from "vitest";
import {
  availableHomeOptions,
  HOME_OPTIONS,
  nextHomeResult,
} from "../content/homes";
import { HOME_GOAL_MINOR, initialState } from "../game";
import { purchaseHome, reconcileJournal } from "./economy";
import { advanceWorldTo } from "./world";

describe("home search market", () => {
  it("starts only at the goal and reveals five homes over deterministic game time", () => {
    const below = initialState(0, "SANDBOX");
    below.home = { ...below.home, unlocked: true };
    below.cashMinor = HOME_GOAL_MINOR - 1;
    const unchanged = advanceWorldTo(below, 1).state;
    expect(unchanged.home.searchStartedAtGameMin).toBeUndefined();

    const reached = { ...below, cashMinor: HOME_GOAL_MINOR };
    reached.transactionJournal[0] = {
      ...reached.transactionJournal[0],
      cashDeltaMinor: HOME_GOAL_MINOR,
    };
    const started = advanceWorldTo(reached, 1).state;
    expect(started.home.searchStartedAtGameMin).toBe(1);
    expect(availableHomeOptions(started.home, 180)).toHaveLength(0);
    expect(availableHomeOptions(started.home, 181)).toHaveLength(2);
    expect(nextHomeResult(started.home, 181)?.id).toBe("terrace_duplex");
    expect(availableHomeOptions(started.home, 451)).toHaveLength(5);
  });

  it("rejects unrevealed property and purchases the chosen listing atomically", () => {
    const state = initialState(0, "SANDBOX");
    state.cashMinor = HOME_OPTIONS.at(-1)?.priceMinor ?? HOME_GOAL_MINOR;
    state.transactionJournal[0] = {
      ...state.transactionJournal[0],
      cashDeltaMinor: state.cashMinor,
    };
    state.home = {
      ...state.home,
      unlocked: true,
      searchStartedAtGameMin: 10,
    };

    const early = purchaseHome(
      state,
      "coastal_villa",
      "home-purchase:early",
      200,
    );
    expect(early).toMatchObject({ ok: false, reason: "HOME_NOT_AVAILABLE" });

    const bought = purchaseHome(
      state,
      "coastal_villa",
      "home-purchase:villa",
      500,
    );
    if (!bought.ok) throw new Error(bought.reason);
    expect(bought.state.home).toMatchObject({
      purchased: true,
      purchasedHomeId: "coastal_villa",
    });
    expect(bought.state.cashMinor).toBe(0);
    expect(reconcileJournal(bought.state)).toEqual({
      cash: true,
      activeBookCost: true,
      realizedProfit: true,
    });
  });
});
