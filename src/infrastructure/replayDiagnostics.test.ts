import { describe, expect, it } from "vitest";
import { GAME_CONFIG_VERSION } from "../domain/config";
import {
  clearReplayDiagnostics,
  readReplayBundle,
  recordReplayCommand,
  type ReplayStorage,
} from "./replayDiagnostics";

const memoryStorage = () => {
  const values = new Map<string, string>();
  const storage: ReplayStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
  return { storage, values };
};

describe("deterministic replay diagnostics", () => {
  it("records a versioned, ordered and non-personal command sequence", () => {
    const { storage } = memoryStorage();
    const state = { seed: 90_421, gameTimeMin: 12 };
    recordReplayCommand(
      state,
      "BUY_LISTING",
      { priceMinor: 42_000, listingId: "listing:1" },
      storage,
    );
    recordReplayCommand(
      { ...state, gameTimeMin: 13 },
      "PREPARE_ASSET",
      { kind: "CLEAN", assetId: "asset:1" },
      storage,
    );

    expect(readReplayBundle(storage)).toEqual({
      schemaVersion: 1,
      configVersion: GAME_CONFIG_VERSION,
      seed: 90_421,
      startedAtGameMin: 12,
      commands: [
        {
          sequence: 1,
          name: "BUY_LISTING",
          atGameMin: 12,
          payload: { listingId: "listing:1", priceMinor: 42_000 },
        },
        {
          sequence: 2,
          name: "PREPARE_ASSET",
          atGameMin: 13,
          payload: { assetId: "asset:1", kind: "CLEAN" },
        },
      ],
    });
  });

  it("keeps only the latest 256 commands without reusing sequence numbers", () => {
    const { storage } = memoryStorage();
    for (let index = 1; index <= 300; index += 1) {
      recordReplayCommand(
        { seed: 7, gameTimeMin: index },
        "TICK",
        {},
        storage,
      );
    }
    const commands = readReplayBundle(storage)?.commands ?? [];
    expect(commands).toHaveLength(256);
    expect(commands[0].sequence).toBe(45);
    expect(commands.at(-1)?.sequence).toBe(300);
  });

  it("starts a new bundle for a different seed and fails safely on storage errors", () => {
    const { storage } = memoryStorage();
    recordReplayCommand({ seed: 1, gameTimeMin: 2 }, "SCAN_MARKET", {}, storage);
    recordReplayCommand({ seed: 2, gameTimeMin: 8 }, "BUY_HOME", {}, storage);
    expect(readReplayBundle(storage)).toMatchObject({
      seed: 2,
      startedAtGameMin: 8,
      commands: [{ sequence: 1, name: "BUY_HOME" }],
    });

    const unavailable: ReplayStorage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    };
    expect(() =>
      recordReplayCommand({ seed: 3, gameTimeMin: 0 }, "TICK", {}, unavailable),
    ).not.toThrow();
    expect(readReplayBundle(unavailable)).toBeUndefined();
    expect(() => clearReplayDiagnostics(unavailable)).not.toThrow();
  });
});
