import { market } from "../game";
import { WORLD_CONFIG } from "./config";
import { activePlayerListings, netWorthMinor } from "./economy";
import { completeDuePreparations } from "./preparation";
import { rollBuyerExposure } from "./world";
import type {
  GameState,
  EntitlementId,
  Listing,
  MonetizationProductId,
  MonetizationState,
  RewardActionTransaction,
  RewardPlacementId,
} from "./models";
import { MONETIZATION_CONFIG } from "./config";

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

const REWARD_WINDOW_MIN = MONETIZATION_CONFIG.reward.rollingWindowHours * 60;
const SESSION_CAP = MONETIZATION_CONFIG.reward.sessionCap;
const GLOBAL_CAP = MONETIZATION_CONFIG.reward.globalCap;
const FIRST_SALE_LOCK_MIN =
  MONETIZATION_CONFIG.reward.firstSaleCompleteThresholdMinutes;
const LISTING_REACH_MAX_AGE_MIN =
  MONETIZATION_CONFIG.reward.placementReward.LISTING_REACH_MAX_AGE_GAME_MIN;
const LISTING_SCOUT_ADD_COUNT =
  MONETIZATION_CONFIG.reward.placementReward.MARKET_SCOUT_LISTING_COUNT;

const isActiveMarketListing = (
  state: Listing["state"],
): state is "ACTIVE" | "WATCHED" | "NEGOTIATING" =>
  state === "ACTIVE" || state === "WATCHED" || state === "NEGOTIATING";
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
    sessionRewardCount: 0,
    rollingRewardTimestamps: [],
    placementUsage: defaultPlacementUsage(),
  },
  firstSaleComplete: false,
  lifetimeActivePlayMinutes: 0,
  rewardCooldownUntilGameMin: undefined,
  rewardTransactions: [],
});

export const hasPremiumEntitlement = (state: Pick<GameState, "monetization">) =>
  state.monetization.entitlements.some(
    (entry) =>
      entry.entitlementId === "premium_lifetime" && entry.status === "OWNED",
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
  nowGameMin: number,
): RewardActionTransaction[] => {
  return state.monetization.rewardTransactions.filter(
    (entry) =>
      !entry.appliedAt ||
      nowGameMin - Math.floor(entry.appliedAt / 60) <= REWARD_WINDOW_MIN,
  );
};

const countCaps = (state: GameState) => {
  const nowMin = state.gameTimeMin;
  const rewards = cleanupRewardTransactions(state, nowMin);
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
    const activeCount = state.listings.filter((listing) =>
      isActiveMarketListing(listing.state),
    ).length;
    const inspectedCount = state.analytics.events.filter(
      (event) =>
        event.name === "listing_open" || event.name === "listing_impression",
    ).length;
    return activeCount < 8 || inspectedCount >= 8
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
          entry.completesAtGameMin > state.gameTimeMin,
      ),
    )?.id;
  }

  return activePlayerListings(state).find(
    (listing) =>
      state.gameTimeMin - listing.createdAtGameMin >=
        LISTING_REACH_MAX_AGE_MIN && !listOffersByListing(state, listing.id),
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
    // rewarded scout only extends listing pool deterministically
    const existingCount = state.listings.filter((listing) =>
      isActiveMarketListing(listing.state),
    ).length;
    const additional = Math.max(
      0,
      Math.min(
        LISTING_SCOUT_ADD_COUNT,
        WORLD_CONFIG.maxActiveListings - existingCount,
      ),
    );
    if (additional > 0) {
      const arrivals: Listing[] = market(
        state.seed,
        Math.max(0, netWorthMinor(state)),
        state.marketCycle + 1,
        state.gameTimeMin,
        additional,
      );
      next = {
        ...state,
        marketCycle: state.marketCycle + 1,
        listings: [...state.listings, ...arrivals],
      };
    }
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
  };
  const rewards = cleanupRewardTransactions(next, next.gameTimeMin).filter(
    (entry) => entry.id !== actionId,
  );

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
      rewardCooldownUntilGameMin:
        MONETIZATION_CONFIG.reward.cooldownSeconds > 0
          ? next.gameTimeMin + MONETIZATION_CONFIG.reward.cooldownSeconds / 60
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
  const nowMin = state.gameTimeMin;
  const targetId = nextPlacementTarget(placementId, state);
  const normalizedTransactions = cleanupRewardTransactions(state, nowMin);

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
    .filter((entry) => entry.placementId === placementId)
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
    state.monetization.rewardCooldownUntilGameMin !== undefined &&
    nowMin < state.monetization.rewardCooldownUntilGameMin
  ) {
    return { ok: false, reason: "COOLDOWN" };
  }
  if (state.monetization.usage.sessionRewardCount >= SESSION_CAP) {
    return { ok: false, reason: "SESSION_CAP" };
  }

  const caps = countCaps(state);
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
      rewardTransactions: cleanupRewardTransactions(state, state.gameTimeMin),
    },
  };

  const existing = normalized.monetization.rewardTransactions.find(
    (entry) =>
      entry.placementId === placementId &&
      entry.source === source &&
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
  if (source === "premium" && !hasPremiumEntitlement(normalized)) {
    return { ok: false, reason: "PREMIUM_REQUIRED", state: normalized };
  }

  const targetId = eligibility.targetId;
  const rewardId = `reward:${placementId}:${source}:${normalized.gameTimeMin}:${targetId ?? "global"}`;
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
  };
  const requestedState = {
    ...normalized,
    monetization: {
      ...normalized.monetization,
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
        ? applyReward(requestedState, placementId, source, targetId)
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
  const entitlementId: EntitlementId | null =
    productId === MONETIZATION_CONFIG.products.premium.productId
      ? "premium_lifetime"
      : productId === MONETIZATION_CONFIG.products.themeNightMarket.productId
        ? "theme_night_market"
        : productId === MONETIZATION_CONFIG.products.themeWorkshop.productId
          ? "theme_workshop"
          : productId === MONETIZATION_CONFIG.products.homeStyles.productId
            ? "home_styles_01"
            : null;

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
  return {
    ...state,
    monetization: {
      ...state.monetization,
      entitlements: [
        ...state.monetization.entitlements.filter(
          (entry) => entry.entitlementId !== entitlementId,
        ),
        {
          productId,
          entitlementId,
          status,
          platform,
          ...(status === "REVOKED"
            ? { verifiedAtGameMin: state.gameTimeMin }
            : {}),
        },
      ],
    },
  };
};
