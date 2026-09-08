import type { AvatarId, GameState } from "./models";

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
      entry.entitlementId === "animated_avatars_01" && entry.status === "OWNED",
  );
