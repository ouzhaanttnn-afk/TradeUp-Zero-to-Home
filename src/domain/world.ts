import { market, rng } from "../game";
import { WORLD_CONFIG } from "./config";
import { netWorthMinor } from "./economy";
import { completeDuePreparations } from "./preparation";
import type {
  BuyerOffer,
  GameState,
  Listing,
  MarketListingState,
  PlayerListing,
} from "./models";

export { WORLD_CONFIG } from "./config";

export type WorldAdvanceSummary = {
  elapsedGameMin: number;
  arrivals: number;
  npcSales: number;
  marketExpirations: number;
  buyerOffers: number;
  playerListingExpirations: number;
};

export type WorldAdvanceResult = {
  state: GameState;
  summary: WorldAdvanceSummary;
};

type AdvanceOptions = {
  maxMarketClosures?: number;
  protectedListingId?: string;
  forceArrivals?: number;
};

const activeMarketStates = new Set<MarketListingState>([
  "ACTIVE",
  "WATCHED",
  "NEGOTIATING",
]);

export const isActiveMarketListing = (listing: Listing) =>
  activeMarketStates.has(listing.state);

export const activeMarketListings = (state: Pick<GameState, "listings">) =>
  state.listings.filter(isActiveMarketListing);

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const hashString = (value: string) => {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
};

export function npcHazardScore(listing: Listing, gameTimeMin: number) {
  const priceRatio =
    listing.priceMinor / Math.max(1, listing.instance.fairValueMinor);
  const opportunity = clamp01((1.18 - priceRatio) / 0.58);
  const lifetime = Math.max(
    1,
    listing.expiresAtGameMin - listing.createdAtGameMin,
  );
  const age = clamp01((gameTimeMin - listing.createdAtGameMin) / lifetime);
  const competition = clamp01(listing.interest / 100);
  return clamp01(
    opportunity * 0.3 +
      listing.instance.family.liquidity * 0.2 +
      listing.instance.family.demand * 0.18 +
      listing.urgency * 0.12 +
      age * 0.1 +
      competition * 0.1,
  );
}

export function npcRiskSignal(listing: Listing, gameTimeMin: number) {
  const score = npcHazardScore(listing, gameTimeMin);
  if (score >= 0.72)
    return { level: "critical" as const, text: "Başka teklif var" };
  if (score >= 0.56) return { level: "high" as const, text: "İlgi artıyor" };
  if (score >= 0.38)
    return { level: "medium" as const, text: "Birkaç kişi inceliyor" };
  return { level: "low" as const, text: "İlgi sakin" };
}

const shouldNpcPurchase = (
  state: GameState,
  listing: Listing,
  gameTimeMin: number,
) => {
  const age = gameTimeMin - listing.createdAtGameMin;
  if (
    gameTimeMin < WORLD_CONFIG.firstSessionProtectionMin ||
    age < WORLD_CONFIG.minimumNpcAgeMin
  ) {
    return false;
  }
  const chance = 0.003 + npcHazardScore(listing, gameTimeMin) * 0.035;
  const roll = rng(state.seed + listing.seed * 17 + gameTimeMin * 104_729)();
  return roll < chance;
};

const nextInterest = (
  state: GameState,
  listing: Listing,
  gameTimeMin: number,
) => {
  const roll = rng(state.seed + listing.seed + gameTimeMin * 7_919)();
  const increase = roll < listing.instance.family.demand * 0.55 ? 1 : 0;
  return Math.min(100, listing.interest + increase);
};

const meaningfulMiss = (listing: Listing) =>
  listing.priceMinor / listing.instance.fairValueMinor <= 0.88;

function advanceMarketMinute(
  state: GameState,
  gameTimeMin: number,
  options: AdvanceOptions,
  closureCount: number,
) {
  const exits: Listing[] = [];
  const listings = state.listings.map((listing) => {
    if (!isActiveMarketListing(listing)) return listing;
    const canClose =
      closureCount + exits.length <
        (options.maxMarketClosures ?? Number.POSITIVE_INFINITY) &&
      listing.id !== options.protectedListingId;
    if (canClose && listing.expiresAtGameMin <= gameTimeMin) {
      const expired: Listing = {
        ...listing,
        state: "EXPIRED",
        closedAtGameMin: gameTimeMin,
        exitReason: "EXPIRED",
      };
      exits.push(expired);
      return expired;
    }
    if (canClose && shouldNpcPurchase(state, listing, gameTimeMin)) {
      const sold: Listing = {
        ...listing,
        state: "SOLD_TO_NPC",
        closedAtGameMin: gameTimeMin,
        exitReason: "NPC_PURCHASE",
      };
      exits.push(sold);
      return sold;
    }
    return {
      ...listing,
      interest: nextInterest(state, listing, gameTimeMin),
    };
  });

  const career = [...state.career];
  for (const listing of exits.filter(meaningfulMiss)) {
    const id = `missed:${listing.id}`;
    if (career.some((event) => event.id === id)) continue;
    career.push({
      id,
      type: "MISSED",
      atGameMin: gameTimeMin,
      label:
        listing.state === "SOLD_TO_NPC"
          ? `${listing.instance.family.name} başka alıcıya gitti`
          : `${listing.instance.family.name} ilanının süresi doldu`,
    });
  }

  const exitedIds = new Set(exits.map((listing) => listing.id));
  const negotiation =
    state.negotiation && exitedIds.has(state.negotiation.listingId)
      ? { ...state.negotiation, closed: true }
      : state.negotiation;
  return { state: { ...state, listings, career, negotiation }, exits };
}

const activePlayerListing = (listing: PlayerListing) =>
  listing.state === "ACTIVE";

const offerForMinute = (
  state: GameState,
  listing: PlayerListing,
  gameTimeMin: number,
): BuyerOffer | undefined => {
  if (gameTimeMin - listing.createdAtGameMin < 3) return undefined;
  if (
    state.buyerOffers.some(
      (offer) =>
        offer.listingId === listing.id && offer.expiresAtGameMin > gameTimeMin,
    )
  ) {
    return undefined;
  }
  const asset = state.ownedAssets.find(
    (item) => item.id === listing.ownedAssetId,
  );
  if (!asset || asset.state !== "LISTED") return undefined;

  const priceRatio =
    listing.askingPriceMinor / Math.max(1, asset.instance.fairValueMinor);
  const priceFit = clamp01((1.3 - priceRatio) / 0.55);
  const arrivalChance =
    0.006 +
    asset.instance.family.demand * 0.018 +
    asset.instance.family.liquidity * 0.014 +
    (asset.instance.liquidityBonusBps / 10_000) * 0.014 +
    priceFit * 0.02;
  const roll = rng(
    state.seed + hashString(listing.id) * 65_537 + gameTimeMin * 131_071,
  )();
  if (roll >= arrivalChance) return undefined;

  const amountRoll = rng(
    state.seed + hashString(listing.id) * 8_191 + gameTimeMin * 524_287,
  )();
  const conditionFactor = 0.96 + (asset.instance.condition - 75) / 500;
  const demandFactor = 0.96 + asset.instance.family.demand * 0.06;
  const amountMinor =
    Math.round(
      (asset.instance.fairValueMinor *
        conditionFactor *
        demandFactor *
        (0.94 + amountRoll * 0.1)) /
        1_000,
    ) * 1_000;
  const buyers = ["Deniz", "Ece", "Mert", "Selin"] as const;
  return {
    id: `offer:${listing.id}:${gameTimeMin}`,
    listingId: listing.id,
    amountMinor,
    buyer: buyers[Math.floor(amountRoll * buyers.length)],
    expiresAtGameMin: gameTimeMin + WORLD_CONFIG.buyerOfferLifetimeMin,
  };
};

function advancePlayerListingsMinute(state: GameState, gameTimeMin: number) {
  const expiredListingIds = new Set<string>();
  const playerListings = state.playerListings.map((listing) => {
    if (
      activePlayerListing(listing) &&
      listing.expiresAtGameMin <= gameTimeMin
    ) {
      expiredListingIds.add(listing.id);
      return { ...listing, state: "EXPIRED" as const };
    }
    return listing;
  });
  const ownedAssets = state.ownedAssets.map((asset) =>
    asset.currentListingId && expiredListingIds.has(asset.currentListingId)
      ? {
          ...asset,
          state: "IN_INVENTORY" as const,
          currentListingId: undefined,
        }
      : asset,
  );
  const transactionJournal = [...state.transactionJournal];
  for (const listingId of expiredListingIds) {
    const listing = state.playerListings.find((item) => item.id === listingId);
    if (!listing) continue;
    const id = `listing-expired:${listingId}`;
    if (transactionJournal.some((entry) => entry.id === id)) continue;
    transactionJournal.push({
      id,
      kind: "LISTING",
      gameTime: gameTimeMin,
      assetId: listing.ownedAssetId,
      cashDeltaMinor: 0,
      costBasisDeltaMinor: 0,
      realizedProfitDeltaMinor: 0,
      metadata: { listingId, action: "EXPIRED" },
    });
  }

  const unexpiredOffers = state.buyerOffers.filter(
    (offer) =>
      offer.expiresAtGameMin > gameTimeMin &&
      !expiredListingIds.has(offer.listingId),
  );
  const offerState = {
    ...state,
    playerListings,
    ownedAssets,
    transactionJournal,
    buyerOffers: unexpiredOffers,
  };
  const newOffers = playerListings
    .filter(activePlayerListing)
    .flatMap((listing) => {
      const offer = offerForMinute(offerState, listing, gameTimeMin);
      return offer ? [offer] : [];
    });
  const offeredListingIds = new Set(newOffers.map((offer) => offer.listingId));

  return {
    state: {
      ...offerState,
      playerListings: playerListings.map((listing) =>
        offeredListingIds.has(listing.id)
          ? { ...listing, interest: Math.min(100, listing.interest + 1) }
          : listing,
      ),
      buyerOffers: [...unexpiredOffers, ...newOffers],
    },
    newOffers,
    expiredListingIds,
  };
}

function appendArrivals(state: GameState, requestedCount: number) {
  const capacity = Math.max(
    0,
    WORLD_CONFIG.maxActiveListings - activeMarketListings(state).length,
  );
  const count = Math.min(requestedCount, capacity);
  if (count === 0) return { state, arrivals: 0 };
  const marketCycle = state.marketCycle + 1;
  const arrivals = market(
    state.seed,
    netWorthMinor(state),
    marketCycle,
    state.gameTimeMin,
    count,
  );
  return {
    state: {
      ...state,
      marketCycle,
      listings: [...state.listings, ...arrivals],
    },
    arrivals: count,
  };
}

function pruneTerminalHistory(state: GameState) {
  const active = state.listings.filter(isActiveMarketListing);
  const terminal = state.listings
    .filter((listing) => !isActiveMarketListing(listing))
    .sort(
      (left, right) =>
        (right.closedAtGameMin ?? 0) - (left.closedAtGameMin ?? 0),
    )
    .slice(0, WORLD_CONFIG.terminalHistoryLimit);
  return { ...state, listings: [...active, ...terminal] };
}

export function advanceWorldTo(
  initial: GameState,
  requestedGameTimeMin: number,
  options: AdvanceOptions = {},
): WorldAdvanceResult {
  const requestedTime = Number.isFinite(requestedGameTimeMin)
    ? requestedGameTimeMin
    : initial.gameTimeMin;
  const targetGameTimeMin = Math.max(
    initial.gameTimeMin,
    Math.floor(requestedTime),
  );
  let state = initial;
  let closureCount = 0;
  let npcSales = 0;
  let marketExpirations = 0;
  let buyerOffers = 0;
  let playerListingExpirations = 0;

  for (
    let gameTimeMin = initial.gameTimeMin + 1;
    gameTimeMin <= targetGameTimeMin;
    gameTimeMin += 1
  ) {
    state = completeDuePreparations({ ...state, gameTimeMin }, gameTimeMin);
    const marketResult = advanceMarketMinute(
      state,
      gameTimeMin,
      options,
      closureCount,
    );
    state = marketResult.state;
    closureCount += marketResult.exits.length;
    npcSales += marketResult.exits.filter(
      (listing) => listing.state === "SOLD_TO_NPC",
    ).length;
    marketExpirations += marketResult.exits.filter(
      (listing) => listing.state === "EXPIRED",
    ).length;

    const playerResult = advancePlayerListingsMinute(state, gameTimeMin);
    state = playerResult.state;
    buyerOffers += playerResult.newOffers.length;
    playerListingExpirations += playerResult.expiredListingIds.size;
  }

  const elapsedGameMin = targetGameTimeMin - initial.gameTimeMin;
  const activeCount = activeMarketListings(state).length;
  const depthArrivals =
    elapsedGameMin > 0 && state.ftue.stage === "COMPLETE"
      ? Math.min(
          WORLD_CONFIG.scanArrivalCount,
          Math.max(0, WORLD_CONFIG.minActiveListings - activeCount),
        )
      : 0;
  const requestedArrivals =
    state.ftue.stage === "COMPLETE"
      ? Math.max(options.forceArrivals ?? 0, depthArrivals)
      : 0;
  const arrivalResult = appendArrivals(state, requestedArrivals);
  state = pruneTerminalHistory(arrivalResult.state);

  return {
    state,
    summary: {
      elapsedGameMin,
      arrivals: arrivalResult.arrivals,
      npcSales,
      marketExpirations,
      buyerOffers,
      playerListingExpirations,
    },
  };
}

export function scanMarket(state: GameState): WorldAdvanceResult {
  return advanceWorldTo(
    state,
    state.gameTimeMin + WORLD_CONFIG.scanAdvanceMin,
    { forceArrivals: WORLD_CONFIG.scanArrivalCount },
  );
}

export function effectiveOfflineGameMinutes(wallDeltaMs: number) {
  const wallMinutes = Math.max(0, wallDeltaMs / 60_000);
  const cappedWallMinutes = Math.min(
    wallMinutes,
    WORLD_CONFIG.offlineCapWallMin,
  );
  if (cappedWallMinutes <= WORLD_CONFIG.offlineFullRateMin) {
    return Math.floor(cappedWallMinutes);
  }
  return Math.floor(
    WORLD_CONFIG.offlineFullRateMin +
      (cappedWallMinutes - WORLD_CONFIG.offlineFullRateMin) *
        WORLD_CONFIG.offlineDiminishingRate,
  );
}

export function advanceOffline(
  state: GameState,
  wallClockMs: number,
): WorldAdvanceResult {
  if (state.ftue.stage !== "COMPLETE") {
    return {
      state: {
        ...state,
        lastWallClockMs: Math.max(state.lastWallClockMs, wallClockMs),
      },
      summary: {
        elapsedGameMin: 0,
        arrivals: 0,
        npcSales: 0,
        marketExpirations: 0,
        buyerOffers: 0,
        playerListingExpirations: 0,
      },
    };
  }
  const elapsedGameMin = effectiveOfflineGameMinutes(
    wallClockMs - state.lastWallClockMs,
  );
  const monotonicWallClockMs = Math.max(state.lastWallClockMs, wallClockMs);
  const active = activeMarketListings(state);
  const protectedListing = [...active].sort(
    (left, right) =>
      left.priceMinor / left.instance.fairValueMinor -
      right.priceMinor / right.instance.fairValueMinor,
  )[0];
  const result = advanceWorldTo(state, state.gameTimeMin + elapsedGameMin, {
    maxMarketClosures: Math.floor(
      active.length * WORLD_CONFIG.offlineClosureRatio,
    ),
    protectedListingId: protectedListing?.id,
  });
  const protectedState = {
    ...result.state,
    listings: result.state.listings.map((listing) =>
      isActiveMarketListing(listing) &&
      listing.expiresAtGameMin <= result.state.gameTimeMin
        ? {
            ...listing,
            expiresAtGameMin:
              result.state.gameTimeMin + WORLD_CONFIG.minimumNpcAgeMin + 1,
          }
        : listing,
    ),
  };
  return {
    ...result,
    state: { ...protectedState, lastWallClockMs: monotonicWallClockMs },
  };
}
