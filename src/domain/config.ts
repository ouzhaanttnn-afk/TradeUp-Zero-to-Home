export const WORLD_CONFIG = {
  activeTickMin: 1,
  scanAdvanceMin: 2,
  scanArrivalCount: 4,
  minActiveListings: 16,
  maxActiveListings: 28,
  terminalHistoryLimit: 24,
  firstSessionProtectionMin: 5,
  minimumNpcAgeMin: 2,
  buyerOfferLifetimeMin: 60,
  playerListingLifetimeMin: 1_440,
  offlineFullRateMin: 15,
  offlineCapWallMin: 240,
  offlineDiminishingRate: 0.35,
  offlineClosureRatio: 0.5,
} as const;

export const META_CONFIG = {
  expertiseLevelXp: [0, 30, 80, 150, 240, 350, 480, 630, 800, 990, 1_200],
  expertiseXp: {
    listingOpen: 4,
    compare: 12,
    inspection: 18,
    purchase: 25,
    sale: 60,
  },
  wealthMilestonesMinor: [1_000_000, 10_000_000, 100_000_000],
  highTicketMinor: 25_000_000,
  homeProgressMilestones: [25, 50, 75, 90],
  analyticsEventLimit: 500,
  missedOpportunityLimit: 60,
} as const;

export const MONETIZATION_CONFIG = {
  productCatalog: [
    {
      productId: "tradeup_premium_lifetime" as const,
      entitlementId: "premium_lifetime" as const,
    },
    {
      productId: "tradeup_theme_night_market" as const,
      entitlementId: "theme_night_market" as const,
    },
    {
      productId: "tradeup_theme_workshop" as const,
      entitlementId: "theme_workshop" as const,
    },
    {
      productId: "tradeup_home_styles_01" as const,
      entitlementId: "home_styles_01" as const,
    },
  ],
  reward: {
    rollingWindowHours: 24,
    globalCap: 8,
    sessionCap: 4,
    cooldownSeconds: 90,
    placementCap: {
      MARKET_SCOUT: 2,
      FAST_INSPECTION: 3,
      FAST_PREPARATION: 3,
      LISTING_REACH: 2,
    },
    placementReward: {
      MARKET_SCOUT_LISTING_COUNT: 4,
      FAST_PREPARATION_TRIGGER_SECONDS: 60,
      LISTING_REACH_MAX_AGE_GAME_MIN: 5,
      MIN_LISTING_AGE_FOR_FAST_INSPECTION_SECONDS: 45,
      MIN_ACTIVE_OFFERLESS_LISTING_ACTIVE_MIN: 5,
    },
    maxSameScreenCta: 1,
    firstSaleCompleteThresholdMinutes: 20,
    firstRewardedUnlockMinutes: 120,
    premiumIntroCooldownDays: 7,
  },
  products: {
    premium: {
      productId: "tradeup_premium_lifetime" as const,
      entitlementId: "premium_lifetime" as const,
      platform: "web" as const,
    },
    themeNightMarket: {
      productId: "tradeup_theme_night_market" as const,
      entitlementId: "theme_night_market" as const,
      platform: "web" as const,
    },
    themeWorkshop: {
      productId: "tradeup_theme_workshop" as const,
      entitlementId: "theme_workshop" as const,
      platform: "web" as const,
    },
    homeStyles: {
      productId: "tradeup_home_styles_01" as const,
      entitlementId: "home_styles_01" as const,
      platform: "web" as const,
    },
  },
  ads: {
    provider: "admob" as const,
    sandboxAdUnit: import.meta.env?.DEV
      ? "ca-app-pub-3940256099942544/5224354917"
      : undefined,
    productionAdUnit: undefined,
    productionServingEnabled: false,
    environment: "sandbox" as const,
  },
  billing: {
    environment: "sandbox" as const,
    sandboxProducts: {
      ios: {},
      android: {},
    },
    productionProducts: {
      ios: {},
      android: {},
    },
  },
} as const;
