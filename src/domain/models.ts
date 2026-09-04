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

export type Family = {
  id: string;
  name: string;
  assetKey: string;
  baseValueMinor: number;
  demand: number;
  liquidity: number;
  category: string;
  tier: number;
  attributes: string[];
};

export type Listing = {
  id: ListingId;
  family: Family;
  priceMinor: number;
  fairValueMinor: number;
  condition: number;
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

export type ItemInstance = {
  family: Family;
  fairValueMinor: number;
  condition: number;
};

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

export type CareerEvent = {
  id: string;
  type: "BUY" | "SALE" | "PROFIT" | "MILESTONE" | "MISSED";
  atGameMin: number;
  label: string;
  amountMinor?: number;
};

export type Negotiation = {
  listingId: ListingId;
  offersRemaining: 0 | 1 | 2;
  sellerFloorMinor: number;
  counterMinor?: number;
  closed: boolean;
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
  expertise: Record<string, number>;
  career: CareerEvent[];
  lastWallClockMs: number;
};
