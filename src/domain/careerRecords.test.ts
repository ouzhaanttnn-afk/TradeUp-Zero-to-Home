import { describe, expect, it } from "vitest";
import { initialState, validateState } from "../game";
import { HOME_OPTIONS } from "../content/homes";
import { careerRecords } from "./careerRecords";
import {
  addAssetCost,
  purchaseHome,
  purchaseListing,
  reconcileJournal,
  settleAssetSale,
} from "./economy";
import { migrateStateToCurrent } from "./migrations";
import type { GameState } from "./models";

function fundedState() {
  const state = initialState(1_000, "SANDBOX");
  state.cashMinor = 2_000_000_000;
  state.transactionJournal[0].cashDeltaMinor = state.cashMinor;
  state.home = {
    unlocked: true,
    purchased: false,
    searchStartedAtGameMin: 0,
    progressMilestones: [],
  };
  state.gameTimeMin = 500;
  return state;
}

function trade(state: GameState, index: number, proceeds = 30_000, cost = 0) {
  const listing = {
    ...state.listings[0],
    id: `memory:${index}`,
    state: "ACTIVE" as const,
  };
  const buy = purchaseListing(
    { ...state, listings: [listing, ...state.listings] },
    listing,
    20_000,
    index,
  );
  if (!buy.ok) throw new Error(buy.reason);
  let next = buy.state;
  const asset = next.ownedAssets.at(-1)!;
  if (cost) {
    const preparation = addAssetCost(
      next,
      asset.id,
      "INSPECTION",
      cost,
      `inspection:${index}`,
      index,
    );
    if (!preparation.ok) throw new Error(preparation.reason);
    next = preparation.state;
  }
  const sale = settleAssetSale(
    next,
    asset.id,
    proceeds,
    `memory-sale:${index}`,
    index,
  );
  if (!sale.ok) throw new Error(sale.reason);
  return sale.state;
}

describe("immutable first home and canonical career records", () => {
  it("excludes the gifted notebook, counts losses and includes all book costs", () => {
    let state = trade(fundedState(), 1, 30_000, 1_500);
    state = trade(state, 2, 10_000);
    state.transactionJournal.push({
      id: "gift-sale",
      kind: "SALE",
      gameTime: 2,
      assetId: "asset:ftue-starting-notebook",
      cashDeltaMinor: 42_000,
      realizedProfitDeltaMinor: 42_000,
      costBasisDeltaMinor: 0,
      metadata: {},
    });
    const records = careerRecords(state);
    expect(records.marketTradeCount).toBe(2);
    expect(records.marketProfitMinor).toBe(-1_500);
    expect(records.bestSale).toMatchObject({
      profitMinor: 8_500,
      bookCostMinor: 21_500,
    });
    expect(records.firstProfitableSale?.transactionId).toBe("memory-sale:1");
  });

  it("freezes the 100th result even if the 101st is more profitable", () => {
    let state = fundedState();
    for (let index = 1; index <= 99; index++) state = trade(state, index);
    expect(careerRecords(state).profitAt100Minor).toBeUndefined();
    state = trade(state, 100, 10_000);
    expect(careerRecords(state).profitAt100Minor).toBe(980_000);
    state = trade(state, 101, 900_000);
    expect(careerRecords(state).profitAt100Minor).toBe(980_000);
    expect(careerRecords(state).marketTradeCount).toBe(101);
  });

  it("captures the first home atomically and never overwrites it on upgrades or duplicate transactions", () => {
    const before = trade(fundedState(), 1);
    const home = purchaseHome(before, HOME_OPTIONS[0].id, "home:first", 500);
    if (!home.ok) throw new Error(home.reason);
    const memory = home.state.firstHomeSummary;
    expect(memory).toMatchObject({
      summaryVersion: 1,
      origin: "LIVE",
      completeness: "COMPLETE",
      careerId: before.careerId,
      homeId: HOME_OPTIONS[0].id,
      marketTradeCount: 1,
      marketProfitMinor: 10_000,
    });
    const later = trade(home.state, 2, 250_000);
    const upgrade = purchaseHome(
      later,
      HOME_OPTIONS[1].id,
      "home:upgrade",
      501,
    );
    if (!upgrade.ok) throw new Error(upgrade.reason);
    expect(upgrade.state.firstHomeSummary).toBe(memory);
    const duplicate = purchaseHome(
      upgrade.state,
      HOME_OPTIONS[0].id,
      "home:first",
      502,
    );
    expect(duplicate.ok && duplicate.idempotent).toBe(true);
    expect(duplicate.state.firstHomeSummary).toBe(memory);
    expect(
      validateState(JSON.parse(JSON.stringify(upgrade.state))).firstHomeSummary,
    ).toEqual(memory);
    expect(reconcileJournal(upgrade.state)).toEqual({
      cash: true,
      activeBookCost: true,
      realizedProfit: true,
    });
    expect(before.firstHomeSummary).toBeUndefined();
    expect(() =>
      validateState({ ...home.state, careerId: "wrong-career" }),
    ).toThrow();
  });

  it("reconstructs v21 only through the earliest home purchase, without changing cash or entitlements", () => {
    let state = trade(fundedState(), 1);
    const home = purchaseHome(state, HOME_OPTIONS[0].id, "home:legacy", 500);
    if (!home.ok) throw new Error(home.reason);
    state = trade(home.state, 2, 600_000);
    const legacy = {
      ...state,
      version: 21,
      careerId: undefined,
      firstHomeSummary: undefined,
    };
    const migrated = validateState(migrateStateToCurrent(legacy));
    expect(migrated.firstHomeSummary).toMatchObject({
      origin: "RECONSTRUCTED",
      marketTradeCount: 1,
      marketProfitMinor: 10_000,
    });
    expect(migrated.cashMinor).toBe(state.cashMinor);
    expect(migrated.transactionJournal).toEqual(state.transactionJournal);
    expect(migrated.monetization).toEqual(state.monetization);
    expect(migrateStateToCurrent(migrated)).toBe(migrated);
  });

  it("marks missing historical evidence partial rather than inventing the first home's figures", () => {
    const state = fundedState();
    state.home = {
      ...state.home,
      purchased: true,
      purchasedHomeId: HOME_OPTIONS[2].id,
    };
    const migrated = validateState(
      migrateStateToCurrent({ ...state, version: 21 }),
    );
    expect(migrated.firstHomeSummary).toMatchObject({
      completeness: "PARTIAL",
      origin: "RECONSTRUCTED",
    });
    expect(migrated.firstHomeSummary?.marketTradeCount).toBeUndefined();
    expect(migrated.firstHomeSummary?.homeId).toBeUndefined();
    const broken = trade(fundedState(), 1);
    broken.ownedAssets = [];
    expect(careerRecords(broken).complete).toBe(false);
    expect(careerRecords(broken).profitAt100Minor).toBeUndefined();
  });

  it("preserves a negative 100-trade result and the earlier record when profits tie", () => {
    let state = fundedState();
    for (let index = 1; index <= 100; index++)
      state = trade(state, index, 10_000);
    expect(careerRecords(state).profitAt100Minor).toBe(-1_000_000);
    expect(careerRecords(state).bestSale).toBeUndefined();
    state = trade(state, 101);
    state = trade(state, 102);
    expect(careerRecords(state).bestSale?.transactionId).toBe(
      "memory-sale:101",
    );
  });

  it("does not treat a missing sale journal as an exact zero-trade legacy career", () => {
    const state = trade(fundedState(), 1);
    state.transactionJournal = state.transactionJournal.filter(
      (entry) => entry.kind !== "SALE",
    );
    const records = careerRecords(state);
    expect(records.complete).toBe(false);
    expect(records.firstHomeBudgetTradeCount).toBeUndefined();
    const home = purchaseHome(
      state,
      HOME_OPTIONS[0].id,
      "home:missing-sale",
      500,
    );
    expect(home.ok && home.state.firstHomeSummary?.completeness).toBe(
      "PARTIAL",
    );
  });

  it("records the cash budget crossing once and does not use unsold item estimates", () => {
    let state = initialState(0, "SANDBOX");
    state = trade(state, 1, 375_000_000);
    expect(careerRecords(state).firstHomeBudgetTradeCount).toBe(1);
    state = trade(state, 2, 2_000);
    expect(careerRecords(state).firstHomeBudgetTradeCount).toBe(1);
    const original = initialState(0, "SANDBOX");
    const buy = purchaseListing(original, original.listings[0], 1_000, 0);
    if (!buy.ok) throw new Error(buy.reason);
    buy.state.ownedAssets[0].instance.fairValueMinor = 900_000_000;
    expect(careerRecords(buy.state).firstHomeBudgetTradeCount).toBeUndefined();
  });
});
