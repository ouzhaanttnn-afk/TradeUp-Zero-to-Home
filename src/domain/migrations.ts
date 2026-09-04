import type {
  BuyerOffer,
  CareerEvent,
  Family,
  GameState,
  Listing,
  Negotiation,
  OwnedAsset,
  PlayerListing,
} from "./models";

type UnknownRecord = Record<string, unknown>;

const record = (value: unknown): UnknownRecord =>
  value !== null && typeof value === "object" ? (value as UnknownRecord) : {};
const array = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];
const number = (value: unknown, fallback = 0) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;
const integer = (value: unknown, fallback = 0) =>
  Math.round(number(value, fallback));
const string = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;
const minor = (value: unknown) => Math.max(0, Math.round(number(value) * 100));

function migrateFamily(value: unknown): Family {
  const source = record(value);
  return {
    id: string(source.id, "legacy-family"),
    name: string(source.name, "Bilinmeyen ürün"),
    assetKey: string(source.assetKey, "missing"),
    baseValueMinor:
      source.baseValueMinor === undefined
        ? minor(source.base)
        : Math.max(0, integer(source.baseValueMinor)),
    demand: number(source.demand, 0.5),
    liquidity: number(source.liquidity, 0.5),
    category: string(source.category, "Diğer"),
    tier: Math.max(0, integer(source.tier)),
    attributes: array(source.attributes).map((item) => string(item)),
  };
}

function migrateMarketListing(value: unknown): Listing {
  const source = record(value);
  return {
    id: string(source.id),
    family: migrateFamily(source.family),
    priceMinor:
      source.priceMinor === undefined
        ? minor(source.price)
        : Math.max(0, integer(source.priceMinor)),
    fairValueMinor:
      source.fairValueMinor === undefined
        ? minor(source.fair)
        : Math.max(0, integer(source.fairValueMinor)),
    condition: number(source.condition),
    seller: (string(source.seller, "merchant") ||
      "merchant") as Listing["seller"],
    urgency: number(source.urgency, 0.5),
    interest: number(source.interest),
    createdAt: number(source.createdAt),
    expiresAt: number(source.expiresAt),
    state: (string(source.state, "ACTIVE") || "ACTIVE") as Listing["state"],
    seed: integer(source.seed),
  };
}

function migrateCareer(value: unknown): CareerEvent {
  const source = record(value);
  return {
    id: string(source.id, `legacy-career:${number(source.at)}`),
    type: (string(source.type, "MILESTONE") ||
      "MILESTONE") as CareerEvent["type"],
    at: number(source.at),
    label: string(source.label),
    ...(source.amount === undefined && source.amountMinor === undefined
      ? {}
      : {
          amountMinor:
            source.amountMinor === undefined
              ? Math.round(number(source.amount) * 100)
              : integer(source.amountMinor),
        }),
  };
}

function legacyBuyCosts(career: CareerEvent[]) {
  const costs = new Map<string, number[]>();
  for (const event of career) {
    if (event.type !== "BUY" || event.amountMinor === undefined) continue;
    const familyName = event.label.replace(/ alındı$/, "");
    const values = costs.get(familyName) ?? [];
    values.push(event.amountMinor);
    costs.set(familyName, values);
  }
  return costs;
}

function takeLegacyCost(costs: Map<string, number[]>, familyName: string) {
  const values = costs.get(familyName);
  return values?.pop();
}

function removeLegacyCost(
  costs: Map<string, number[]>,
  familyName: string,
  amountMinor: number,
) {
  const values = costs.get(familyName);
  if (!values) return;
  const index = values.lastIndexOf(amountMinor);
  if (index >= 0) values.splice(index, 1);
}

function migrateInventoryAsset(value: unknown): OwnedAsset {
  const source = record(value);
  const family = migrateFamily(source.family);
  const purchasePriceMinor = minor(source.paid);
  const id = string(source.id, `legacy-asset:${family.id}`);
  return {
    id,
    familyId: family.id,
    sourceListingId: `legacy:${id}`,
    instance: {
      family,
      fairValueMinor: minor(source.fair),
      condition: number(source.condition),
    },
    state: "IN_INVENTORY",
    purchasePriceMinor,
    preparationCostMinor: 0,
    inspectionCostMinor: 0,
    transparentFeesMinor: 0,
    bookCostMinor: purchasePriceMinor,
    acquiredAtGameMin: number(source.acquiredAt),
  };
}

function migrateLegacyPlayerListing(
  value: unknown,
  buyCosts: Map<string, number[]>,
): { asset: OwnedAsset; listing: PlayerListing } {
  const source = record(value);
  const family = migrateFamily(source.family);
  const listingId = string(source.id, `legacy-player:${family.id}`);
  const assetId = listingId.startsWith("player-")
    ? listingId.slice("player-".length)
    : `asset:${listingId}`;
  const askingPriceMinor = minor(source.price);
  const fairValueMinor = minor(source.fair);
  const matchedPurchaseMinor = takeLegacyCost(buyCosts, family.name);
  const purchasePriceMinor =
    matchedPurchaseMinor ?? Math.min(askingPriceMinor, fairValueMinor);
  return {
    asset: {
      id: assetId,
      familyId: family.id,
      sourceListingId: `legacy:${assetId}`,
      instance: {
        family,
        fairValueMinor,
        condition: number(source.condition),
      },
      state: "LISTED",
      purchasePriceMinor,
      preparationCostMinor: 0,
      inspectionCostMinor: 0,
      transparentFeesMinor: 0,
      bookCostMinor: purchasePriceMinor,
      acquiredAtGameMin: number(source.createdAt),
      currentListingId: listingId,
    },
    listing: {
      id: listingId,
      ownedAssetId: assetId,
      askingPriceMinor,
      interest: number(source.interest),
      createdAtGameMin: number(source.createdAt),
      state: "ACTIVE",
    },
  };
}

function migrateBuyerOffer(value: unknown): BuyerOffer {
  const source = record(value);
  return {
    id: string(source.id),
    listingId: string(source.listingId),
    amountMinor:
      source.amountMinor === undefined
        ? minor(source.amount)
        : Math.max(0, integer(source.amountMinor)),
    buyer: string(source.buyer),
    expiresAt: number(source.expiresAt),
  };
}

function migrateNegotiation(value: unknown): Negotiation | undefined {
  if (value === undefined) return undefined;
  const source = record(value);
  const remaining = Math.max(
    0,
    Math.min(2, integer(source.offersRemaining, 2)),
  );
  return {
    listingId: string(source.listingId),
    offersRemaining: remaining as 0 | 1 | 2,
    sellerFloorMinor:
      source.sellerFloorMinor === undefined
        ? minor(source.sellerFloor)
        : Math.max(0, integer(source.sellerFloorMinor)),
    ...(source.counter === undefined && source.counterMinor === undefined
      ? {}
      : {
          counterMinor:
            source.counterMinor === undefined
              ? minor(source.counter)
              : Math.max(0, integer(source.counterMinor)),
        }),
    closed: Boolean(source.closed),
  };
}

export function migrateStateToV3(value: unknown): unknown {
  const source = record(value);
  if (source.version === 3) return value;

  const career = array(source.career).map(migrateCareer);
  const buyCosts = legacyBuyCosts(career);
  const inventoryAssets = array(source.inventory).map(migrateInventoryAsset);
  for (const asset of inventoryAssets) {
    removeLegacyCost(
      buyCosts,
      asset.instance.family.name,
      asset.purchasePriceMinor,
    );
  }
  const migratedListings = array(source.playerListings).map((item) =>
    migrateLegacyPlayerListing(item, buyCosts),
  );
  const ownedAssets = [
    ...inventoryAssets,
    ...migratedListings.map((item) => item.asset),
  ];
  const cashMinor = minor(source.cash);
  const realizedProfitMinor = Math.round(number(source.realizedProfit) * 100);
  const activeBookCostMinor = ownedAssets.reduce(
    (total, asset) => total + asset.bookCostMinor,
    0,
  );
  const negotiation = migrateNegotiation(source.negotiation);

  const migrated: GameState = {
    version: 3,
    cashMinor,
    ownedAssets,
    realizedProfitMinor,
    transactionJournal: [
      {
        id: `migration:v${integer(source.version)}:v3`,
        kind: "MIGRATION",
        gameTime: number(source.lastSeenAt),
        cashDeltaMinor: cashMinor,
        costBasisDeltaMinor: activeBookCostMinor,
        realizedProfitDeltaMinor: realizedProfitMinor,
        metadata: {
          fromVersion: integer(source.version),
          listedAssetsRecovered: migratedListings.length,
          unmatchedListedCostsUseConservativeEstimate: true,
        },
      },
    ],
    seed: integer(source.seed, 90421),
    marketCycle: Math.max(0, integer(source.marketCycle)),
    listings: array(source.listings).map(migrateMarketListing),
    playerListings: migratedListings.map((item) => item.listing),
    buyerOffers: array(source.buyerOffers).map(migrateBuyerOffer),
    ...(negotiation ? { negotiation } : {}),
    expertise: Object.fromEntries(
      Object.entries(record(source.expertise)).map(([key, entry]) => [
        key,
        number(entry),
      ]),
    ),
    career,
    lastSeenAt: number(source.lastSeenAt, Date.now()),
  };
  return migrated;
}
