import { openDB } from "idb";
import {
  applyOffline,
  initialState,
  SAVE_VERSION,
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
  await db.put("game", { ...state, lastSeenAt: Date.now() }, "main");
}
export async function loadGame(): Promise<GameState> {
  try {
    const db = await dbPromise;
    const raw = await db.get("game", "main");
    if (!raw) return initialState();
    const migrated = {
      ...raw,
      version: SAVE_VERSION,
      career: raw.career ?? [],
      expertise: raw.expertise ?? {},
      marketCycle: raw.marketCycle ?? 0,
    };
    return applyOffline(validateState(migrated));
  } catch {
    return initialState();
  }
}
export async function clearGame() {
  const db = await dbPromise;
  await db.delete("game", "main");
}
