import { z } from "zod";
import { families } from "./content/families";
import { netWorthMinor } from "./domain/economy";
import type {
  AttributeDefinition,
  GameState,
  ItemAttribute,
  ItemInstance,
  Listing,
  SellerKind,
} from "./domain/models";

export type {
  BuyerOffer,
  CareerEvent,
  Family,
  GameState,
  Listing,
  Negotiation,
  OwnedAsset,
  PlayerListing,
  SellerKind,
  TransactionJournalEntry,
} from "./domain/models";
export { families } from "./content/families";
export const SAVE_VERSION = 11;
export const HOME_GOAL_MINOR = 350_000_000;

const attributeDefinitionSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(["NUMBER", "CATEGORY", "BOOLEAN", "YEAR", "RANGE"]),
  unit: z.string().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().optional(),
  options: z.array(z.string()).optional(),
  comparePriority: z.number(),
});
const evidenceDefinitionSchema = z.object({
  id: z.string(),
  label: z.string(),
  claim: z.string(),
  checkedCopy: z.string(),
  inspectionKinds: z.array(z.enum(["PHOTO", "ASK_SELLER", "QUICK_TEST"])),
  critical: z.boolean(),
});
const preparationDefinitionSchema = z.object({
  kind: z.enum(["CLEAN", "TEST", "COMPLETE"]),
  label: z.string(),
  costMinor: z.number().int().nonnegative(),
  durationMin: z.number().int().nonnegative(),
  conditionGain: z.number(),
  confidenceGain: z.number(),
  valueGainBps: z.number(),
  liquidityGainBps: z.number(),
  maxUses: z.number().int().positive(),
});
const familySchema = z.object({
  id: z.string(),
  name: z.string(),
  assetKey: z.string(),
  baseValueMinor: z.number().int().nonnegative(),
  demand: z.number(),
  liquidity: z.number(),
  category: z.string(),
  tier: z.number().int().nonnegative(),
  rarity: z.number(),
  conditionCap: z.number(),
  attributes: z.array(attributeDefinitionSchema),
  evidence: z.array(evidenceDefinitionSchema),
  defects: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      severity: z.enum(["LOW", "MEDIUM", "HIGH"]),
      valuePenaltyBps: z.number(),
      riskSignal: z.number(),
      evidenceId: z.string(),
      overlayKey: z.string(),
    }),
  ),
  variants: z.array(
    z.object({ id: z.string(), label: z.string(), valueFactorBps: z.number() }),
  ),
  preparation: z.array(preparationDefinitionSchema),
});
const itemInstanceSchema = z.object({
  family: familySchema,
  variantId: z.string(),
  fairValueMinor: z.number().int().nonnegative(),
  condition: z.number(),
  attributes: z.array(
    z.object({
      definitionId: z.string(),
      value: z.union([z.number(), z.string(), z.boolean()]),
    }),
  ),
  evidence: z.array(
    z.object({
      definitionId: z.string(),
      status: z.enum([
        "VISIBLE",
        "CLAIMED",
        "SUSPICIOUS",
        "CHECKED",
        "VERIFIED",
        "UNKNOWN",
      ]),
    }),
  ),
  defects: z.array(
    z.object({
      definitionId: z.string(),
      present: z.boolean(),
      revealed: z.boolean(),
    }),
  ),
  evidenceConfidence: z.number().min(0).max(1),
  liquidityBonusBps: z.number().int().nonnegative(),
  accessoryComplete: z.boolean(),
  preparationHistory: z.array(
    z.object({
      id: z.string(),
      kind: z.enum(["CLEAN", "TEST", "COMPLETE"]),
      state: z.enum(["IN_PROGRESS", "COMPLETE"]),
      startedAtGameMin: z.number().int().nonnegative(),
      completesAtGameMin: z.number().int().nonnegative(),
      costMinor: z.number().int().nonnegative(),
    }),
  ),
});
const listingSchema = z.object({
  id: z.string(),
  familyId: z.string(),
  instance: itemInstanceSchema,
  priceMinor: z.number().int().nonnegative(),
  seller: z.enum([
    "urgent",
    "expert",
    "uninformed",
    "emotional",
    "merchant",
    "risky",
  ]),
  urgency: z.number(),
  interest: z.number(),
  createdAtGameMin: z.number().int().nonnegative(),
  expiresAtGameMin: z.number().int().nonnegative(),
  closedAtGameMin: z.number().int().nonnegative().optional(),
  exitReason: z.enum(["NPC_PURCHASE", "EXPIRED"]).optional(),
  state: z.enum([
    "ACTIVE",
    "WATCHED",
    "NEGOTIATING",
    "SOLD_TO_PLAYER",
    "SOLD_TO_NPC",
    "EXPIRED",
    "WITHDRAWN",
  ]),
  seed: z.number().int(),
});
const ownedAssetSchema = z
  .object({
    id: z.string(),
    familyId: z.string(),
    sourceListingId: z.string(),
    instance: itemInstanceSchema,
    state: z.enum([
      "IN_INVENTORY",
      "PREPARING",
      "READY",
      "LISTED",
      "RESERVED",
      "SOLD_PENDING",
      "SOLD_COMPLETE",
    ]),
    purchasePriceMinor: z.number().int().nonnegative(),
    preparationCostMinor: z.number().int().nonnegative(),
    inspectionCostMinor: z.number().int().nonnegative(),
    transparentFeesMinor: z.number().int().nonnegative(),
    bookCostMinor: z.number().int().nonnegative(),
    acquiredAtGameMin: z.number().int().nonnegative(),
    currentListingId: z.string().optional(),
  })
  .refine(
    (asset) =>
      asset.bookCostMinor ===
      asset.purchasePriceMinor +
        asset.preparationCostMinor +
        asset.inspectionCostMinor +
        asset.transparentFeesMinor,
    { message: "bookCostMinor must equal every capitalized asset cost" },
  );
const playerListingSchema = z.object({
  id: z.string(),
  ownedAssetId: z.string(),
  askingPriceMinor: z.number().int().nonnegative(),
  interest: z.number(),
  createdAtGameMin: z.number().int().nonnegative(),
  expiresAtGameMin: z.number().int().nonnegative(),
  state: z.enum([
    "ACTIVE",
    "RESERVED",
    "SOLD_PENDING",
    "SOLD_COMPLETE",
    "WITHDRAWN",
    "EXPIRED",
  ]),
});
const buyerOfferSchema = z.object({
  id: z.string(),
  listingId: z.string(),
  amountMinor: z.number().int().nonnegative(),
  buyer: z.string(),
  expiresAtGameMin: z.number().int().nonnegative(),
});
const journalEntrySchema = z.object({
  id: z.string(),
  kind: z.enum([
    "OPENING_BALANCE",
    "MIGRATION",
    "PURCHASE",
    "PREPARATION",
    "INSPECTION",
    "FEE",
    "LISTING",
    "RESERVATION",
    "SALE",
    "REFUND",
    "REWARD",
  ]),
  gameTime: z.number().int().nonnegative(),
  assetId: z.string().optional(),
  cashDeltaMinor: z.number().int(),
  costBasisDeltaMinor: z.number().int(),
  realizedProfitDeltaMinor: z.number().int(),
  metadata: z.record(z.string(), z.unknown()),
});
const careerEventSchema = z.object({
  id: z.string(),
  type: z.enum([
    "FIRST_SALE",
    "FIRST_PROFITABLE_SALE",
    "BEST_FLIP_UPDATED",
    "VALUE_ADDED_RECORD",
    "WEALTH_MILESTONE",
    "EXPERTISE_MILESTONE",
    "FIRST_HIGH_TICKET_TRADE",
    "DOMINANT_CATEGORY_CHANGED",
    "HOME_PROGRESS",
    "HOME_PURCHASE",
    "LEGACY",
  ]),
  group: z.enum(["FIRSTS", "RECORDS", "MILESTONES", "HOME"]),
  atGameMin: z.number().int().nonnegative(),
  label: z.string(),
  amountMinor: z.number().int().optional(),
  familyId: z.string().optional(),
  assetKey: z.string().optional(),
  buyPriceMinor: z.number().int().nonnegative().optional(),
  sellPriceMinor: z.number().int().nonnegative().optional(),
  realizedProfitMinor: z.number().int().optional(),
  preparationValueMinor: z.number().int().nonnegative().optional(),
  wealthAtEventMinor: z.number().int().nonnegative().optional(),
});
const expertiseSchema = z.object({
  marketXp: z.number().int().nonnegative(),
  categoryXp: z.record(z.string(), z.number().int().nonnegative()),
  familyActionCounts: z.record(z.string(), z.number().int().nonnegative()),
  seenActions: z.array(z.string()),
});
const followSchema = z.object({
  watchedListingIds: z.array(z.string()),
  savedSearches: z.array(
    z.object({
      id: z.string(),
      familyId: z.string(),
      maxPriceMinor: z.number().int().nonnegative(),
      minCondition: z.number().min(0).max(100),
      evidencePreference: z.enum(["ANY", "CHECKED"]),
      createdAtGameMin: z.number().int().nonnegative(),
    }),
  ),
  missedOpportunities: z.array(
    z.object({
      id: z.string(),
      listingId: z.string(),
      familyId: z.string(),
      familyName: z.string(),
      assetKey: z.string(),
      priceMinor: z.number().int().nonnegative(),
      condition: z.number().min(0).max(100),
      reason: z.enum(["NPC_PURCHASE", "EXPIRED"]),
      atGameMin: z.number().int().nonnegative(),
    }),
  ),
});
const homeSchema = z.object({
  unlocked: z.boolean(),
  revealedAtGameMin: z.number().int().nonnegative().optional(),
  purchased: z.boolean(),
  progressMilestones: z.array(
    z.union([z.literal(25), z.literal(50), z.literal(75), z.literal(90)]),
  ),
});
const analyticsSchema = z.object({
  enabled: z.boolean(),
  events: z.array(
    z.object({
      id: z.string(),
      name: z.enum([
        "listing_impression",
        "listing_open",
        "compare_started",
        "evidence_action",
        "offer_submitted",
        "purchase_complete",
        "preparation_started",
        "listing_created",
        "buyer_offer",
        "sale_complete",
        "opportunity_lost",
        "career_timeline_opened",
        "reward_request_started",
        "reward_request_failed",
        "reward_loaded",
        "reward_applied",
        "reward_closed_early",
        "premium_claim_used",
        "iap_opened",
        "iap_purchase_started",
        "iap_purchase_completed",
        "iap_restore_started",
        "iap_restore_completed",
      ]),
      atGameMin: z.number().int().nonnegative(),
      properties: z.record(
        z.string(),
        z.union([z.string(), z.number(), z.boolean()]),
      ),
    }),
  ),
});
const accessibilitySchema = z.object({
  hapticsEnabled: z.boolean(),
  reducedMotion: z.boolean(),
  largeText: z.boolean(),
  soundLevel: z.enum(["OFF", "LOW", "NORMAL"]),
});
const rewardTransactionSchema = z.object({
  id: z.string(),
  placementId: z.enum([
    "MARKET_SCOUT",
    "FAST_INSPECTION",
    "FAST_PREPARATION",
    "LISTING_REACH",
  ]),
  source: z.enum(["ad", "premium"]),
  status: z.enum(["REQUESTED", "APPLIED", "CANCELLED", "FAILED"]),
  requestedAt: z.number().int().nonnegative(),
  appliedAt: z.number().int().nonnegative().optional(),
  targetId: z.string().optional(),
});
const entitlementSchema = z.object({
  productId: z.string(),
  entitlementId: z.string(),
  status: z.enum(["PENDING", "OWNED", "REVOKED"]),
  platform: z.enum(["ios", "android", "web"]),
  purchasedAtGameMin: z.number().int().nonnegative().optional(),
  verifiedAtGameMin: z.number().int().nonnegative().optional(),
});
const monetizationSchema = z.object({
  entitlements: z.array(entitlementSchema),
  consent: z.object({
    adPersonalizationAllowed: z.boolean(),
    adsServedWithConsent: z.boolean(),
    canRequestAds: z.boolean(),
    updatedAtGameMin: z.number().int().nonnegative(),
  }),
  usage: z.object({
    rewardSessionStartedAt: z.number().int().nonnegative(),
    sessionRewardCount: z.number().int().nonnegative(),
    rollingRewardTimestamps: z.array(z.number().int().nonnegative()),
    placementUsage: z.record(
      z.enum([
        "MARKET_SCOUT",
        "FAST_INSPECTION",
        "FAST_PREPARATION",
        "LISTING_REACH",
      ]),
      z.array(z.number().int().nonnegative()),
    ),
  }),
  firstSaleComplete: z.boolean(),
  lifetimeActivePlayMinutes: z.number().int().nonnegative(),
  rewardCooldownUntilGameMin: z.number().nonnegative().optional(),
  rewardTransactions: z.array(rewardTransactionSchema),
});
const negotiationSchema = z.object({
  listingId: z.string(),
  offersRemaining: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  sellerFloorMinor: z.number().int().nonnegative(),
  counterMinor: z.number().int().nonnegative().optional(),
  closed: z.boolean(),
});
const ftueStageSchema = z.enum([
  "STARTING_SALE",
  "COMPARE",
  "EVIDENCE",
  "NEGOTIATION",
  "PREPARATION",
  "LISTING",
  "BUYER_SALE",
  "COMPLETE",
]);
const ftueSchema = z.object({
  stage: ftueStageSchema,
  dismissedStages: z.array(ftueStageSchema),
  firstAssetId: z.string().optional(),
  firstPlayerListingId: z.string().optional(),
});

const stateSchema = z
  .object({
    version: z.literal(SAVE_VERSION),
    cashMinor: z.number().int().nonnegative(),
    ownedAssets: z.array(ownedAssetSchema),
    realizedProfitMinor: z.number().int(),
    transactionJournal: z.array(journalEntrySchema),
    gameTimeMin: z.number().int().nonnegative(),
    seed: z.number().int(),
    marketCycle: z.number().int().nonnegative(),
    listings: z.array(listingSchema),
    playerListings: z.array(playerListingSchema),
    buyerOffers: z.array(buyerOfferSchema),
    negotiation: negotiationSchema.optional(),
    expertise: expertiseSchema,
    career: z.array(careerEventSchema),
    follow: followSchema,
    home: homeSchema,
    analytics: analyticsSchema,
    accessibility: accessibilitySchema,
    ftue: ftueSchema,
    monetization: monetizationSchema,
    lastWallClockMs: z.number().nonnegative(),
  })
  .superRefine((state, context) => {
    const unique = (values: string[], path: string, message: string) => {
      if (new Set(values).size !== values.length)
        context.addIssue({ code: "custom", message, path: [path] });
    };
    unique(
      state.listings.map((item) => item.id),
      "listings",
      "Market listing id must be unique",
    );
    unique(
      state.ownedAssets.map((item) => item.id),
      "ownedAssets",
      "OwnedAsset id must be unique",
    );
    unique(
      state.transactionJournal.map((item) => item.id),
      "transactionJournal",
      "Transaction id must be unique",
    );
    unique(
      state.playerListings.map((item) => item.id),
      "playerListings",
      "Player listing id must be unique",
    );
    unique(
      state.buyerOffers.map((item) => item.id),
      "buyerOffers",
      "Buyer offer id must be unique",
    );
    unique(
      state.career.map((item) => item.id),
      "career",
      "Career event id must be unique",
    );
    unique(
      state.follow.watchedListingIds,
      "follow",
      "Watched listing id must be unique",
    );
    unique(
      state.follow.savedSearches.map((item) => item.id),
      "follow",
      "Saved search id must be unique",
    );
    unique(
      state.follow.missedOpportunities.map((item) => item.id),
      "follow",
      "Missed opportunity id must be unique",
    );
    unique(
      state.analytics.events.map((item) => item.id),
      "analytics",
      "Analytics event id must be unique",
    );
    const activeAssetListings = new Set<string>();
    for (const listing of state.playerListings) {
      if (!["ACTIVE", "RESERVED", "SOLD_PENDING"].includes(listing.state))
        continue;
      const asset = state.ownedAssets.find(
        (item) => item.id === listing.ownedAssetId,
      );
      if (!asset || asset.currentListingId !== listing.id) {
        context.addIssue({
          code: "custom",
          message: `Active player listing must reference its current OwnedAsset: ${listing.id}`,
          path: ["playerListings"],
        });
      }
      if (activeAssetListings.has(listing.ownedAssetId)) {
        context.addIssue({
          code: "custom",
          message: `OwnedAsset cannot have two active listings: ${listing.ownedAssetId}`,
          path: ["playerListings"],
        });
      }
      activeAssetListings.add(listing.ownedAssetId);
    }
    for (const asset of state.ownedAssets) {
      if (asset.state === "SOLD_COMPLETE" && asset.currentListingId) {
        context.addIssue({
          code: "custom",
          message: `SoldComplete asset cannot have an active listing: ${asset.id}`,
          path: ["ownedAssets"],
        });
      }
    }
    const journal = state.transactionJournal.reduce(
      (sum, item) => ({
        cash: sum.cash + item.cashDeltaMinor,
        book: sum.book + item.costBasisDeltaMinor,
        profit: sum.profit + item.realizedProfitDeltaMinor,
      }),
      { cash: 0, book: 0, profit: 0 },
    );
    const book = state.ownedAssets
      .filter((item) => item.state !== "SOLD_COMPLETE")
      .reduce((sum, item) => sum + item.bookCostMinor, 0);
    if (
      journal.cash !== state.cashMinor ||
      journal.book !== book ||
      journal.profit !== state.realizedProfitMinor
    )
      context.addIssue({
        code: "custom",
        message: "Transaction journal does not reconcile with account totals",
        path: ["transactionJournal"],
      });
  });
export const validateState = (value: unknown) =>
  stateSchema.parse(value) as GameState;
export function rng(seed: number) {
  let value = seed >>> 0;
  return () =>
    (value = (Math.imul(1_664_525, value) + 1_013_904_223) >>> 0) /
    4_294_967_296;
}
export const wealth = netWorthMinor;

function attributeValue(
  definition: AttributeDefinition,
  roll: number,
): ItemAttribute {
  if (definition.type === "BOOLEAN")
    return { definitionId: definition.id, value: roll > 0.42 };
  if (definition.type === "CATEGORY") {
    const options = definition.options ?? ["Standart"];
    return {
      definitionId: definition.id,
      value:
        options[
          Math.min(options.length - 1, Math.floor(roll * options.length))
        ],
    };
  }
  const min = definition.min ?? 0;
  const max = definition.max ?? 100;
  return {
    definitionId: definition.id,
    value: Math.round(min + roll * (max - min)),
  };
}
function instanceFor(
  family: (typeof families)[number],
  r: () => number,
): ItemInstance {
  const condition = Math.round(48 + r() * 48);
  const variant = family.variants[Math.floor(r() * family.variants.length)];
  const defects = family.defects.map((definition) => ({
    definitionId: definition.id,
    present: r() < 0.18 + (100 - condition) / 250,
    revealed: false,
  }));
  const penaltyBps = defects.reduce(
    (sum, defect) =>
      sum +
      (defect.present
        ? (family.defects.find((item) => item.id === defect.definitionId)
            ?.valuePenaltyBps ?? 0)
        : 0),
    0,
  );
  return {
    family,
    variantId: variant.id,
    fairValueMinor: Math.max(
      1_000,
      Math.round(
        ((family.baseValueMinor * variant.valueFactorBps) / 10_000) *
          (0.58 + condition / 230) *
          (1 - penaltyBps / 10_000),
      ),
    ),
    condition,
    attributes: family.attributes.map((definition) =>
      attributeValue(definition, r()),
    ),
    evidence: family.evidence.map((definition, index) => ({
      definitionId: definition.id,
      status: index === 0 ? "VISIBLE" : "UNKNOWN",
    })),
    defects,
    evidenceConfidence: 0.22 + r() * 0.16,
    liquidityBonusBps: 0,
    accessoryComplete: r() > 0.35,
    preparationHistory: [],
  };
}
export function market(
  seed: number,
  totalWealthMinor: number,
  cycle = 0,
  gameTimeMin = 0,
  count = 24,
): Listing[] {
  const r = rng(seed + cycle * 7_919);
  const tier =
    totalWealthMinor < 1_000_000 ? 1 : totalWealthMinor < 7_500_000 ? 2 : 3;
  const pool = families.filter((family) => family.tier <= tier);
  const focusIndex = Math.floor(r() * pool.length);
  const focus = pool[focusIndex];
  const cohort = Array.from(
    { length: Math.min(4, pool.length) },
    (_, index) => pool[(focusIndex + index) % pool.length],
  );
  return Array.from({ length: count }, (_, index) => {
    const family =
      index < Math.ceil(count / 2)
        ? focus
        : cohort[(index - Math.ceil(count / 2) + 1) % cohort.length];
    const instance = instanceFor(family, r);
    const priceMinor = Math.max(
      2_000,
      Math.round((instance.fairValueMinor * (0.72 + r() * 0.56)) / 1_000) *
        1_000,
    );
    return {
      id: `${seed}-${cycle}-${index}`,
      familyId: family.id,
      instance,
      priceMinor,
      seller: (
        [
          "urgent",
          "expert",
          "uninformed",
          "emotional",
          "merchant",
          "risky",
        ] as SellerKind[]
      )[Math.floor(r() * 6)],
      urgency: r(),
      interest: Math.round(r() * 98),
      createdAtGameMin: gameTimeMin,
      expiresAtGameMin:
        gameTimeMin + Math.round(2 + (1 - family.liquidity) * 30 + r() * 25),
      state: "ACTIVE" as const,
      seed: Math.floor(r() * 1e9),
    };
  }).sort(
    (a, b) =>
      a.priceMinor / a.instance.fairValueMinor -
      b.priceMinor / b.instance.fairValueMinor,
  );
}
export function signal(item: Listing, expertiseLevel = 10) {
  if (expertiseLevel === 0) return { text: "Belirsiz", cls: "neutral" };
  const ratio = item.priceMinor / item.instance.fairValueMinor;
  if (ratio < 0.78) return { text: "Sıcak fırsat", cls: "hot" };
  if (ratio < 0.88) return { text: "İyi fiyat", cls: "good" };
  if (ratio > 1.15) return { text: "Pahalı", cls: "bad" };
  return { text: "Piyasa fiyatı", cls: "neutral" };
}
export function sellerFloor(item: Listing) {
  const factor = {
    urgent: 0.76,
    expert: 0.94,
    uninformed: 0.72,
    emotional: 1.02,
    merchant: 0.96,
    risky: 0.7,
  }[item.seller];
  return (
    Math.round(
      (item.instance.fairValueMinor * (factor + item.urgency * 0.06)) / 1_000,
    ) * 1_000
  );
}
export function resolveOffer(item: Listing, offer: number, index: number) {
  const floorMinor = sellerFloor(item);
  const roll = rng(item.seed + offer * 17 + index * 101)();
  if (offer >= floorMinor) return { result: "accepted" as const, floorMinor };
  if (offer >= floorMinor * (0.88 + roll * 0.08))
    return {
      result: "counter" as const,
      floorMinor,
      counterMinor: Math.round((offer + floorMinor) / 2_000) * 1_000,
    };
  return { result: "rejected" as const, floorMinor };
}
const formatter = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});
export const money = (minor: number) => formatter.format(minor / 100);
export const signedMoney = (minor: number) =>
  minor > 0 ? `+${money(minor)}` : minor < 0 ? money(minor) : `±${money(0)}`;

const createDefaultMonetizationState = (gameTimeMin: number) => ({
  entitlements: [],
  consent: {
    adPersonalizationAllowed: false,
    adsServedWithConsent: false,
    canRequestAds: false,
    updatedAtGameMin: gameTimeMin,
  },
  usage: {
    rewardSessionStartedAt: gameTimeMin,
    sessionRewardCount: 0,
    rollingRewardTimestamps: [],
    placementUsage: {
      MARKET_SCOUT: [],
      FAST_INSPECTION: [],
      FAST_PREPARATION: [],
      LISTING_REACH: [],
    },
  },
  firstSaleComplete: false,
  lifetimeActivePlayMinutes: 0,
  rewardCooldownUntilGameMin: undefined,
  rewardTransactions: [],
});

export const initialState = (
  lastWallClockMs = 0,
  mode: "FTUE" | "SANDBOX" = "FTUE",
): GameState => {
  const seed = 90_421;
  const sandboxCashMinor = 42_000;
  const base: GameState = {
    version: SAVE_VERSION,
    cashMinor: mode === "SANDBOX" ? sandboxCashMinor : 0,
    ownedAssets: [],
    realizedProfitMinor: 0,
    transactionJournal: [
      {
        id: "opening-balance:v7",
        kind: "OPENING_BALANCE",
        gameTime: 0,
        cashDeltaMinor: mode === "SANDBOX" ? sandboxCashMinor : 0,
        costBasisDeltaMinor: 0,
        realizedProfitDeltaMinor: 0,
        metadata: {
          reason: mode === "FTUE" ? "zero-cash-first-session" : "test-sandbox",
        },
      },
    ],
    gameTimeMin: 0,
    seed,
    marketCycle: 0,
    listings: [],
    playerListings: [],
    buyerOffers: [],
    expertise: {
      marketXp: 0,
      categoryXp: {},
      familyActionCounts: {},
      seenActions: [],
    },
    career: [],
    follow: {
      watchedListingIds: [],
      savedSearches: [],
      missedOpportunities: [],
    },
    home: { unlocked: false, purchased: false, progressMilestones: [] },
    analytics: { enabled: true, events: [] },
    accessibility: {
      hapticsEnabled: true,
      reducedMotion: false,
      largeText: false,
      soundLevel: "LOW",
    },
    monetization: createDefaultMonetizationState(0),
    ftue: {
      stage: mode === "FTUE" ? "STARTING_SALE" : "COMPLETE",
      dismissedStages: [],
    },
    lastWallClockMs,
  };
  if (mode === "SANDBOX") {
    return { ...base, listings: market(seed, sandboxCashMinor, 0, 0) };
  }
  const notebook =
    families.find((family) => family.id === "notebook") ?? families[0];
  const instance = {
    ...instanceFor(notebook, rng(seed + 101)),
    condition: 64,
    fairValueMinor: 38_000,
    accessoryComplete: false,
  };
  const assetId = "asset:ftue-starting-notebook";
  const listingId = "player-listing:ftue-starting-notebook";
  return {
    ...base,
    ownedAssets: [
      {
        id: assetId,
        familyId: notebook.id,
        sourceListingId: "legacy:starting-notebook",
        instance,
        state: "LISTED",
        purchasePriceMinor: 0,
        preparationCostMinor: 0,
        inspectionCostMinor: 0,
        transparentFeesMinor: 0,
        bookCostMinor: 0,
        acquiredAtGameMin: 0,
        currentListingId: listingId,
      },
    ],
    playerListings: [
      {
        id: listingId,
        ownedAssetId: assetId,
        askingPriceMinor: 42_000,
        interest: 1,
        createdAtGameMin: 0,
        expiresAtGameMin: 1_440,
        state: "ACTIVE",
      },
    ],
    buyerOffers: [
      {
        id: "offer:ftue-starting-notebook",
        listingId,
        amountMinor: 42_000,
        buyer: "Ece",
        expiresAtGameMin: 60,
      },
    ],
  };
};
