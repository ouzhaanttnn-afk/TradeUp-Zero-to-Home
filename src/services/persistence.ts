import { openDB } from "idb";
import { migrateStateToV3 } from "../domain/migrations";
import {
  applyOffline,
  initialState,
  validateState,
  type GameState,
} from "../game";
const dbPromise = openDB("tradeup", 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains("game")) db.createObjectStore("game");
  },
});
export async function saveGame(state: GameState) {
  const db = await dbPromise;
  const validated = validateState(state);
  await db.put("game", { ...validated, lastSeenAt: Date.now() }, "main");
}
export async function loadGame(): Promise<GameState> {
  try {
    const db = await dbPromise;
    const raw = await db.get("game", "main");
    if (!raw) return initialState();
    const migrated = migrateStateToV3(raw);
    return applyOffline(validateState(migrated));
  } catch {
    return initialState();
  }
}
export async function clearGame() {
  const db = await dbPromise;
  await db.delete("game", "main");
}
