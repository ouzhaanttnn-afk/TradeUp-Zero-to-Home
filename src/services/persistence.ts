import { openDB } from "idb";
import { migrateStateToCurrent } from "../domain/migrations";
import { advanceOffline } from "../domain/world";
import {
  initialState,
  SAVE_VERSION,
  validateState,
  type GameState,
} from "../game";
import { systemTimeProvider, type TimeProvider } from "../infrastructure/time";

const PRIMARY_KEY = "main";
const LAST_GOOD_BACKUP_KEY = "backup:last-known-good";

export type PersistenceRecovery =
  | "NONE"
  | "RECOVERED_BACKUP"
  | "RESET_AFTER_CORRUPTION"
  | "STORAGE_UNAVAILABLE";

export type LoadedGame = {
  state: GameState;
  recovery: PersistenceRecovery;
};

type BackupWrite = { key: string; value: unknown };

export type PersistenceStorage = {
  read: (key: string) => Promise<unknown>;
  commit: (state: GameState, backup?: BackupWrite) => Promise<void>;
  delete: (key: string) => Promise<void>;
};

let dbPromise: ReturnType<typeof openDB> | undefined;

const gameDatabase = () => {
  dbPromise ??= openDB("tradeup", 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("game")) db.createObjectStore("game");
    },
  });
  return dbPromise;
};

const indexedDbStorage: PersistenceStorage = {
  read: async (key) => {
    const db = await gameDatabase();
    return db.get("game", key);
  },
  commit: async (state, backup) => {
    const db = await gameDatabase();
    const transaction = db.transaction("game", "readwrite");
    if (backup) await transaction.store.put(backup.value, backup.key);
    await transaction.store.put(state, PRIMARY_KEY);
    await transaction.done;
  },
  delete: async (key) => {
    const db = await gameDatabase();
    await db.delete("game", key);
  },
};

const migratedAndValidated = (raw: unknown) =>
  validateState(migrateStateToCurrent(raw));

const validBackup = (raw: unknown): BackupWrite | undefined => {
  if (raw === undefined) return undefined;
  try {
    migratedAndValidated(raw);
    return { key: LAST_GOOD_BACKUP_KEY, value: raw };
  } catch {
    return undefined;
  }
};

const advanceLoadedState = (state: GameState, wallClockMs: number): GameState =>
  validateState(advanceOffline(state, wallClockMs).state);

export async function saveGameToStorage(
  storage: PersistenceStorage,
  state: GameState,
  timeProvider: TimeProvider = systemTimeProvider,
) {
  const validated = validateState(state);
  const lastWallClockMs = Math.max(
    validated.lastWallClockMs,
    timeProvider.nowWallMs(),
  );
  const stamped = validateState({ ...validated, lastWallClockMs });
  const previous = await storage.read(PRIMARY_KEY);
  await storage.commit(stamped, validBackup(previous));
}

export async function loadGameFromStorage(
  storage: PersistenceStorage,
  timeProvider: TimeProvider = systemTimeProvider,
): Promise<LoadedGame> {
  const wallClockMs = timeProvider.nowWallMs();
  let raw: unknown;

  try {
    raw = await storage.read(PRIMARY_KEY);
  } catch {
    return {
      state: initialState(wallClockMs),
      recovery: "STORAGE_UNAVAILABLE",
    };
  }

  const primaryMissing = raw === undefined;
  if (primaryMissing) {
    try {
      raw = await storage.read(LAST_GOOD_BACKUP_KEY);
    } catch {
      return {
        state: initialState(wallClockMs),
        recovery: "STORAGE_UNAVAILABLE",
      };
    }
    if (raw === undefined)
      return { state: initialState(wallClockMs), recovery: "NONE" };
  }

  let state: GameState;
  let sourceVersion = "unknown";
  try {
    const migrated = migratedAndValidated(raw);
    state = advanceLoadedState(migrated, wallClockMs);
    sourceVersion =
      typeof raw === "object" && raw !== null && "version" in raw
        ? String(raw.version)
        : "unknown";
  } catch {
    let recovered: GameState;
    try {
      const backup = await storage.read(LAST_GOOD_BACKUP_KEY);
      recovered = advanceLoadedState(migratedAndValidated(backup), wallClockMs);
    } catch {
      const reset = initialState(wallClockMs);
      try {
        await storage.commit(reset, {
          key: `backup:corrupt:${wallClockMs}`,
          value: raw,
        });
      } catch {
        return { state: reset, recovery: "STORAGE_UNAVAILABLE" };
      }
      return { state: reset, recovery: "RESET_AFTER_CORRUPTION" };
    }

    try {
      await storage.commit(recovered, {
        key: `backup:corrupt:${wallClockMs}`,
        value: raw,
      });
    } catch {
      return { state: recovered, recovery: "STORAGE_UNAVAILABLE" };
    }
    return { state: recovered, recovery: "RECOVERED_BACKUP" };
  }

  try {
    const backup = {
      key:
        state.version === SAVE_VERSION && sourceVersion === String(SAVE_VERSION)
          ? LAST_GOOD_BACKUP_KEY
          : `backup:pre-v${SAVE_VERSION}:${sourceVersion}`,
      value: raw,
    };
    await storage.commit(state, backup);
  } catch {
    return { state, recovery: "STORAGE_UNAVAILABLE" };
  }
  return { state, recovery: primaryMissing ? "RECOVERED_BACKUP" : "NONE" };
}

export async function saveGame(
  state: GameState,
  timeProvider: TimeProvider = systemTimeProvider,
) {
  await saveGameToStorage(indexedDbStorage, state, timeProvider);
}

export async function loadGameWithStatus(
  timeProvider: TimeProvider = systemTimeProvider,
): Promise<LoadedGame> {
  return loadGameFromStorage(indexedDbStorage, timeProvider);
}

export async function loadGame(
  timeProvider: TimeProvider = systemTimeProvider,
): Promise<GameState> {
  return (await loadGameWithStatus(timeProvider)).state;
}

export async function clearGame() {
  await Promise.all([
    indexedDbStorage.delete(PRIMARY_KEY),
    indexedDbStorage.delete(LAST_GOOD_BACKUP_KEY),
  ]);
}
