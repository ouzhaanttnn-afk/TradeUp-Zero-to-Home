import { activePlayerListings, completedTradeCount } from "./economy";
import { completeDuePreparations } from "./preparation";
import { rollBuyerExposure } from "./world";
import type {
  GameState,
  EntitlementId,
  MonetizationProductId,
  MonetizationState,
  RewardActionTransaction,
  RewardPlacementId,
} from "./models";
import { isAnimatedAvatar } from "./profile";
import { EARLY_GAME_CONFIG, MONETIZATION_CONFIG } from "./config";

type RewardRequestReason =
  | "COOLDOWN"
  | "GLOBAL_CAP"
  | "SESSION_CAP"
  | "PLACEMENT_CAP"
  | "FIRST_REWARD_BLOCKED"
  | "AD_CONSENT_REQUIRED"
  | "PREMIUM_REQUIRED"
  | "PROVIDER_FAILURE_HIDDEN"
  | "NO_ELIGIBLE_TARGET"
  | "MISSING_PRECONDITION";

type RewardRequestResult =
  | { ok: true; state: GameState; rewardId: string }
  | { ok: false; reason: RewardRequestReason; state: GameState };

type RewardEligibility =
  { ok: true; targetId?: string } | { ok: false; reason: RewardRequestReason };

const REWARD_WINDOW_MS =
  MONETIZATION_CONFIG.reward.rollingWindowHours * 3_600_000;
const SESSION_CAP = MONETIZATION_CONFIG.reward.sessionCap;
const GLOBAL_CAP = MONETIZATION_CONFIG.reward.globalCap;
const FIRST_SALE_LOCK_MIN =
  MONETIZATION_CONFIG.reward.firstSaleCompleteThresholdMinutes;
const LISTING_REACH_MAX_AGE_MIN =
  MONETIZATION_CONFIG.reward.placementReward.LISTING_REACH_MAX_AGE_GAME_MIN;
const MARKET_SCOUT_SCAN_CREDITS =
  MONETIZATION_CONFIG.reward.placementReward.MARKET_SCOUT_SCAN_CREDITS;
const nowSeconds = (state: Pick<GameState, "gameTimeMin">) =>
  state.gameTimeMin * 60;

const defaultPlacementUsage = (): Record<RewardPlacementId, number[]> => ({
  MARKET_SCOUT: [],
  FAST_INSPECTION: [],
  FAST_PREPARATION: [],
  LISTING_REACH: [],
});

export const createDefaultMonetizationState = (
  gameTimeMin: number,
  wallClockMs = 0,
): MonetizationState => ({
  consent: {
    adPersonalizationAllowed: false,
    adsServedWithConsent: false,
    canRequestAds: false,
    updatedAtGameMin: gameTimeMin,
  },
  entitlements: [],
  usage: {
    rewardSessionStartedAt: gameTimeMin,
    rewardSessionId: 0,
    rewardRequestSequence: 0,
    sessionRewardCount: 0,
    rollingRewardTimestamps: [],
    placementUsage: defaultPlacementUsage(),
  },
  firstSaleComplete: false,
  lifetimeActivePlayMinutes: 0,
  rewardCooldownUntilGameMin: undefined,
  rewardClockWallMs: wallClockMs,
  rewardTransactions: [],
  marketScanCredits: EARLY_GAME_CONFIG.scanCapBoosted,
  marketScanRefillAnchorWallMs: wallClockMs,
});

// Wall time is supplied by the infrastructure boundary, never read by the engine.
export const advanceRewardClock = (
  state: GameState,
  requestedWallMs: number,
): GameState => {
  const now = Math.max(
    state.monetization.rewardClockWallMs,
    state.lastWallClockMs,
    Number.isFinite(requestedWallMs) ? requestedWallMs : 0,
  );
  return now === state.monetization.rewardClockWallMs
    ? state
    : {
        ...state,
        monetization: { ...state.monetization, rewardClockWallMs: now },
      };
};

// A native ad/consent sheet can pause the app. Only cold hydration opens a session.
export const beginRewardSession = (
  state: GameState,
  wallMs: number,
): GameState => {
  const next = advanceRewardClock(state, wallMs);
  return {
    ...next,
    monetization: {
      ...next.monetization,
      rewardTransactions: next.monetization.rewardTransactions.map((entry) =>
        entry.status === "REQUESTED"
          ? { ...entry, status: "CANCELLED" }
          : entry,
      ),
      usage: {
        ...next.monetization.usage,
        rewardSessionId: next.monetization.usage.rewardSessionId + 1,
        rewardSessionStartedAt: next.gameTimeMin,
        sessionRewardCount: 0,
      },
    },
  };
};

const MARKET_SCAN_CAP =
  MONETIZATION_CONFIG.reward.placementReward.MARKET_SCOUT_SCAN_CREDITS;
// Each credit still regenerates in 72 real seconds; a full early allowance
// therefore takes 60 minutes, while 0→25 after the threshold takes 30.
const MARKET_SCAN_REFILL_INTERVAL_MS =
  (MONETIZATION_CONFIG.reward.placementReward.MARKET_SCOUT_FULL_REFILL_MINUTES *
    60_000) /
  MARKET_SCAN_CAP;

export const marketScanRegenCap = (
  state: Pick<GameState, "ownedAssets">,
): number =>
  completedTradeCount(state) < EARLY_GAME_CONFIG.completedTradeThreshold
    ? EARLY_GAME_CONFIG.scanCapBoosted
    : MARKET_SCAN_CAP;

export const rechargeMarketScanCredits = (
  state: GameState,
  requestedWallMs: number,
): GameState => {
  state = advanceRewardClock(state, requestedWallMs);
  const regenCap = marketScanRegenCap(state);
  const credits = Math.min(regenCap, state.monetization.marketScanCredits);
  const nowWallMs = Math.max(
    state.lastWallClockMs,
    state.monetization.marketScanRefillAnchorWallMs,
    requestedWallMs,
  );
  if (credits >= regenCap) {
    if (
      state.monetization.marketScanRefillAnchorWallMs === nowWallMs &&
      state.monetization.marketScanCredits === credits
    )
      return state;
    return {
      ...state,
      monetization: {
        ...state.monetization,
        marketScanCredits: credits,
        marketScanRefillAnchorWallMs: nowWallMs,
      },
    };
  }
  const elapsedMs = Math.max(
    0,
    nowWallMs - state.monetization.marketScanRefillAnchorWallMs,
  );
  const earned = Math.floor(elapsedMs / MARKET_SCAN_REFILL_INTERVAL_MS);
  if (earned <= 0)
    return credits === state.monetization.marketScanCredits
      ? state
      : {
          ...state,
          monetization: { ...state.monetization, marketScanCredits: credits },
        };
  const marketScanCredits = Math.min(regenCap, credits + earned);
  return {
    ...state,
    monetization: {
      ...state.monetization,
      marketScanCredits,
      marketScanRefillAnchorWallMs:
        marketScanCredits === regenCap
          ? nowWallMs
          : state.monetization.marketScanRefillAnchorWallMs +
            earned * MARKET_SCAN_REFILL_INTERVAL_MS,
    },
  };
};

export const hasPremiumEntitlement = (state: Pick<GameState, "monetization">) =>
  state.monetization.entitlements.some(
    (entry) =>
      entry.entitlementId === "premium_lifetime" && entry.status === "OWNED",
  );

export const hasAdFreeEntitlement = (state: Pick<GameState, "monetization">) =>
  state.monetization.entitlements.some(
    (entry) =>
      (entry.entitlementId === "premium_lifetime" ||
        entry.entitlementId === "no_ads_lifetime") &&
      entry.status === "OWNED",
  );

export const syncConsentState = (
  state: GameState,
  canRequestAds: boolean,
  adPersonalizationAllowed: boolean,
  atGameMin = state.gameTimeMin,
): GameState => ({
  ...state,
  monetization: {
    ...state.monetization,
    consent: {
      ...state.monetization.consent,
      canRequestAds,
      adPersonalizationAllowed,
      adsServedWithConsent: canRequestAds && adPersonalizationAllowed,
      updatedAtGameMin: atGameMin,
    },
  },
});

export const markFirstSaleComplete = (state: GameState): GameState =>
  state.monetization.firstSaleComplete
    ? state
    : {
        ...state,
        monetization: {
          ...state.monetization,
          firstSaleComplete: true,
        },
      };

const cleanupRewardTransactions = (
  state: GameState,
  nowWallMs: number,
): RewardActionTransaction[] => {
  return state.monetization.rewardTransactions.filter(
    (entry) =>
      entry.status !== "APPLIED" ||
      entry.sessionId === state.monetization.usage.rewardSessionId ||
      entry.appliedAtWallMs === undefined ||
      nowWallMs - entry.appliedAtWallMs < REWARD_WINDOW_MS,
  );
};

const countCaps = (state: GameState) => {
  const rewards = cleanupRewardTransactions(
    state,
    state.monetization.rewardClockWallMs,
  ).filter(
    (entry) =>
      entry.appliedAtWallMs === undefined ||
      state.monetization.rewardClockWallMs - entry.appliedAtWallMs <
        REWARD_WINDOW_MS,
  );
  const placementCounts: Record<RewardPlacementId, number> = {
    MARKET_SCOUT: 0,
    FAST_INSPECTION: 0,
    FAST_PREPARATION: 0,
    LISTING_REACH: 0,
  };

  for (const reward of rewards) {
    if (reward.status !== "APPLIED") continue;
    placementCounts[reward.placementId] += 1;
  }

  return {
    globalCount: rewards.filter((reward) => reward.status === "APPLIED").length,
    placementCounts,
  };
};

const listOffersByListing = (state: GameState, listingId: string) =>
  state.buyerOffers.some((offer) => offer.listingId === listingId);

const nextPlacementTarget = (
  placementId: RewardPlacementId,
  state: GameState,
): string | undefined => {
  if (placementId === "MARKET_SCOUT") {
    return state.monetization.marketScanCredits === 0
      ? `market-scout:${state.marketCycle}:${state.gameTimeMin}`
      : undefined;
  }

  if (placementId === "FAST_INSPECTION") {
    return state.transactionJournal.find(
      (entry) =>
        entry.kind === "INSPECTION" &&
        entry.metadata.status === "IN_PROGRESS" &&
        Number(entry.metadata.completesAtGameMin) - state.gameTimeMin > 0.75,
    )?.id;
  }

  if (placementId === "FAST_PREPARATION") {
    return state.ownedAssets.find((asset) =>
      asset.instance.preparationHistory.some(
        (entry) =>
          entry.state === "IN_PROGRESS" &&
          entry.completesAtGameMin - state.gameTimeMin > 1,
      ),
    )?.id;
  }

  return activePlayerListings(state).find(
    (listing) =>
      state.gameTimeMin - listing.createdAtGameMin >=
        LISTING_REACH_MAX_AGE_MIN &&
      !listOffersByListing(state, listing.id) &&
      // The economic journal outlives the 24-hour reward ledger. A reach roll
      // belongs to this listing lifecycle even when it created no buyer offer.
      !state.transactionJournal.some(
        (entry) =>
          entry.kind === "REWARD" &&
          entry.metadata.placementId === "LISTING_REACH" &&
          entry.metadata.listingId === listing.id &&
          entry.metadata.exposureRollCompleted === true,
      ) &&
      !state.monetization.rewardTransactions.some(
        (entry) =>
          entry.status === "APPLIED" &&
          entry.placementId === "LISTING_REACH" &&
          entry.targetId === listing.id,
      ),
  )?.id;
};

const transactionExists = (state: GameState, id: string) =>
  state.monetization.rewardTransactions.some((entry) => entry.id === id);

const applyReward = (
  state: GameState,
  placementId: RewardPlacementId,
  source: "ad" | "premium",
  targetId: string | undefined,
  transaction?: RewardActionTransaction,
): GameState => {
  let next = state;

  if (placementId === "MARKET_SCOUT") {
    next = {
      ...state,
      monetization: {
        ...state.monetization,
        marketScanCredits: MARKET_SCOUT_SCAN_CREDITS,
      },
    };
  }

  if (placementId === "FAST_INSPECTION") {
    next = {
      ...next,
      transactionJournal: next.transactionJournal.map((entry) =>
        entry.id === targetId
          ? {
              ...entry,
              metadata: {
                ...entry.metadata,
                status: "COMPLETE",
                completesAtGameMin: state.gameTimeMin,
              },
            }
          : entry,
      ),
    };
  }

  if (placementId === "FAST_PREPARATION" && targetId) {
    const accelerated = {
      ...next,
      ownedAssets: next.ownedAssets.map((asset) =>
        asset.id !== targetId
          ? asset
          : {
              ...asset,
              instance: {
                ...asset.instance,
                preparationHistory: asset.instance.preparationHistory.map(
                  (entry) =>
                    entry.state === "IN_PROGRESS"
                      ? { ...entry, completesAtGameMin: state.gameTimeMin }
                      : entry,
                ),
              },
            },
      ),
    };
    next = completeDuePreparations(accelerated, state.gameTimeMin);
  }

  if (placementId === "LISTING_REACH" && targetId) {
    next = rollBuyerExposure(
      next,
      targetId,
      `reward-exposure:${targetId}:${state.gameTimeMin}`,
    );
  }

  const actionId =
    transaction?.id ??
    `reward:${placementId}:${source}:${state.gameTimeMin}:${targetId ?? "global"}`;
  const applied: RewardActionTransaction = {
    id: actionId,
    placementId,
    source,
    status: "APPLIED",
    requestedAt: transaction?.requestedAt ?? nowSeconds(state),
    appliedAt: nowSeconds(state),
    targetId,
    requestedAtWallMs:
      transaction?.requestedAtWallMs ?? state.monetization.rewardClockWallMs,
    appliedAtWallMs: state.monetization.rewardClockWallMs,
    sessionId:
      transaction?.sessionId ?? state.monetization.usage.rewardSessionId,
  };
  const rewards = cleanupRewardTransactions(
    next,
    next.monetization.rewardClockWallMs,
  ).filter((entry) => entry.id !== actionId);

  const nextPlacementUsage = {
    ...next.monetization.usage.placementUsage,
    [placementId]: [
      ...next.monetization.usage.placementUsage[placementId],
      next.gameTimeMin,
    ].slice(-MONETIZATION_CONFIG.reward.rollingWindowHours * 20),
  };

  return {
    ...next,
    monetization: {
      ...next.monetization,
      rewardCooldownUntilGameMin: undefined,
      rewardCooldownUntilWallMs:
        MONETIZATION_CONFIG.reward.cooldownSeconds > 0
          ? next.monetization.rewardClockWallMs +
            MONETIZATION_CONFIG.reward.cooldownSeconds * 1000
          : undefined,
      rewardTransactions: [...rewards, applied].slice(-1200),
      usage: {
        ...next.monetization.usage,
        rewardSessionStartedAt: next.monetization.usage.rewardSessionStartedAt,
        sessionRewardCount: next.monetization.usage.sessionRewardCount + 1,
        rollingRewardTimestamps: [
          ...next.monetization.usage.rollingRewardTimestamps,
          next.gameTimeMin,
        ].slice(-MONETIZATION_CONFIG.reward.rollingWindowHours * 20),
        placementUsage: nextPlacementUsage,
      },
    },
  };
};

const isEligibleByUnlock = (state: GameState) =>
  state.monetization.firstSaleComplete &&
  state.monetization.lifetimeActivePlayMinutes >= FIRST_SALE_LOCK_MIN;

export const getRewardEligibility = (
  state: GameState,
  placementId: RewardPlacementId,
): RewardEligibility => {
  const nowWallMs = state.monetization.rewardClockWallMs;
  const targetId = nextPlacementTarget(placementId, state);
  const normalizedTransactions = cleanupRewardTransactions(state, nowWallMs);

  if (
    normalizedTransactions.length !==
    state.monetization.rewardTransactions.length
  ) {
    state = {
      ...state,
      monetization: {
        ...state.monetization,
        rewardTransactions: normalizedTransactions,
      },
    };
  }

  if (!isEligibleByUnlock(state)) {
    return { ok: false, reason: "FIRST_REWARD_BLOCKED" };
  }
  const latestForPlacement = normalizedTransactions
    .filter(
      (entry) =>
        entry.placementId === placementId &&
        entry.sessionId === state.monetization.usage.rewardSessionId,
    )
    .slice(-2);
  if (
    latestForPlacement.length === 2 &&
    latestForPlacement.every((entry) => entry.status === "FAILED")
  ) {
    return { ok: false, reason: "PROVIDER_FAILURE_HIDDEN" };
  }
  if (placementId === "MARKET_SCOUT" && !targetId) {
    return { ok: false, reason: "MISSING_PRECONDITION" };
  }
  if (placementId === "FAST_INSPECTION" && !targetId) {
    return { ok: false, reason: "NO_ELIGIBLE_TARGET" };
  }
  if (placementId === "FAST_PREPARATION" && !targetId) {
    return { ok: false, reason: "NO_ELIGIBLE_TARGET" };
  }
  if (placementId === "LISTING_REACH" && !targetId) {
    return { ok: false, reason: "NO_ELIGIBLE_TARGET" };
  }
  if (
    state.monetization.rewardCooldownUntilWallMs !== undefined &&
    nowWallMs < state.monetization.rewardCooldownUntilWallMs
  ) {
    return { ok: false, reason: "COOLDOWN" };
  }
  if (state.monetization.usage.sessionRewardCount >= SESSION_CAP) {
    return { ok: false, reason: "SESSION_CAP" };
  }

  const caps = countCaps(state);
  if (
    placementId === "MARKET_SCOUT" &&
    normalizedTransactions.some(
      (entry) =>
        entry.placementId === placementId &&
        entry.status === "APPLIED" &&
        entry.sessionId === state.monetization.usage.rewardSessionId,
    )
  ) {
    return { ok: false, reason: "PLACEMENT_CAP" };
  }
  if (caps.globalCount >= GLOBAL_CAP)
    return { ok: false, reason: "GLOBAL_CAP" };
  if (
    caps.placementCounts[placementId] >=
    MONETIZATION_CONFIG.reward.placementCap[placementId]
  ) {
    return { ok: false, reason: "PLACEMENT_CAP" };
  }

  return { ok: true, targetId };
};

export const requestMonetizedAction = (
  state: GameState,
  placementId: RewardPlacementId,
  source: "ad" | "premium",
): RewardRequestResult => {
  const normalized = {
    ...state,
    monetization: {
      ...state.monetization,
      rewardTransactions: cleanupRewardTransactions(
        state,
        state.monetization.rewardClockWallMs,
      ),
    },
  };

  const existing = normalized.monetization.rewardTransactions.find(
    (entry) =>
      entry.placementId === placementId &&
      entry.source === source &&
      entry.status === "REQUESTED" &&
      entry.sessionId === normalized.monetization.usage.rewardSessionId &&
      entry.requestedAt === nowSeconds(normalized),
  );
  if (existing) {
    return { ok: true, state: normalized, rewardId: existing.id };
  }

  const eligibility = getRewardEligibility(normalized, placementId);
  if (!eligibility.ok) {
    return { ok: false, reason: eligibility.reason, state: normalized };
  }

  if (source === "ad" && !normalized.monetization.consent.canRequestAds) {
    return { ok: false, reason: "AD_CONSENT_REQUIRED", state: normalized };
  }
  if (source === "premium" && !hasAdFreeEntitlement(normalized)) {
    return { ok: false, reason: "PREMIUM_REQUIRED", state: normalized };
  }

  const targetId = eligibility.targetId;
  const sequence = normalized.monetization.usage.rewardRequestSequence + 1;
  const rewardId = `reward:${placementId}:${source}:${normalized.monetization.usage.rewardSessionId}:${sequence}:${targetId ?? "global"}`;
  if (transactionExists(normalized, rewardId)) {
    return { ok: true, state: normalized, rewardId };
  }

  const requested: RewardActionTransaction = {
    id: rewardId,
    placementId,
    source,
    status: "REQUESTED",
    requestedAt: nowSeconds(normalized),
    targetId,
    requestedAtWallMs: normalized.monetization.rewardClockWallMs,
    sessionId: normalized.monetization.usage.rewardSessionId,
  };
  const requestedState = {
    ...normalized,
    monetization: {
      ...normalized.monetization,
      usage: {
        ...normalized.monetization.usage,
        rewardRequestSequence: sequence,
      },
      rewardTransactions: [
        ...normalized.monetization.rewardTransactions,
        requested,
      ],
    },
  };
  return {
    ok: true,
    state:
      source === "premium"
        ? applyReward(requestedState, placementId, source, targetId, requested)
        : requestedState,
    rewardId,
  };
};

export const applyRewardedResult = (
  state: GameState,
  rewardId: string,
): GameState => {
  const transaction = state.monetization.rewardTransactions.find(
    (entry) => entry.id === rewardId,
  );
  if (!transaction || transaction.status === "APPLIED") return state;
  if (transaction.status !== "REQUESTED") return state;
  const eligibility = getRewardEligibility(state, transaction.placementId);
  if (
    !eligibility.ok ||
    (transaction.placementId !== "MARKET_SCOUT" &&
      eligibility.targetId !== transaction.targetId)
  )
    return closeRewardedAction(state, rewardId, "FAILED");
  return applyReward(
    state,
    transaction.placementId,
    transaction.source,
    transaction.targetId,
    transaction,
  );
};

export const closeRewardedAction = (
  state: GameState,
  rewardId: string,
  status: "CANCELLED" | "FAILED",
): GameState => ({
  ...state,
  monetization: {
    ...state.monetization,
    rewardTransactions: state.monetization.rewardTransactions.map((entry) =>
      entry.id === rewardId && entry.status === "REQUESTED"
        ? { ...entry, status }
        : entry,
    ),
  },
});

export const advanceRewardState = (state: GameState, elapsedMinutes: number) =>
  elapsedMinutes <= 0
    ? state
    : {
        ...state,
        monetization: {
          ...state.monetization,
          lifetimeActivePlayMinutes:
            state.monetization.lifetimeActivePlayMinutes + elapsedMinutes,
        },
      };

export const setRewardEntitlement = (
  state: GameState,
  productId: MonetizationProductId,
  owned: boolean,
  platform: "ios" | "android" | "web" = "web",
): GameState => {
  const entitlementId: EntitlementId | undefined =
    MONETIZATION_CONFIG.productCatalog.find(
      (product) => product.productId === productId,
    )?.entitlementId;

  if (!entitlementId) return state;

  const filtered = state.monetization.entitlements.filter(
    (entry) => entry.entitlementId !== entitlementId,
  );
  if (!owned) {
    return {
      ...state,
      monetization: {
        ...state.monetization,
        entitlements: filtered,
      },
    };
  }
  return {
    ...state,
    monetization: {
      ...state.monetization,
      entitlements: [
        ...filtered,
        {
          productId,
          entitlementId,
          status: "OWNED",
          platform,
          purchasedAtGameMin: state.gameTimeMin,
          verifiedAtGameMin: state.gameTimeMin,
        },
      ],
    },
  };
};

export const syncVerifiedEntitlement = (
  state: GameState,
  productId: MonetizationProductId,
  status: "PENDING" | "OWNED" | "REVOKED",
  platform: "ios" | "android",
): GameState => {
  const owned = status === "OWNED";
  const next = setRewardEntitlement(state, productId, owned, platform);
  if (owned) return next;
  const entitlementId = MONETIZATION_CONFIG.productCatalog.find(
    (product) => product.productId === productId,
  )?.entitlementId;
  if (!entitlementId) return state;
  const premiumAvatarSelected = isAnimatedAvatar(state.profile.avatarId);
  const remainingEntitlements = [
    ...state.monetization.entitlements.filter(
      (entry) => entry.entitlementId !== entitlementId,
    ),
    {
      productId,
      entitlementId,
      status,
      platform,
      ...(status === "REVOKED" ? { verifiedAtGameMin: state.gameTimeMin } : {}),
    },
  ];
  const animatedAvatarsStillOwned = remainingEntitlements.some(
    (entry) =>
      (entry.entitlementId === "premium_lifetime" ||
        entry.entitlementId === "animated_avatars_01") &&
      entry.status === "OWNED",
  );
  return {
    ...state,
    ...(premiumAvatarSelected && !animatedAvatarsStillOwned
      ? { profile: { ...state.profile, avatarId: "pazar-kasifi" as const } }
      : {}),
    monetization: {
      ...state.monetization,
      entitlements: remainingEntitlements,
    },
  };
};
