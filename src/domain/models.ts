export type AssetId = string;
export type ListingId = string;
export type TransactionId = string;

export type SellerKind =
  "urgent" | "expert" | "uninformed" | "emotional" | "merchant" | "risky";

export type MarketListingState =
  | "ACTIVE"
  | "WATCHED"
  | "NEGOTIATING"
  | "SOLD_TO_PLAYER"
  | "SOLD_TO_NPC"
  | "EXPIRED"
  | "WITHDRAWN";

export type MarketExitReason = "NPC_PURCHASE" | "EXPIRED";

export type AttributeValue = number | string | boolean;
export type AttributeDefinition = {
  id: string;
  label: string;
  type: "NUMBER" | "CATEGORY" | "BOOLEAN" | "YEAR" | "RANGE";
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  comparePriority: number;
};

export type EvidenceStatus =
  "VISIBLE" | "CLAIMED" | "SUSPICIOUS" | "CHECKED" | "VERIFIED" | "UNKNOWN";
export type InspectionKind = "PHOTO" | "ASK_SELLER" | "QUICK_TEST";
export type EvidenceDefinition = {
  id: string;
  label: string;
  claim: string;
  checkedCopy: string;
  inspectionKinds: InspectionKind[];
  critical: boolean;
};
export type EvidenceRecord = {
  definitionId: string;
  status: EvidenceStatus;
};

export type DefectDefinition = {
  id: string;
  label: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  valuePenaltyBps: number;
  riskSignal: number;
  evidenceId: string;
  overlayKey: string;
};
export type DefectInstance = {
  definitionId: string;
  present: boolean;
  revealed: boolean;
};

export type VariantDefinition = {
  id: string;
  label: string;
  valueFactorBps: number;
};

export type PreparationKind = "CLEAN" | "TEST" | "COMPLETE";
export type PreparationDefinition = {
  kind: PreparationKind;
  label: string;
  costMinor: number;
  durationMin: number;
  conditionGain: number;
  confidenceGain: number;
  valueGainBps: number;
  liquidityGainBps: number;
  maxUses: number;
};
export type PreparationRecord = {
  id: string;
  kind: PreparationKind;
  state: "IN_PROGRESS" | "COMPLETE";
  startedAtGameMin: number;
  completesAtGameMin: number;
  costMinor: number;
};

export type Family = {
  id: string;
  name: string;
  assetKey: string;
  baseValueMinor: number;
  demand: number;
  liquidity: number;
  category: string;
  tier: number;
  rarity: number;
  conditionCap: number;
  attributes: AttributeDefinition[];
  evidence: EvidenceDefinition[];
  defects: DefectDefinition[];
  variants: VariantDefinition[];
  preparation: PreparationDefinition[];
};

export type ItemAttribute = {
  definitionId: string;
  value: AttributeValue;
};

export type ItemInstance = {
  family: Family;
  variantId: string;
  fairValueMinor: number;
  condition: number;
  attributes: ItemAttribute[];
  evidence: EvidenceRecord[];
  defects: DefectInstance[];
  evidenceConfidence: number;
  liquidityBonusBps: number;
  accessoryComplete: boolean;
  preparationHistory: PreparationRecord[];
};

export type Listing = {
  id: ListingId;
  familyId: string;
  instance: ItemInstance;
  priceMinor: number;
  seller: SellerKind;
  urgency: number;
  interest: number;
  createdAtGameMin: number;
  expiresAtGameMin: number;
  closedAtGameMin?: number;
  exitReason?: MarketExitReason;
  state: MarketListingState;
  seed: number;
};

export type OwnershipState =
  | "IN_INVENTORY"
  | "PREPARING"
  | "READY"
  | "LISTED"
  | "RESERVED"
  | "SOLD_PENDING"
  | "SOLD_COMPLETE";

export type OwnedAsset = {
  id: AssetId;
  familyId: string;
  sourceListingId: ListingId;
  instance: ItemInstance;
  state: OwnershipState;
  purchasePriceMinor: number;
  preparationCostMinor: number;
  inspectionCostMinor: number;
  transparentFeesMinor: number;
  bookCostMinor: number;
  acquiredAtGameMin: number;
  currentListingId?: ListingId;
};

export type PlayerListingState =
  | "ACTIVE"
  | "RESERVED"
  | "SOLD_PENDING"
  | "SOLD_COMPLETE"
  | "WITHDRAWN"
  | "EXPIRED";

export type PlayerListing = {
  id: ListingId;
  ownedAssetId: AssetId;
  askingPriceMinor: number;
  interest: number;
  createdAtGameMin: number;
  expiresAtGameMin: number;
  state: PlayerListingState;
};

export type BuyerOffer = {
  id: string;
  listingId: ListingId;
  amountMinor: number;
  buyer: string;
  expiresAtGameMin: number;
};

export type TransactionKind =
  | "OPENING_BALANCE"
  | "MIGRATION"
  | "PURCHASE"
  | "PREPARATION"
  | "INSPECTION"
  | "FEE"
  | "LISTING"
  | "RESERVATION"
  | "SALE"
  | "REFUND"
  | "REWARD";

export type TransactionJournalEntry = {
  id: TransactionId;
  kind: TransactionKind;
  gameTime: number;
  assetId?: AssetId;
  cashDeltaMinor: number;
  costBasisDeltaMinor: number;
  realizedProfitDeltaMinor: number;
  metadata: Record<string, unknown>;
};

export type CareerEventType =
  | "FIRST_SALE"
  | "FIRST_PROFITABLE_SALE"
  | "BEST_FLIP_UPDATED"
  | "VALUE_ADDED_RECORD"
  | "WEALTH_MILESTONE"
  | "EXPERTISE_MILESTONE"
  | "FIRST_HIGH_TICKET_TRADE"
  | "DOMINANT_CATEGORY_CHANGED"
  | "HOME_PROGRESS"
  | "HOME_PURCHASE"
  | "LEGACY";

export type CareerEventGroup = "FIRSTS" | "RECORDS" | "MILESTONES" | "HOME";

export type CareerEvent = {
  id: string;
  type: CareerEventType;
  group: CareerEventGroup;
  atGameMin: number;
  label: string;
  amountMinor?: number;
  familyId?: string;
  assetKey?: string;
  buyPriceMinor?: number;
  sellPriceMinor?: number;
  realizedProfitMinor?: number;
  preparationValueMinor?: number;
  wealthAtEventMinor?: number;
};

export type ExpertiseState = {
  marketXp: number;
  categoryXp: Record<string, number>;
  familyActionCounts: Record<string, number>;
  seenActions: string[];
};

export type SavedSearch = {
  id: string;
  familyId: string;
  maxPriceMinor: number;
  minCondition: number;
  evidencePreference: "ANY" | "CHECKED";
  createdAtGameMin: number;
};

export type MissedOpportunity = {
  id: string;
  listingId: string;
  familyId: string;
  familyName: string;
  assetKey: string;
  priceMinor: number;
  condition: number;
  reason: MarketExitReason;
  atGameMin: number;
};

export type FollowState = {
  watchedListingIds: string[];
  savedSearches: SavedSearch[];
  missedOpportunities: MissedOpportunity[];
};

export type HomeState = {
  unlocked: boolean;
  revealedAtGameMin?: number;
  purchased: boolean;
  progressMilestones: number[];
};

export type RewardPlacementId =
  "MARKET_SCOUT" | "FAST_INSPECTION" | "FAST_PREPARATION" | "LISTING_REACH";

export type MonetizationProductId =
  | "tradeup_premium_lifetime"
  | "tradeup_theme_night_market"
  | "tradeup_theme_workshop"
  | "tradeup_home_styles_01";

export type EntitlementId =
  | "premium_lifetime"
  | "theme_night_market"
  | "theme_workshop"
  | "home_styles_01";

export type EntitlementStatus = "PENDING" | "OWNED" | "REVOKED";

export type EntitlementState = {
  productId: MonetizationProductId;
  entitlementId: EntitlementId;
  status: EntitlementStatus;
  platform: "ios" | "android" | "web";
  purchasedAtGameMin?: number;
  verifiedAtGameMin?: number;
};

export type RewardStatus = "REQUESTED" | "APPLIED" | "CANCELLED" | "FAILED";
export type RewardSource = "ad" | "premium";
export type RewardActionTransaction = {
  id: TransactionId;
  placementId: RewardPlacementId;
  source: RewardSource;
  status: RewardStatus;
  requestedAt: number;
  appliedAt?: number;
  targetId?: string;
};

export type MonetizationUsage = {
  rollingRewardTimestamps: number[];
  sessionRewardCount: number;
  placementUsage: Record<RewardPlacementId, number[]>;
  rewardSessionStartedAt: number;
};

export type MonetizationConsentState = {
  adPersonalizationAllowed: boolean;
  adsServedWithConsent: boolean;
  canRequestAds: boolean;
  updatedAtGameMin: number;
};

export type MonetizationState = {
  entitlements: EntitlementState[];
  consent: MonetizationConsentState;
  usage: MonetizationUsage;
  firstSaleComplete: boolean;
  lifetimeActivePlayMinutes: number;
  rewardCooldownUntilGameMin?: number;
  rewardTransactions: RewardActionTransaction[];
};

export type AnalyticsEventName =
  | "listing_impression"
  | "listing_open"
  | "compare_started"
  | "evidence_action"
  | "offer_submitted"
  | "purchase_complete"
  | "preparation_started"
  | "listing_created"
  | "buyer_offer"
  | "sale_complete"
  | "opportunity_lost"
  | "career_timeline_opened"
  | "reward_request_started"
  | "reward_request_failed"
  | "reward_loaded"
  | "reward_applied"
  | "reward_closed_early"
  | "premium_claim_used"
  | "iap_opened"
  | "iap_purchase_started"
  | "iap_purchase_completed"
  | "iap_restore_started"
  | "iap_restore_completed";

export type AnalyticsEvent = {
  id: string;
  name: AnalyticsEventName;
  atGameMin: number;
  properties: Record<string, string | number | boolean>;
};

export type AnalyticsState = {
  enabled: boolean;
  events: AnalyticsEvent[];
};

export type AccessibilityPreferences = {
  hapticsEnabled: boolean;
  reducedMotion: boolean;
  largeText: boolean;
  soundLevel: "OFF" | "LOW" | "NORMAL";
};

export type Negotiation = {
  listingId: ListingId;
  offersRemaining: 0 | 1 | 2;
  sellerFloorMinor: number;
  counterMinor?: number;
  closed: boolean;
};

export type FtueStage =
  | "STARTING_SALE"
  | "COMPARE"
  | "EVIDENCE"
  | "NEGOTIATION"
  | "PREPARATION"
  | "LISTING"
  | "BUYER_SALE"
  | "COMPLETE";

export type FtueState = {
  stage: FtueStage;
  dismissedStages: FtueStage[];
  firstAssetId?: AssetId;
  firstPlayerListingId?: ListingId;
};

export type GameState = {
  version: number;
  cashMinor: number;
  ownedAssets: OwnedAsset[];
  realizedProfitMinor: number;
  transactionJournal: TransactionJournalEntry[];
  gameTimeMin: number;
  seed: number;
  marketCycle: number;
  listings: Listing[];
  playerListings: PlayerListing[];
  buyerOffers: BuyerOffer[];
  negotiation?: Negotiation;
  negotiations: Record<string, Negotiation>;
  expertise: ExpertiseState;
  career: CareerEvent[];
  follow: FollowState;
  home: HomeState;
  analytics: AnalyticsState;
  accessibility: AccessibilityPreferences;
  monetization: MonetizationState;
  ftue: FtueState;
  lastWallClockMs: number;
};
