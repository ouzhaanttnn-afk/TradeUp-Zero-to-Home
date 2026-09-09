import { GAME_CONFIG_VERSION } from "../domain/config";
import type { GameState } from "../domain/models";

const STORAGE_KEY = "tradeup:replay:v1";
const MAX_COMMANDS = 256;

export type ReplayCommandName =
  | "ADVANCE_OFFLINE"
  | "TICK"
  | "SCAN_MARKET"
  | "BUY_LISTING"
  | "BUY_HOME"
  | "MAKE_OFFER"
  | "QUICK_SALE"
  | "CREATE_LISTING"
  | "REVISE_LISTING"
  | "WITHDRAW_LISTING"
  | "ACCEPT_BUYER_OFFER"
  | "COUNTER_BUYER_OFFER"
  | "REJECT_BUYER_OFFER"
  | "INSPECT_LISTING"
  | "PREPARE_ASSET"
  | "CLAIM_REWARD";

export type ReplayValue = string | number | boolean | null;

export type ReplayCommand = {
  sequence: number;
  name: ReplayCommandName;
  atGameMin: number;
  payload: Record<string, ReplayValue>;
};

export type ReplayBundle = {
  schemaVersion: 1;
  configVersion: string;
  seed: number;
  startedAtGameMin: number;
  commands: ReplayCommand[];
};

export type ReplayStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const defaultStorage = (): ReplayStorage | undefined => {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
};

const isReplayBundle = (value: unknown): value is ReplayBundle => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ReplayBundle>;
  return (
    candidate.schemaVersion === 1 &&
    typeof candidate.configVersion === "string" &&
    typeof candidate.seed === "number" &&
    typeof candidate.startedAtGameMin === "number" &&
    Array.isArray(candidate.commands)
  );
};

export function readReplayBundle(
  storage: ReplayStorage | undefined = defaultStorage(),
): ReplayBundle | undefined {
  if (!storage) return undefined;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const parsed: unknown = JSON.parse(raw);
    return isReplayBundle(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

const orderedPayload = (payload: Record<string, ReplayValue>) =>
  Object.fromEntries(
    Object.entries(payload)
      .filter(([, value]) =>
        typeof value === "number" ? Number.isFinite(value) : true,
      )
      .sort(([left], [right]) => left.localeCompare(right)),
  );

export function recordReplayCommand(
  state: Pick<GameState, "seed" | "gameTimeMin">,
  name: ReplayCommandName,
  payload: Record<string, ReplayValue> = {},
  storage: ReplayStorage | undefined = defaultStorage(),
) {
  if (!storage) return;
  try {
    const existing = readReplayBundle(storage);
    const current =
      existing?.seed === state.seed &&
      existing.configVersion === GAME_CONFIG_VERSION
        ? existing
        : {
            schemaVersion: 1 as const,
            configVersion: GAME_CONFIG_VERSION,
            seed: state.seed,
            startedAtGameMin: state.gameTimeMin,
            commands: [],
          };
    const sequence = (current.commands.at(-1)?.sequence ?? 0) + 1;
    const command: ReplayCommand = {
      sequence,
      name,
      atGameMin: state.gameTimeMin,
      payload: orderedPayload(payload),
    };
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...current,
        commands: [...current.commands, command].slice(-MAX_COMMANDS),
      } satisfies ReplayBundle),
    );
  } catch {
    // Diagnostics must never delay or block a gameplay command.
  }
}

export function clearReplayDiagnostics(
  storage: ReplayStorage | undefined = defaultStorage(),
) {
  try {
    storage?.removeItem(STORAGE_KEY);
  } catch {
    // Restricted browser storage is a supported, non-blocking state.
  }
}

