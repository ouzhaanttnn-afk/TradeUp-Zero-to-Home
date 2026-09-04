import { WORLD_CONFIG } from "./config";
import { familyById, families } from "../content/families";
import type {
  BuyerOffer,
  CareerEvent,
  Family,
  Listing,
  Negotiation,
  OwnedAsset,
  PlayerListing,
  TransactionJournalEntry,
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
  const configured = familyById(string(source.id));
  if (configured) return configured;
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
    rarity: 1,
    conditionCap: 96,
    attributes: array(source.attributes).map((item, index) => ({
      id: `attribute-${index}`,
      label: string(item),
      type: "CATEGORY" as const,
      options: ["Standart"],
      comparePriority: index + 1,
    })),
    evidence: [
      {
        id: "evidence-0",
        label: "Genel durum",
        claim: "Satıcı beyanı",
        checkedCopy: "Kontrol edildi",
        inspectionKinds: ["PHOTO", "ASK_SELLER", "QUICK_TEST"],
        critical: true,
      },
    ],
    defects: [
      {
        id: "defect-0",
        label: "Gizli sorun",
        severity: "HIGH",
        valuePenaltyBps: 1_200,
        riskSignal: 0.6,
        evidenceId: "evidence-0",
        overlayKey: "warning",
      },
    ],
    variants: [{ id: "standard", label: "Standart", valueFactorBps: 10_000 }],
    preparation: families[0].preparation,
  };
}

function legacyMarketListing(value: unknown) {
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
    seller: string(source.seller, "merchant"),
    urgency: number(source.urgency, 0.5),
    interest: number(source.interest),
    createdAt: number(source.createdAt),
    expiresAt: number(source.expiresAt),
    state: string(source.state, "ACTIVE"),
    seed: integer(source.seed),
  };
}

function legacyCareer(value: unknown) {
  const source = record(value);
  return {
    id: string(source.id, `legacy-career:${number(source.at)}`),
    type: string(source.type, "MILESTONE"),
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

function legacyBuyCosts(career: UnknownRecord[]) {
  const costs = new Map<string, number[]>();
  for (const event of career) {
    if (event.type !== "BUY" || event.amountMinor === undefined) continue;
    const familyName = string(event.label).replace(/ alındı$/, "");
    const values = costs.get(familyName) ?? [];
    values.push(integer(event.amountMinor));
    costs.set(familyName, values);
  }
  return costs;
}

function takeLegacyCost(costs: Map<string, number[]>, familyName: string) {
  return costs.get(familyName)?.pop();
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

function legacyInventoryAsset(value: unknown) {
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

function legacyPlayerListing(value: unknown, buyCosts: Map<string, number[]>) {
  const source = record(value);
  const family = migrateFamily(source.family);
  const listingId = string(source.id, `legacy-player:${family.id}`);
  const assetId = listingId.startsWith("player-")
    ? listingId.slice("player-".length)
    : `asset:${listingId}`;
  const askingPriceMinor = minor(source.price);
  const fairValueMinor = minor(source.fair);
  const purchasePriceMinor =
    takeLegacyCost(buyCosts, family.name) ??
    Math.min(askingPriceMinor, fairValueMinor);
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

export function migrateStateToV3(value: unknown): unknown {
  const source = record(value);
  if (integer(source.version) >= 3) return value;

  const career = array(source.career).map((event) =>
    record(legacyCareer(event)),
  );
  const buyCosts = legacyBuyCosts(career);
  const inventoryAssets = array(source.inventory).map(legacyInventoryAsset);
  for (const asset of inventoryAssets) {
    removeLegacyCost(
      buyCosts,
      asset.instance.family.name,
      asset.purchasePriceMinor,
    );
  }
  const migratedListings = array(source.playerListings).map((item) =>
    legacyPlayerListing(item, buyCosts),
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

  return {
    version: 3,
    cashMinor,
    ownedAssets,
    realizedProfitMinor,
    transactionJournal: [
      {
        id: `migration:v${integer(source.version)}:v3`,
        kind: "MIGRATION",
        gameTime: 0,
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
    listings: array(source.listings).map(legacyMarketListing),
    playerListings: migratedListings.map((item) => item.listing),
    buyerOffers: array(source.buyerOffers).map((value) => {
      const offer = record(value);
      return {
        id: string(offer.id),
        listingId: string(offer.listingId),
        amountMinor: minor(offer.amount),
        buyer: string(offer.buyer),
        expiresAt: number(offer.expiresAt),
      };
    }),
    ...(source.negotiation ? { negotiation: record(source.negotiation) } : {}),
    expertise: record(source.expertise),
    career,
    lastSeenAt: number(source.lastSeenAt),
  };
}

const normalizedGameMinute = (value: unknown, gameTimeMin: number) => {
  const candidate = Math.max(0, integer(value));
  return candidate <= gameTimeMin ? candidate : gameTimeMin;
};

function currentMarketListing(value: unknown, gameTimeMin: number): unknown {
  const source = record(value);
  const legacyCreatedAt = number(source.createdAt);
  const legacyExpiresAt = number(source.expiresAt);
  const lifetimeMin = Math.max(
    1,
    Math.ceil((legacyExpiresAt - legacyCreatedAt) / 60_000),
  );
  const createdAtGameMin =
    source.createdAtGameMin === undefined
      ? gameTimeMin
      : normalizedGameMinute(source.createdAtGameMin, gameTimeMin);
  return {
    id: string(source.id),
    family: migrateFamily(source.family),
    priceMinor: Math.max(0, integer(source.priceMinor)),
    fairValueMinor: Math.max(0, integer(source.fairValueMinor)),
    condition: number(source.condition),
    seller: (string(source.seller, "merchant") ||
      "merchant") as Listing["seller"],
    urgency: number(source.urgency, 0.5),
    interest: number(source.interest),
    createdAtGameMin,
    expiresAtGameMin:
      source.expiresAtGameMin === undefined
        ? createdAtGameMin + lifetimeMin
        : Math.max(createdAtGameMin + 1, integer(source.expiresAtGameMin)),
    ...(source.closedAtGameMin === undefined
      ? {}
      : { closedAtGameMin: integer(source.closedAtGameMin) }),
    ...(source.exitReason === undefined
      ? {}
      : { exitReason: string(source.exitReason) as Listing["exitReason"] }),
    state: (string(source.state, "ACTIVE") || "ACTIVE") as Listing["state"],
    seed: integer(source.seed),
  };
}

function currentOwnedAsset(value: unknown, gameTimeMin: number): OwnedAsset {
  const source = record(value);
  return {
    ...(source as OwnedAsset),
    acquiredAtGameMin: normalizedGameMinute(
      source.acquiredAtGameMin,
      gameTimeMin,
    ),
  };
}

function currentPlayerListing(
  value: unknown,
  gameTimeMin: number,
): PlayerListing {
  const source = record(value);
  const createdAtGameMin = normalizedGameMinute(
    source.createdAtGameMin,
    gameTimeMin,
  );
  return {
    id: string(source.id),
    ownedAssetId: string(source.ownedAssetId),
    askingPriceMinor: Math.max(0, integer(source.askingPriceMinor)),
    interest: number(source.interest),
    createdAtGameMin,
    expiresAtGameMin:
      source.expiresAtGameMin === undefined
        ? createdAtGameMin + WORLD_CONFIG.playerListingLifetimeMin
        : Math.max(createdAtGameMin + 1, integer(source.expiresAtGameMin)),
    state: (string(source.state, "ACTIVE") ||
      "ACTIVE") as PlayerListing["state"],
  };
}

function currentBuyerOffer(
  value: unknown,
  gameTimeMin: number,
  lastWallClockMs: number,
): BuyerOffer {
  const source = record(value);
  const remainingLegacyMin = Math.max(
    1,
    Math.ceil((number(source.expiresAt) - lastWallClockMs) / 60_000),
  );
  return {
    id: string(source.id),
    listingId: string(source.listingId),
    amountMinor: Math.max(0, integer(source.amountMinor)),
    buyer: string(source.buyer),
    expiresAtGameMin:
      source.expiresAtGameMin === undefined
        ? gameTimeMin + remainingLegacyMin
        : Math.max(gameTimeMin + 1, integer(source.expiresAtGameMin)),
  };
}

function currentNegotiation(value: unknown): Negotiation | undefined {
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

function currentCareer(value: unknown, gameTimeMin: number): CareerEvent {
  const source = record(value);
  return {
    id: string(source.id),
    type: (string(source.type, "MILESTONE") ||
      "MILESTONE") as CareerEvent["type"],
    group: "MILESTONES",
    atGameMin: normalizedGameMinute(source.atGameMin ?? source.at, gameTimeMin),
    label: string(source.label),
    ...(source.amountMinor === undefined
      ? {}
      : { amountMinor: integer(source.amountMinor) }),
  };
}

function currentJournal(
  value: unknown,
  gameTimeMin: number,
): TransactionJournalEntry {
  const source = record(value);
  return {
    ...(source as TransactionJournalEntry),
    gameTime: normalizedGameMinute(source.gameTime, gameTimeMin),
  };
}

export function migrateStateToV4(value: unknown): unknown {
  const source = record(value);
  if (integer(source.version) >= 4) return value;
  const gameTimeMin = Math.max(0, integer(source.gameTimeMin));
  const lastWallClockMs = Math.max(
    0,
    number(source.lastWallClockMs, number(source.lastSeenAt)),
  );
  const negotiation = currentNegotiation(source.negotiation);

  const migrated = {
    version: 4,
    cashMinor: Math.max(0, integer(source.cashMinor)),
    ownedAssets: array(source.ownedAssets).map((asset) =>
      currentOwnedAsset(asset, gameTimeMin),
    ),
    realizedProfitMinor: integer(source.realizedProfitMinor),
    transactionJournal: array(source.transactionJournal).map((entry) =>
      currentJournal(entry, gameTimeMin),
    ),
    gameTimeMin,
    seed: integer(source.seed, 90421),
    marketCycle: Math.max(0, integer(source.marketCycle)),
    listings: array(source.listings).map((listing) =>
      currentMarketListing(listing, gameTimeMin),
    ),
    playerListings: array(source.playerListings).map((listing) =>
      currentPlayerListing(listing, gameTimeMin),
    ),
    buyerOffers: array(source.buyerOffers).map((offer) =>
      currentBuyerOffer(offer, gameTimeMin, lastWallClockMs),
    ),
    ...(negotiation ? { negotiation } : {}),
    expertise: Object.fromEntries(
      Object.entries(record(source.expertise)).map(([key, entry]) => [
        key,
        number(entry),
      ]),
    ),
    career: array(source.career).map((event) =>
      currentCareer(event, gameTimeMin),
    ),
    lastWallClockMs,
  };
  return migrated;
}

export function migrateStateToCurrent(value: unknown): unknown {
  return migrateStateToV7(
    migrateStateToV6(
      migrateStateToV5(migrateStateToV4(migrateStateToV3(value))),
    ),
  );
}

export function migrateStateToV7(value: unknown): unknown {
  const source = record(value);
  if (integer(source.version) >= 7) return value;
  const rawExpertise = record(source.expertise);
  const categoryXp = Object.fromEntries(
    Object.entries(rawExpertise)
      .filter((entry) => typeof entry[1] === "number")
      .map(([key, entry]) => [key, Math.max(0, integer(entry))]),
  );
  const career = array(source.career).map((value, index) => {
    const event = record(value);
    return {
      id: string(event.id, `legacy-career:${index}`),
      type: "LEGACY",
      group: "MILESTONES",
      atGameMin: Math.max(0, integer(event.atGameMin ?? event.at)),
      label: string(event.label, "Önceki kariyer kaydı"),
      ...(event.amountMinor === undefined
        ? {}
        : { amountMinor: integer(event.amountMinor) }),
    };
  });
  const ftue = record(source.ftue);
  const homeUnlocked =
    string(ftue.stage) === "COMPLETE" &&
    integer(source.realizedProfitMinor) > 0;
  return {
    ...source,
    version: 7,
    expertise: {
      marketXp: Object.values(categoryXp).reduce(
        (sum, entry) => sum + number(entry),
        0,
      ),
      categoryXp,
      familyActionCounts: {},
      seenActions: [],
    },
    career,
    follow: {
      watchedListingIds: array(source.listings)
        .map(record)
        .filter((listing) => string(listing.state) === "WATCHED")
        .map((listing) => string(listing.id)),
      savedSearches: [],
      missedOpportunities: [],
    },
    home: {
      unlocked: homeUnlocked,
      ...(homeUnlocked
        ? { revealedAtGameMin: Math.max(0, integer(source.gameTimeMin)) }
        : {}),
      purchased: false,
      progressMilestones: [],
    },
    analytics: { enabled: true, events: [] },
  };
}

export function migrateStateToV6(value: unknown): unknown {
  const source = record(value);
  if (integer(source.version) >= 6) return value;
  return {
    ...source,
    version: 6,
    ftue: { stage: "COMPLETE", dismissedStages: [] },
  };
}

function migrateInstance(source: UnknownRecord, fallbackFamily: unknown) {
  const family = migrateFamily(
    record(source.family).id ? source.family : fallbackFamily,
  );
  const rawAttributes = array(source.attributes);
  return {
    family,
    variantId: string(source.variantId, family.variants[0].id),
    fairValueMinor: Math.max(
      0,
      integer(source.fairValueMinor, family.baseValueMinor),
    ),
    condition: number(source.condition, 70),
    attributes: family.attributes.map((definition, index) => ({
      definitionId: definition.id,
      value:
        record(rawAttributes[index]).value ??
        definition.options?.[0] ??
        definition.min ??
        false,
    })),
    evidence: family.evidence.map((definition) => ({
      definitionId: definition.id,
      status: "UNKNOWN" as const,
    })),
    defects: family.defects.map((definition) => ({
      definitionId: definition.id,
      present: false,
      revealed: false,
    })),
    evidenceConfidence: number(source.evidenceConfidence, 0.25),
    liquidityBonusBps: Math.max(0, integer(source.liquidityBonusBps)),
    accessoryComplete: Boolean(source.accessoryComplete),
    preparationHistory: array(source.preparationHistory),
  };
}

export function migrateStateToV5(value: unknown): unknown {
  const source = record(value);
  if (integer(source.version) >= 5) return value;
  const listings = array(source.listings).map((value) => {
    const listing = record(value);
    const family = migrateFamily(listing.family);
    return {
      ...listing,
      familyId: family.id,
      instance: migrateInstance(
        {
          family,
          fairValueMinor: listing.fairValueMinor,
          condition: listing.condition,
        },
        family,
      ),
      family: undefined,
      fairValueMinor: undefined,
      condition: undefined,
    };
  });
  const ownedAssets = array(source.ownedAssets).map((value) => {
    const asset = record(value);
    const instance = record(asset.instance);
    const family = migrateFamily(instance.family);
    return {
      ...asset,
      familyId: string(asset.familyId, family.id),
      instance: migrateInstance(instance, family),
    };
  });
  return { ...source, version: 5, listings, ownedAssets };
}
