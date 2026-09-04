import type {
  AssetId,
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
  | "LISTING_NOT_ACTIVE"
  | "ASSET_NOT_FOUND"
  | "ASSET_NOT_AVAILABLE"
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

export const quoteAssetExit = (asset: OwnedAsset) => ({
  quickSaleMinor:
    Math.round((asset.instance.fairValueMinor * 0.82) / 1_000) * 1_000,
  balancedAskingMinor:
    Math.round((asset.instance.fairValueMinor * 1.05) / 1_000) * 1_000,
});

export const listingEstimateBand = (listing: Listing) => ({
  lowMinor: Math.round(listing.fairValueMinor * 0.9),
  highMinor: Math.round(listing.fairValueMinor * 1.1),
});

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
    familyId: currentListing.family.id,
    sourceListingId: currentListing.id,
    instance: {
      family: currentListing.family,
      fairValueMinor: currentListing.fairValueMinor,
      condition: currentListing.condition,
    },
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
            familyId: currentListing.family.id,
          },
        ),
      ],
      career: [
        ...state.career,
        {
          id: `career:${transactionId}`,
          type: "BUY",
          atGameMin: gameTime,
          label: `${currentListing.family.name} alındı`,
          amountMinor: purchasePriceMinor,
        },
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

  const profitMinor = proceedsMinor - asset.bookCostMinor;
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
      career: [
        ...state.career,
        {
          id: `career:${transactionId}`,
          type: "SALE",
          atGameMin: gameTime,
          label: `${asset.instance.family.name} satıldı`,
          amountMinor: profitMinor,
        },
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
