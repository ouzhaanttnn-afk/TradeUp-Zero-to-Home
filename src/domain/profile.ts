import type { AvatarId, GameState } from "./models";

export const normalizeProfileName = (name: string): string | undefined => {
  if (/[\p{Cc}\p{Zl}\p{Zp}]/u.test(name)) return undefined;
  return name.trim().replace(/\s+/g, " ").slice(0, 20) || undefined;
};

export const ANIMATED_AVATAR_IDS = [
  "neon-araci",
  "altin-vizyoner",
  "gece-analisti",
] as const satisfies readonly AvatarId[];

export const isAnimatedAvatar = (avatarId: AvatarId) =>
  ANIMATED_AVATAR_IDS.some((id) => id === avatarId);

export const ownsAnimatedAvatars = (state: Pick<GameState, "monetization">) =>
  state.monetization.entitlements.some(
    (entry) =>
      (entry.entitlementId === "animated_avatars_01" ||
        entry.entitlementId === "premium_lifetime") &&
      entry.status === "OWNED",
  );
