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
