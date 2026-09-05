import type {
  AssetId,
  BuyerOffer,
  GameState,
  Listing,
  ListingId,
  OwnedAsset,
  PlayerListing,
  TransactionJournalEntry,
  TransactionKind,
} from "./models";
import { WORLD_CONFIG } from "./config";

type EconomyFailureReason =
  | "INSUFFICIENT_CASH"
  | "HOME_NOT_UNLOCKED"
  | "HOME_ALREADY_PURCHASED"
  | "LISTING_NOT_ACTIVE"
  | "ASSET_NOT_FOUND"
  | "ASSET_NOT_AVAILABLE"
  | "BUYER_OFFER_NOT_FOUND"
  | "COUNTER_NOT_AVAILABLE"
  | "PLAYER_LISTING_NOT_FOUND"
  | "INVALID_AMOUNT";

export type EconomyCommandResult =
  | { ok: true; state: GameState; idempotent: boolean }
  | { ok: false; state: GameState; reason: EconomyFailureReason };

const isOwned = (asset: OwnedAsset) => asset.state !== "SOLD_COMPLETE";

export const bookCostMinor = (asset: OwnedAsset) =>
  asset.purchasePriceMinor +
  asset.preparationCostMinor +
  asset.inspectionCostMinor +
  asset.transparentFeesMinor;

export const activeOwnedAssets = (state: Pick<GameState, "ownedAssets">) =>
  state.ownedAssets.filter(isOwned);

export const inventoryAssets = (state: Pick<GameState, "ownedAssets">) =>
  state.ownedAssets.filter(
    (asset) => asset.state === "IN_INVENTORY" || asset.state === "READY",
  );

export const preparationAssets = (state: Pick<GameState, "ownedAssets">) =>
  state.ownedAssets.filter((asset) =>
    ["IN_INVENTORY", "READY", "PREPARING"].includes(asset.state),
  );

export const activePlayerListings = (
  state: Pick<GameState, "playerListings">,
) => state.playerListings.filter((listing) => listing.state === "ACTIVE");

export const conservativeMarkToMarketMinor = (asset: OwnedAsset) =>
  asset.instance.fairValueMinor;

export const netWorthMinor = (
  state: Pick<GameState, "cashMinor" | "ownedAssets">,
) =>
  Math.round(
    state.cashMinor +
      activeOwnedAssets(state).reduce(
        (sum, asset) => sum + conservativeMarkToMarketMinor(asset),
        0,
      ),
  );

export const activeBookCostMinor = (state: Pick<GameState, "ownedAssets">) =>
  activeOwnedAssets(state).reduce((sum, asset) => sum + asset.bookCostMinor, 0);

export const quoteAssetSale = (asset: OwnedAsset, proceedsMinor: number) => ({
  proceedsMinor,
  bookCostMinor: asset.bookCostMinor,
  profitMinor: proceedsMinor - asset.bookCostMinor,
});

export const quoteAssetExit = (asset: OwnedAsset) => {
  const quickSaleMinor =
    Math.round((asset.instance.fairValueMinor * 0.82) / 1_000) * 1_000;
  const balancedAskingMinor =
    Math.round((asset.instance.fairValueMinor * 1.05) / 1_000) * 1_000;
  return {
    quickSaleMinor,
    balancedAskingMinor,
    quickSaleProfitMinor: quoteAssetSale(asset, quickSaleMinor).profitMinor,
    estimatedPremiumGivenUpMinor: Math.max(
      0,
      balancedAskingMinor - quickSaleMinor,
    ),
  };
};

const hasJournalEntry = (
  state: Pick<GameState, "transactionJournal">,
  id: string,
) => state.transactionJournal.some((entry) => entry.id === id);

const journalEntry = (
  id: string,
  kind: TransactionKind,
  gameTime: number,
  assetId: AssetId | undefined,
  cashDeltaMinor: number,
  costBasisDeltaMinor: number,
  realizedProfitDeltaMinor: number,
  metadata: Record<string, unknown>,
): TransactionJournalEntry => ({
  id,
  kind,
  gameTime,
  assetId,
  cashDeltaMinor,
  costBasisDeltaMinor,
  realizedProfitDeltaMinor,
  metadata,
});

export function purchaseListing(
  state: GameState,
  listing: Listing,
  purchasePriceMinor: number,
  gameTime: number,
): EconomyCommandResult {
  const transactionId = `purchase:${listing.id}`;
  if (hasJournalEntry(state, transactionId)) {
    return { ok: true, state, idempotent: true };
  }
  const currentListing = state.listings.find((item) => item.id === listing.id);
  if (
    !currentListing ||
    (currentListing.state !== "ACTIVE" &&
      currentListing.state !== "WATCHED" &&
      currentListing.state !== "NEGOTIATING")
  ) {
    return { ok: false, state, reason: "LISTING_NOT_ACTIVE" };
  }
  if (!Number.isInteger(purchasePriceMinor) || purchasePriceMinor < 0) {
    return { ok: false, state, reason: "INVALID_AMOUNT" };
  }
  if (state.cashMinor < purchasePriceMinor) {
    return { ok: false, state, reason: "INSUFFICIENT_CASH" };
  }

  const assetId = `asset:${listing.id}`;
  const asset: OwnedAsset = {
    id: assetId,
    familyId: currentListing.familyId,
    sourceListingId: currentListing.id,
    instance: currentListing.instance,
    state: "IN_INVENTORY",
    purchasePriceMinor,
    preparationCostMinor: 0,
    inspectionCostMinor: 0,
    transparentFeesMinor: 0,
    bookCostMinor: purchasePriceMinor,
    acquiredAtGameMin: gameTime,
  };

  return {
    ok: true,
    idempotent: false,
    state: {
      ...state,
      cashMinor: state.cashMinor - purchasePriceMinor,
      ownedAssets: [...state.ownedAssets, asset],
      listings: state.listings.map((item) =>
        item.id === currentListing.id
          ? {
              ...item,
              state: "SOLD_TO_PLAYER" as const,
              closedAtGameMin: gameTime,
            }
          : item,
      ),
      negotiation: undefined,
      follow: {
        ...state.follow,
        watchedListingIds: state.follow.watchedListingIds.filter(
          (id) => id !== currentListing.id,
        ),
      },
      transactionJournal: [
        ...state.transactionJournal,
        journalEntry(
          transactionId,
          "PURCHASE",
          gameTime,
          assetId,
          -purchasePriceMinor,
          purchasePriceMinor,
          0,
          {
            sourceListingId: currentListing.id,
            familyId: currentListing.familyId,
          },
        ),
      ],
    },
  };
}

export function purchaseHome(
  state: GameState,
  purchasePriceMinor: number,
  transactionId: string,
  gameTime: number,
): EconomyCommandResult {
  if (hasJournalEntry(state, transactionId)) {
    return { ok: true, state, idempotent: true };
  }
  if (!state.home.unlocked) {
    return { ok: false, state, reason: "HOME_NOT_UNLOCKED" };
  }
  if (state.home.purchased) {
    return { ok: false, state, reason: "HOME_ALREADY_PURCHASED" };
  }
  if (!Number.isInteger(purchasePriceMinor) || purchasePriceMinor <= 0) {
    return { ok: false, state, reason: "INVALID_AMOUNT" };
  }
  if (state.cashMinor < purchasePriceMinor) {
    return { ok: false, state, reason: "INSUFFICIENT_CASH" };
  }

  return {
    ok: true,
    idempotent: false,
    state: {
      ...state,
      cashMinor: state.cashMinor - purchasePriceMinor,
      home: { ...state.home, purchased: true },
      career: [
        ...state.career,
        {
          id: `career:${transactionId}`,
          type: "HOME_PURCHASE",
          group: "HOME",
          atGameMin: gameTime,
          label: "Kendi evini aldın",
          amountMinor: purchasePriceMinor,
        },
      ],
      transactionJournal: [
        ...state.transactionJournal,
        journalEntry(
          transactionId,
          "HOME_PURCHASE",
          gameTime,
          undefined,
          -purchasePriceMinor,
          0,
          0,
          { purchasePriceMinor },
        ),
      ],
    },
  };
}

export function addAssetCost(
  state: GameState,
  assetId: AssetId,
  kind: "PREPARATION" | "INSPECTION" | "FEE",
  amountMinor: number,
  transactionId: string,
  gameTime: number,
): EconomyCommandResult {
  if (hasJournalEntry(state, transactionId)) {
    return { ok: true, state, idempotent: true };
  }
  if (!Number.isInteger(amountMinor) || amountMinor < 0) {
    return { ok: false, state, reason: "INVALID_AMOUNT" };
  }
  if (state.cashMinor < amountMinor) {
    return { ok: false, state, reason: "INSUFFICIENT_CASH" };
  }
  const asset = state.ownedAssets.find((item) => item.id === assetId);
  if (!asset) return { ok: false, state, reason: "ASSET_NOT_FOUND" };
  if (!isOwned(asset)) {
    return { ok: false, state, reason: "ASSET_NOT_AVAILABLE" };
  }

  const updated: OwnedAsset = {
    ...asset,
    preparationCostMinor:
      asset.preparationCostMinor + (kind === "PREPARATION" ? amountMinor : 0),
    inspectionCostMinor:
      asset.inspectionCostMinor + (kind === "INSPECTION" ? amountMinor : 0),
    transparentFeesMinor:
      asset.transparentFeesMinor + (kind === "FEE" ? amountMinor : 0),
    bookCostMinor: asset.bookCostMinor + amountMinor,
  };

  return {
    ok: true,
    idempotent: false,
    state: {
      ...state,
      cashMinor: state.cashMinor - amountMinor,
      ownedAssets: state.ownedAssets.map((item) =>
        item.id === assetId ? updated : item,
      ),
      transactionJournal: [
        ...state.transactionJournal,
        journalEntry(
          transactionId,
          kind,
          gameTime,
          assetId,
          -amountMinor,
          amountMinor,
          0,
          {},
        ),
      ],
    },
  };
}

export function createPlayerListing(
  state: GameState,
  assetId: AssetId,
  askingPriceMinor: number,
  gameTime: number,
): EconomyCommandResult {
  const listingId = `player:${assetId}:${gameTime}`;
  const transactionId = `listing:${listingId}`;
  if (hasJournalEntry(state, transactionId)) {
    return { ok: true, state, idempotent: true };
  }
  if (!Number.isInteger(askingPriceMinor) || askingPriceMinor < 0) {
    return { ok: false, state, reason: "INVALID_AMOUNT" };
  }
  const asset = state.ownedAssets.find((item) => item.id === assetId);
  if (!asset) return { ok: false, state, reason: "ASSET_NOT_FOUND" };
  if (asset.state !== "IN_INVENTORY" && asset.state !== "READY") {
    return { ok: false, state, reason: "ASSET_NOT_AVAILABLE" };
  }

  const playerListing: PlayerListing = {
    id: listingId,
    ownedAssetId: asset.id,
    askingPriceMinor,
    interest: 0,
    createdAtGameMin: gameTime,
    expiresAtGameMin: gameTime + WORLD_CONFIG.playerListingLifetimeMin,
    state: "ACTIVE",
  };

  return {
    ok: true,
    idempotent: false,
    state: {
      ...state,
      ownedAssets: state.ownedAssets.map((item) =>
        item.id === assetId
          ? { ...item, state: "LISTED", currentListingId: listingId }
          : item,
      ),
      playerListings: [...state.playerListings, playerListing],
      transactionJournal: [
        ...state.transactionJournal,
        journalEntry(transactionId, "LISTING", gameTime, assetId, 0, 0, 0, {
          listingId,
          askingPriceMinor,
        }),
      ],
    },
  };
}

export function withdrawPlayerListing(
  state: GameState,
  listingId: ListingId,
  gameTime: number,
): EconomyCommandResult {
  const transactionId = `withdraw:${listingId}`;
  if (hasJournalEntry(state, transactionId)) {
    return { ok: true, state, idempotent: true };
  }
  const listing = state.playerListings.find((item) => item.id === listingId);
  if (!listing || listing.state !== "ACTIVE") {
    return { ok: false, state, reason: "PLAYER_LISTING_NOT_FOUND" };
  }
  const asset = state.ownedAssets.find(
    (item) => item.id === listing.ownedAssetId,
  );
  if (!asset) return { ok: false, state, reason: "ASSET_NOT_FOUND" };
  if (asset.state !== "LISTED" || asset.currentListingId !== listingId) {
    return { ok: false, state, reason: "ASSET_NOT_AVAILABLE" };
  }

  return {
    ok: true,
    idempotent: false,
    state: {
      ...state,
      ownedAssets: state.ownedAssets.map((asset) =>
        asset.id === listing.ownedAssetId
          ? { ...asset, state: "IN_INVENTORY", currentListingId: undefined }
          : asset,
      ),
      playerListings: state.playerListings.map((item) =>
        item.id === listingId ? { ...item, state: "WITHDRAWN" } : item,
      ),
      buyerOffers: state.buyerOffers.filter(
        (offer) => offer.listingId !== listingId,
      ),
      transactionJournal: [
        ...state.transactionJournal,
        journalEntry(
          transactionId,
          "LISTING",
          gameTime,
          listing.ownedAssetId,
          0,
          0,
          0,
          {
            listingId,
            action: "WITHDRAWN",
          },
        ),
      ],
    },
  };
}

export function rejectBuyerOffer(
  state: GameState,
  offerId: string,
): EconomyCommandResult {
  const offer = state.buyerOffers.find((item) => item.id === offerId);
  if (!offer) return { ok: false, state, reason: "BUYER_OFFER_NOT_FOUND" };
  const listing = state.playerListings.find(
    (item) => item.id === offer.listingId,
  );
  if (!listing || listing.state !== "ACTIVE") {
    return { ok: false, state, reason: "PLAYER_LISTING_NOT_FOUND" };
  }

  return {
    ok: true,
    idempotent: false,
    state: {
      ...state,
      buyerOffers: state.buyerOffers.filter((item) => item.id !== offerId),
    },
  };
}

export const buyerCounterMinor = (
  offer: Pick<BuyerOffer, "amountMinor">,
  listing: Pick<PlayerListing, "askingPriceMinor">,
) => {
  if (listing.askingPriceMinor <= offer.amountMinor) return undefined;
  const midpoint = Math.round(
    (offer.amountMinor + listing.askingPriceMinor) / 2_000,
  );
  return Math.min(
    listing.askingPriceMinor,
    Math.max(offer.amountMinor + 1_000, midpoint * 1_000),
  );
};

export type BuyerCounterResult =
  | {
      ok: true;
      state: GameState;
      outcome: "ACCEPTED" | "FINAL" | "WITHDREW";
      amountMinor: number;
      transactionId?: string;
    }
  | { ok: false; state: GameState; reason: EconomyFailureReason };

const stableTextHash = (value: string) => {
  let hash = 2_166_136_261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
};

export function counterBuyerOffer(
  state: GameState,
  offerId: string,
  counterMinor: number,
  gameTime: number,
): BuyerCounterResult {
  const offer = state.buyerOffers.find((item) => item.id === offerId);
  if (!offer) return { ok: false, state, reason: "BUYER_OFFER_NOT_FOUND" };
  const listing = state.playerListings.find(
    (item) => item.id === offer.listingId,
  );
  if (!listing || listing.state !== "ACTIVE") {
    return { ok: false, state, reason: "PLAYER_LISTING_NOT_FOUND" };
  }
  if (
    offer.counterUsed ||
    offer.expiresAtGameMin <= gameTime ||
    listing.expiresAtGameMin <= gameTime
  ) {
    return { ok: false, state, reason: "COUNTER_NOT_AVAILABLE" };
  }
  if (
    !Number.isInteger(counterMinor) ||
    counterMinor <= offer.amountMinor ||
    counterMinor > listing.askingPriceMinor
  ) {
    return { ok: false, state, reason: "INVALID_AMOUNT" };
  }

  const roll = (state.seed + stableTextHash(offer.id)) % 100;
  if (roll < 45) {
    const transactionId = `sale:buyer-counter:${offer.id}`;
    const settled = settleAssetSale(
      state,
      listing.ownedAssetId,
      counterMinor,
      transactionId,
      gameTime,
      listing.id,
    );
    if (!settled.ok) return settled;
    return {
      ok: true,
      state: settled.state,
      outcome: "ACCEPTED",
      amountMinor: counterMinor,
      transactionId,
    };
  }
  if (roll < 80) {
    const finalMinor = Math.max(
      offer.amountMinor + 1_000,
      Math.round(
        (offer.amountMinor + (counterMinor - offer.amountMinor) * 0.55) / 1_000,
      ) * 1_000,
    );
    return {
      ok: true,
      state: {
        ...state,
        buyerOffers: state.buyerOffers.map((item) =>
          item.id === offerId
            ? {
                ...item,
                initialAmountMinor: item.amountMinor,
                amountMinor: Math.min(counterMinor, finalMinor),
                counterUsed: true,
              }
            : item,
        ),
      },
      outcome: "FINAL",
      amountMinor: Math.min(counterMinor, finalMinor),
    };
  }
  return {
    ok: true,
    state: {
      ...state,
      buyerOffers: state.buyerOffers.filter((item) => item.id !== offerId),
    },
    outcome: "WITHDREW",
    amountMinor: counterMinor,
  };
}

export function settleAssetSale(
  state: GameState,
  assetId: AssetId,
  proceedsMinor: number,
  transactionId: string,
  gameTime: number,
  listingId?: ListingId,
): EconomyCommandResult {
  if (hasJournalEntry(state, transactionId)) {
    return { ok: true, state, idempotent: true };
  }
  if (!Number.isInteger(proceedsMinor) || proceedsMinor < 0) {
    return { ok: false, state, reason: "INVALID_AMOUNT" };
  }
  const asset = state.ownedAssets.find((item) => item.id === assetId);
  if (!asset) return { ok: false, state, reason: "ASSET_NOT_FOUND" };
  if (!isOwned(asset)) {
    return { ok: false, state, reason: "ASSET_NOT_AVAILABLE" };
  }
  if (listingId && asset.currentListingId !== listingId) {
    return { ok: false, state, reason: "PLAYER_LISTING_NOT_FOUND" };
  }

  const { profitMinor } = quoteAssetSale(asset, proceedsMinor);
  return {
    ok: true,
    idempotent: false,
    state: {
      ...state,
      cashMinor: state.cashMinor + proceedsMinor,
      realizedProfitMinor: state.realizedProfitMinor + profitMinor,
      ownedAssets: state.ownedAssets.map((item) =>
        item.id === assetId
          ? { ...item, state: "SOLD_COMPLETE", currentListingId: undefined }
          : item,
      ),
      playerListings: listingId
        ? state.playerListings.map((item) =>
            item.id === listingId ? { ...item, state: "SOLD_COMPLETE" } : item,
          )
        : state.playerListings,
      buyerOffers: listingId
        ? state.buyerOffers.filter((offer) => offer.listingId !== listingId)
        : state.buyerOffers,
      transactionJournal: [
        ...state.transactionJournal,
        journalEntry(
          transactionId,
          "SALE",
          gameTime,
          assetId,
          proceedsMinor,
          -asset.bookCostMinor,
          profitMinor,
          {
            listingId,
            proceedsMinor,
            bookCostMinor: asset.bookCostMinor,
            profitMinor,
          },
        ),
      ],
    },
  };
}

export const journalTotals = (state: Pick<GameState, "transactionJournal">) =>
  state.transactionJournal.reduce(
    (totals, entry) => ({
      cashMinor: totals.cashMinor + entry.cashDeltaMinor,
      activeBookCostMinor:
        totals.activeBookCostMinor + entry.costBasisDeltaMinor,
      realizedProfitMinor:
        totals.realizedProfitMinor + entry.realizedProfitDeltaMinor,
    }),
    { cashMinor: 0, activeBookCostMinor: 0, realizedProfitMinor: 0 },
  );

export const reconcileJournal = (state: GameState) => {
  const totals = journalTotals(state);
  return {
    cash: totals.cashMinor === state.cashMinor,
    activeBookCost: totals.activeBookCostMinor === activeBookCostMinor(state),
    realizedProfit: totals.realizedProfitMinor === state.realizedProfitMinor,
  };
};
