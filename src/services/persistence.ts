import { openDB } from "idb";
import { migrateStateToCurrent } from "../domain/migrations";
import { advanceOffline } from "../domain/world";
import { initialState, validateState, type GameState } from "../game";
import { systemTimeProvider, type TimeProvider } from "../infrastructure/time";
const dbPromise = openDB("tradeup", 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains("game")) db.createObjectStore("game");
  },
});
export async function saveGame(
  state: GameState,
  timeProvider: TimeProvider = systemTimeProvider,
) {
  const db = await dbPromise;
  const validated = validateState(state);
  const lastWallClockMs = Math.max(
    validated.lastWallClockMs,
    timeProvider.nowWallMs(),
  );
  await db.put("game", { ...validated, lastWallClockMs }, "main");
}
export async function loadGame(
  timeProvider: TimeProvider = systemTimeProvider,
): Promise<GameState> {
  try {
    const db = await dbPromise;
    const raw = await db.get("game", "main");
    const wallClockMs = timeProvider.nowWallMs();
    if (!raw) return initialState(wallClockMs);
    if (raw.version !== 6) {
      await db.put("game", raw, `backup:pre-v6:${raw.version ?? "unknown"}`);
    }
    const migrated = validateState(migrateStateToCurrent(raw));
    const progressed = advanceOffline(migrated, wallClockMs).state;
    await db.put("game", validateState(progressed), "main");
    return progressed;
  } catch {
    return initialState(timeProvider.nowWallMs());
  }
}
export async function clearGame() {
  const db = await dbPromise;
  await db.delete("game", "main");
}
