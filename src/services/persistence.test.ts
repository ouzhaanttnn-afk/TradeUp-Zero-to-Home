import { describe, expect, it } from "vitest";
import { reconcileJournal } from "../domain/economy";
import { initialState, type GameState } from "../game";
import {
  loadGameFromStorage,
  saveGameToStorage,
  type PersistenceStorage,
} from "./persistence";

const MAIN_KEY = "main";
const BACKUP_KEY = "backup:last-known-good";

function memoryStorage(
  entries: Record<string, unknown> = {},
  options: { failRead?: boolean; failCommit?: boolean } = {},
) {
  const values = new Map(Object.entries(entries));
  const commits: { state: GameState; backupKey?: string }[] = [];
  const storage: PersistenceStorage = {
    read: async (key) => {
      if (options.failRead) throw new Error("storage unavailable");
      return values.get(key);
    },
    commit: async (state, backup) => {
      if (options.failCommit) throw new Error("commit failed");
      if (backup) values.set(backup.key, backup.value);
      values.set(MAIN_KEY, state);
      commits.push({ state, backupKey: backup?.key });
    },
    delete: async (key) => {
      values.delete(key);
    },
  };
  return { storage, values, commits };
}

describe("persistence resilience", () => {
  it("restores an intact backup when the primary key is missing", async () => {
    const backup = initialState(1_000, "SANDBOX");
    backup.accessibility.largeText = true;
    const memory = memoryStorage({ [BACKUP_KEY]: backup });
    const result = await loadGameFromStorage(memory.storage, {
      nowWallMs: () => 1_000,
    });
    expect(result.recovery).toBe("RECOVERED_BACKUP");
    expect(result.state.accessibility.largeText).toBe(true);
    expect(result.state.transactionJournal).toEqual(backup.transactionJournal);
    expect(memory.values.get(MAIN_KEY)).toEqual(result.state);
    expect(reconcileJournal(result.state)).toEqual({
      cash: true,
      activeBookCost: true,
      realizedProfit: true,
    });
  });

  it("starts normally only when neither a primary nor backup exists", async () => {
    const memory = memoryStorage();
    const result = await loadGameFromStorage(memory.storage, {
      nowWallMs: () => 1_000,
    });
    expect(result.recovery).toBe("NONE");
    expect(memory.commits).toHaveLength(0);
  });

  it("reports a failed backup lookup instead of treating it as a new career", async () => {
    const memory = memoryStorage();
    memory.storage.read = async (key) => {
      if (key === BACKUP_KEY) throw new Error("temporarily unavailable");
      return undefined;
    };
    const result = await loadGameFromStorage(memory.storage, {
      nowWallMs: () => 1_000,
    });
    expect(result.recovery).toBe("STORAGE_UNAVAILABLE");
    expect(memory.commits).toHaveLength(0);
  });

  it("atomically keeps the previous valid state as the last-known-good backup", async () => {
    const previous = initialState(1_000, "SANDBOX");
    const next = { ...previous, seed: previous.seed + 1 };
    const memory = memoryStorage({ [MAIN_KEY]: previous });

    await saveGameToStorage(memory.storage, next, { nowWallMs: () => 2_000 });

    expect(memory.commits).toHaveLength(1);
    expect(memory.commits[0].backupKey).toBe(BACKUP_KEY);
    expect(memory.values.get(BACKUP_KEY)).toEqual(previous);
    expect(memory.values.get(MAIN_KEY)).toMatchObject({
      seed: next.seed,
      lastWallClockMs: 2_000,
    });
  });

  it("recovers a corrupt primary save from the complete backup", async () => {
    const backup = initialState(1_000);
    backup.negotiation = {
      listingId: "listing:negotiation",
      offersRemaining: 2,
      sellerFloorMinor: 1,
      closed: false,
    };
    backup.career.push({
      id: "career:test",
      type: "LEGACY",
      group: "MILESTONES",
      atGameMin: 0,
      label: "Korunacak kariyer kaydı",
    });
    const memory = memoryStorage({
      [MAIN_KEY]: { version: 8, cashMinor: -1 },
      [BACKUP_KEY]: backup,
    });

    const result = await loadGameFromStorage(memory.storage, {
      nowWallMs: () => 1_000,
    });

    expect(result.recovery).toBe("RECOVERED_BACKUP");
    expect(result.state).toMatchObject({
      cashMinor: backup.cashMinor,
      realizedProfitMinor: backup.realizedProfitMinor,
      negotiation: backup.negotiation,
      career: backup.career,
    });
    expect(result.state.ownedAssets.map((item) => item.id)).toEqual(
      backup.ownedAssets.map((item) => item.id),
    );
    expect(result.state.playerListings.map((item) => item.id)).toEqual(
      backup.playerListings.map((item) => item.id),
    );
    expect(result.state.buyerOffers.map((item) => item.id)).toEqual(
      backup.buyerOffers.map((item) => item.id),
    );
    expect(result.state.transactionJournal).toEqual(backup.transactionJournal);
    expect(memory.values.get(MAIN_KEY)).toEqual(result.state);
    expect(memory.values.get("backup:corrupt:1000")).toEqual({
      version: 8,
      cashMinor: -1,
    });
    expect(reconcileJournal(result.state)).toEqual({
      cash: true,
      activeBookCost: true,
      realizedProfit: true,
    });
  });

  it("preserves the corrupt payload before creating a clean recoverable state", async () => {
    const corrupt = { version: 8, cashMinor: -1, marker: "keep-me" };
    const memory = memoryStorage({
      [MAIN_KEY]: corrupt,
      [BACKUP_KEY]: { version: 8, cashMinor: -2 },
    });

    const result = await loadGameFromStorage(memory.storage, {
      nowWallMs: () => 2_000,
    });

    expect(result.recovery).toBe("RESET_AFTER_CORRUPTION");
    expect(memory.values.get("backup:corrupt:2000")).toEqual(corrupt);
    expect(memory.values.get(MAIN_KEY)).toEqual(result.state);
    expect(reconcileJournal(result.state)).toEqual({
      cash: true,
      activeBookCost: true,
      realizedProfit: true,
    });
  });

  it("reports unavailable storage without pretending the session was saved", async () => {
    const memory = memoryStorage({}, { failRead: true });

    const result = await loadGameFromStorage(memory.storage, {
      nowWallMs: () => 3_000,
    });

    expect(result.recovery).toBe("STORAGE_UNAVAILABLE");
    expect(memory.commits).toHaveLength(0);
    expect(result.state.lastWallClockMs).toBe(3_000);
  });

  it("keeps a valid loaded state when the refresh commit cannot finish", async () => {
    const primary = initialState(4_000, "SANDBOX");
    const memory = memoryStorage({ [MAIN_KEY]: primary }, { failCommit: true });

    const result = await loadGameFromStorage(memory.storage, {
      nowWallMs: () => 4_000,
    });

    expect(result.recovery).toBe("STORAGE_UNAVAILABLE");
    expect(result.state.cashMinor).toBe(primary.cashMinor);
    expect(result.state.transactionJournal).toEqual(primary.transactionJournal);
    expect(memory.values.get(MAIN_KEY)).toBe(primary);
  });
});
