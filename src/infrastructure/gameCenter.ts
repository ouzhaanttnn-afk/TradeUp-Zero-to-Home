import { Capacitor, registerPlugin } from "@capacitor/core";
import {
  LEADERBOARDS,
  type CareerScore,
  type LeaderboardKind,
} from "../domain/leaderboards";

export type GameCenterIdentity = { playerId: string; alias: string };
export type LeaderboardEntry = {
  rank: number;
  alias: string;
  score: string;
  isLocal: boolean;
};
export type GameCenterBoard = {
  entries: LeaderboardEntry[];
  local?: LeaderboardEntry;
  total: number;
};
export interface GameCenterPort {
  authenticate(): Promise<GameCenterIdentity>;
  load(options: {
    leaderboardId: string;
    playerId: string;
  }): Promise<GameCenterBoard>;
  submit(options: {
    leaderboardId: string;
    score: string;
    playerId: string;
  }): Promise<void>;
}
const native = registerPlugin<GameCenterPort>("TradeUpGameCenter");
export const gameCenterAvailable = () =>
  Capacitor.getPlatform() === "ios" &&
  Capacitor.isPluginAvailable("TradeUpGameCenter");
export const connectGameCenter = () => native.authenticate();
export const loadGameCenterBoard = (kind: LeaderboardKind, playerId: string) =>
  native.load({ leaderboardId: LEADERBOARDS[kind], playerId });

// Explicit action only. Partial native failures are reported, not called success.
export async function submitCareerScores(
  scores: CareerScore[],
  playerId: string,
  port: GameCenterPort = native,
) {
  const allowed = new Set<string>(Object.values(LEADERBOARDS));
  if (
    !playerId ||
    scores.length === 0 ||
    scores.some(
      (score) =>
        !allowed.has(score.leaderboardId) ||
        !Number.isSafeInteger(score.value) ||
        (score.leaderboardId === LEADERBOARDS.wealth && score.value < 0) ||
        (score.leaderboardId === LEADERBOARDS.homebudget && score.value <= 0),
    )
  )
    throw new Error("INVALID_SCORES");
  for (const score of scores)
    await port.submit({
      leaderboardId: score.leaderboardId,
      score: String(score.value),
      playerId,
    });
}
