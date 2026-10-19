import { describe, expect, it, vi } from "vitest";
import { initialState } from "../game";
import { LEADERBOARDS, leaderboardScores } from "./leaderboards";
import { submitCareerScores } from "../infrastructure/gameCenter";
import {
  netWorthMinor,
  purchaseListing,
  settleAssetSale,
  purchaseHome,
} from "./economy";
import type { GameState } from "./models";

function recordedTrade(state: GameState, index: number, proceeds = 40_000) {
  const template = initialState(1, "SANDBOX").listings[0];
  const listing = {
    ...template,
    id: `gc-listing:${index}`,
    state: "ACTIVE" as const,
  };
  const buy = purchaseListing(
    { ...state, listings: [listing, ...state.listings] },
    listing,
    10_000,
    index,
  );
  if (!buy.ok) throw new Error(buy.reason);
  const sale = settleAssetSale(
    buy.state,
    buy.state.ownedAssets.at(-1)!.id,
    proceeds,
    `gc-sale:${index}`,
    index,
  );
  if (!sale.ok) throw new Error(sale.reason);
  return sale.state;
}

function fundedCareer() {
  const state = initialState(1);
  const sale = settleAssetSale(
    state,
    state.ownedAssets[0].id,
    42_000,
    "gc-gift",
    0,
  );
  if (!sale.ok) throw new Error(sale.reason);
  return sale.state;
}

describe("Game Center score safety", () => {
  it("does not submit sandbox or an unreconciled state", () => {
    expect(leaderboardScores(initialState(1, "SANDBOX"))).toEqual([]);
    const state = initialState(1);
    state.cashMinor = 999;
    expect(leaderboardScores(state)).toEqual([]);
  });
  it("ignores asking prices and never uploads profile data", () => {
    const state = initialState(1);
    state.profile.displayName = "PRIVATE";
    const scores = leaderboardScores(state);
    expect(scores).toEqual([
      { leaderboardId: LEADERBOARDS.wealth, value: netWorthMinor(state) },
    ]);
    expect(JSON.stringify(scores)).not.toContain("PRIVATE");
  });
  it("freezes profit at exactly 100 completed market trades and excludes the gift", () => {
    let state = fundedCareer();
    for (let count = 1; count <= 99; count++)
      state = recordedTrade(state, count);
    expect(
      leaderboardScores(state).some(
        (score) => score.leaderboardId === LEADERBOARDS.profit100,
      ),
    ).toBe(false);
    state = recordedTrade(state, 100, 5_000);
    const expected = 99 * 30_000 - 5_000;
    expect(leaderboardScores(state)).toContainEqual({
      leaderboardId: LEADERBOARDS.profit100,
      value: expected,
    });
    state = recordedTrade(state, 101, 100_000);
    expect(leaderboardScores(state)).toContainEqual({
      leaderboardId: LEADERBOARDS.profit100,
      value: expected,
    });
  });
  it("counts only the currently owned home, not past homes or asking prices", () => {
    let state = recordedTrade(fundedCareer(), 1, 900_000_000);
    state.gameTimeMin = 500;
    state.home = { ...state.home, unlocked: true, searchStartedAtGameMin: 0 };
    const buy = purchaseHome(state, "garden_edge", "gc-home", 500);
    if (!buy.ok) throw new Error(buy.reason);
    state = buy.state;
    expect(leaderboardScores(state)).toContainEqual({
      leaderboardId: LEADERBOARDS.wealth,
      value: state.cashMinor + 375_000_000,
    });
    expect(leaderboardScores(state)).toContainEqual({
      leaderboardId: LEADERBOARDS.homebudget,
      value: 1,
    });
    const upgrade = purchaseHome(state, "city_residence", "gc-upgrade", 500);
    if (!upgrade.ok) throw new Error(upgrade.reason);
    expect(leaderboardScores(upgrade.state)).toContainEqual({
      leaderboardId: LEADERBOARDS.wealth,
      value: upgrade.state.cashMinor + 415_000_000,
    });
    const broken = structuredClone(upgrade.state);
    broken.transactionJournal = broken.transactionJournal.filter(
      (entry) => entry.id !== "gc-sale:1",
    );
    expect(leaderboardScores(broken)).toEqual([]);
  });
  it("accepts a signed profit but rejects unknown boards and unsafe scores", async () => {
    const port = {
      authenticate: vi.fn(),
      load: vi.fn(),
      submit: vi.fn().mockResolvedValue(undefined),
    };
    await submitCareerScores(
      [{ leaderboardId: LEADERBOARDS.profit100, value: -1234 }],
      "player",
      port,
    );
    expect(port.submit).toHaveBeenCalledWith({
      leaderboardId: LEADERBOARDS.profit100,
      score: "-1234",
      playerId: "player",
    });
    await expect(
      submitCareerScores(
        [{ leaderboardId: "other.game", value: 1 }],
        "player",
        port,
      ),
    ).rejects.toThrow();
    await expect(
      submitCareerScores(
        [{ leaderboardId: LEADERBOARDS.wealth, value: 2 ** 53 }],
        "player",
        port,
      ),
    ).rejects.toThrow();
  });
  it("does not report partial native submission failure as success", async () => {
    const port = {
      authenticate: vi.fn(),
      load: vi.fn(),
      submit: vi.fn().mockRejectedValue(new Error("offline")),
    };
    await expect(
      submitCareerScores(
        [{ leaderboardId: LEADERBOARDS.wealth, value: 0 }],
        "player",
        port,
      ),
    ).rejects.toThrow("offline");
  });
});
