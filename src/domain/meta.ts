import { familyById } from "../content/families";
import { trackAnalytics } from "../infrastructure/analytics";
import { HOME_GOAL_MINOR } from "../game";
import { META_CONFIG } from "./config";
import { netWorthMinor } from "./economy";
import { markFirstSaleComplete } from "./monetization";
import type {
  CareerEvent,
  CareerEventGroup,
  CareerEventType,
  GameState,
  Listing,
  MarketExitReason,
  SavedSearch,
} from "./models";

export type ExpertiseAction = keyof typeof META_CONFIG.expertiseXp;

export const expertiseLevel = (xp: number) => {
  let level = 0;
  for (const threshold of META_CONFIG.expertiseLevelXp) {
    if (xp < threshold) break;
    level += 1;
  }
  return Math.min(10, Math.max(0, level - 1));
};

export const marketExpertiseLevel = (state: GameState) =>
  expertiseLevel(state.expertise.marketXp);

export const categoryExpertiseLevel = (state: GameState, category: string) =>
  expertiseLevel(state.expertise.categoryXp[category] ?? 0);

export const nextExpertiseThreshold = (xp: number) =>
  META_CONFIG.expertiseLevelXp.find((threshold) => threshold > xp) ??
  META_CONFIG.expertiseLevelXp.at(-1)!;

const careerEvent = (
  state: GameState,
  id: string,
  type: CareerEventType,
  group: CareerEventGroup,
  label: string,
  detail: Partial<CareerEvent> = {},
): CareerEvent => ({
  id,
  type,
  group,
  atGameMin: state.gameTimeMin,
  label,
  ...detail,
});

const appendCareer = (state: GameState, events: CareerEvent[]) => ({
  ...state,
  career: [
    ...state.career,
    ...events.filter(
      (event) => !state.career.some((current) => current.id === event.id),
    ),
  ],
});

export function gainExpertise(
  state: GameState,
  action: ExpertiseAction,
  familyId?: string,
  uniqueKey?: string,
): GameState {
  const seenKey = uniqueKey ? `${action}:${uniqueKey}` : undefined;
  if (seenKey && state.expertise.seenActions.includes(seenKey)) return state;
  const family = familyId ? familyById(familyId) : undefined;
  const countKey = family ? `${family.id}:${action}` : `market:${action}`;
  const priorCount = state.expertise.familyActionCounts[countKey] ?? 0;
  const diminishing = priorCount < 2 ? 1 : priorCount < 5 ? 0.65 : 0.4;
  const gain = Math.max(
    1,
    Math.round(META_CONFIG.expertiseXp[action] * diminishing),
  );
  const previousMarketLevel = marketExpertiseLevel(state);
  const previousCategoryLevel = family
    ? categoryExpertiseLevel(state, family.category)
    : 0;
  let next: GameState = {
    ...state,
    expertise: {
      marketXp: state.expertise.marketXp + gain,
      categoryXp: family
        ? {
            ...state.expertise.categoryXp,
            [family.category]:
              (state.expertise.categoryXp[family.category] ?? 0) + gain,
          }
        : state.expertise.categoryXp,
      familyActionCounts: {
        ...state.expertise.familyActionCounts,
        [countKey]: priorCount + 1,
      },
      seenActions: seenKey
        ? [...state.expertise.seenActions, seenKey]
        : state.expertise.seenActions,
    },
  };
  const nextMarketLevel = marketExpertiseLevel(next);
  const nextCategoryLevel = family
    ? categoryExpertiseLevel(next, family.category)
    : 0;
  const events: CareerEvent[] = [];
  if (nextMarketLevel > previousMarketLevel) {
    events.push(
      careerEvent(
        next,
        `expertise:market:${nextMarketLevel}`,
        "EXPERTISE_MILESTONE",
        "MILESTONES",
        `Pazar deneyimi Seviye ${nextMarketLevel} oldu`,
      ),
    );
  }
  if (family && nextCategoryLevel > previousCategoryLevel) {
    events.push(
      careerEvent(
        next,
        `expertise:${family.category}:${nextCategoryLevel}`,
        "EXPERTISE_MILESTONE",
        "MILESTONES",
        `${family.category} uzmanlığı Seviye ${nextCategoryLevel} oldu`,
        { familyId: family.id, assetKey: family.assetKey },
      ),
    );
  }
  next = appendCareer(next, events);
  return next;
}

const saleJournal = (state: GameState, transactionId: string) =>
  state.transactionJournal.find(
    (entry) => entry.id === transactionId && entry.kind === "SALE",
  );

const saleProfitByCategory = (state: GameState) => {
  const totals = new Map<string, number>();
  for (const entry of state.transactionJournal.filter(
    (item) => item.kind === "SALE",
  )) {
    const asset = state.ownedAssets.find((item) => item.id === entry.assetId);
    if (!asset) continue;
    const category = asset.instance.family.category;
    totals.set(
      category,
      (totals.get(category) ?? 0) + entry.realizedProfitDeltaMinor,
    );
  }
  return [...totals.entries()].sort((left, right) => right[1] - left[1]);
};

export function recordCompletedSaleMeta(
  previous: GameState,
  state: GameState,
  assetId: string,
  transactionId: string,
): GameState {
  const journal = saleJournal(state, transactionId);
  const asset = state.ownedAssets.find((item) => item.id === assetId);
  if (!journal || !asset) return state;
  let next = gainExpertise(state, "sale", asset.familyId, transactionId);
  const proceedsMinor = journal.cashDeltaMinor;
  const profitMinor = journal.realizedProfitDeltaMinor;
  const wealthAtEventMinor = netWorthMinor(next);
  const common: Partial<CareerEvent> = {
    familyId: asset.familyId,
    assetKey: asset.instance.family.assetKey,
    buyPriceMinor: asset.purchasePriceMinor,
    sellPriceMinor: proceedsMinor,
    realizedProfitMinor: profitMinor,
    preparationValueMinor: asset.preparationCostMinor,
    wealthAtEventMinor,
  };
  const events: CareerEvent[] = [];
  if (!next.career.some((event) => event.type === "FIRST_SALE")) {
    events.push(
      careerEvent(
        next,
        "career:first-sale",
        "FIRST_SALE",
        "FIRSTS",
        `İlk satış: ${asset.instance.family.name}`,
        { ...common, amountMinor: proceedsMinor },
      ),
    );
    next = markFirstSaleComplete(next);
  }
  if (
    profitMinor > 0 &&
    !next.career.some((event) => event.type === "FIRST_PROFITABLE_SALE")
  ) {
    events.push(
      careerEvent(
        next,
        "career:first-profitable-sale",
        "FIRST_PROFITABLE_SALE",
        "FIRSTS",
        `İlk kârlı satış: ${asset.instance.family.name}`,
        { ...common, amountMinor: profitMinor },
      ),
    );
  }
  const priorBest = Math.max(
    0,
    ...next.career
      .filter((event) => event.type === "BEST_FLIP_UPDATED")
      .map((event) => event.realizedProfitMinor ?? 0),
  );
  if (profitMinor > priorBest) {
    events.push(
      careerEvent(
        next,
        `career:best-flip:${transactionId}`,
        "BEST_FLIP_UPDATED",
        "RECORDS",
        `Yeni kâr rekoru: ${asset.instance.family.name}`,
        { ...common, amountMinor: profitMinor },
      ),
    );
  }
  const priorPreparationRecord = Math.max(
    0,
    ...next.career
      .filter((event) => event.type === "VALUE_ADDED_RECORD")
      .map((event) => event.preparationValueMinor ?? 0),
  );
  if (asset.preparationCostMinor > priorPreparationRecord) {
    events.push(
      careerEvent(
        next,
        `career:value-added:${transactionId}`,
        "VALUE_ADDED_RECORD",
        "RECORDS",
        `Hazırlık katkısı rekoru: ${asset.instance.family.name}`,
        { ...common, amountMinor: asset.preparationCostMinor },
      ),
    );
  }
  const previousWealth = netWorthMinor(previous);
  for (const milestone of META_CONFIG.wealthMilestonesMinor) {
    if (previousWealth < milestone && wealthAtEventMinor >= milestone) {
      events.push(
        careerEvent(
          next,
          `career:wealth:${milestone}`,
          "WEALTH_MILESTONE",
          "MILESTONES",
          `Servet eşiği aşıldı`,
          { amountMinor: milestone, wealthAtEventMinor },
        ),
      );
    }
  }
  if (
    proceedsMinor >= META_CONFIG.highTicketMinor &&
    !next.career.some((event) => event.type === "FIRST_HIGH_TICKET_TRADE")
  ) {
    events.push(
      careerEvent(
        next,
        "career:first-high-ticket",
        "FIRST_HIGH_TICKET_TRADE",
        "FIRSTS",
        `İlk büyük işlem: ${asset.instance.family.name}`,
        { ...common, amountMinor: proceedsMinor },
      ),
    );
  }
  const dominant = saleProfitByCategory(next)[0];
  const lastDominant = [...next.career]
    .reverse()
    .find((event) => event.type === "DOMINANT_CATEGORY_CHANGED");
  if (
    dominant &&
    dominant[0] !== lastDominant?.label.replace(" rotan öne çıktı", "")
  ) {
    events.push(
      careerEvent(
        next,
        `career:dominant:${transactionId}`,
        "DOMINANT_CATEGORY_CHANGED",
        "MILESTONES",
        `${dominant[0]} rotan öne çıktı`,
        { amountMinor: dominant[1] },
      ),
    );
  }
  const hasProfitableSale =
    profitMinor > 0 ||
    next.career.some((event) => event.type === "FIRST_PROFITABLE_SALE");
  if (
    !next.home.unlocked &&
    hasProfitableSale &&
    next.ftue.stage === "COMPLETE"
  ) {
    next = {
      ...next,
      home: {
        ...next.home,
        unlocked: true,
        revealedAtGameMin: next.gameTimeMin,
      },
    };
  }
  if (next.home.unlocked) {
    const progress = Math.min(
      100,
      Math.floor((wealthAtEventMinor / HOME_GOAL_MINOR) * 100),
    );
    const crossed = META_CONFIG.homeProgressMilestones.filter(
      (milestone) =>
        progress >= milestone &&
        !next.home.progressMilestones.includes(milestone),
    );
    if (crossed.length) {
      next = {
        ...next,
        home: {
          ...next.home,
          progressMilestones: [...next.home.progressMilestones, ...crossed],
        },
      };
      events.push(
        ...crossed.map((milestone) =>
          careerEvent(
            next,
            `career:home:${milestone}`,
            "HOME_PROGRESS",
            "HOME",
            `Ev yolculuğu %${milestone}`,
            { amountMinor: wealthAtEventMinor },
          ),
        ),
      );
    }
  }
  next = appendCareer(next, events);
  return trackAnalytics(
    next,
    "sale_complete",
    {
      familyId: asset.familyId,
      proceedsMinor,
      bookCostMinor: asset.bookCostMinor,
      realizedProfitMinor: profitMinor,
    },
    transactionId,
  );
}

export const savedSearchMatches = (search: SavedSearch, listing: Listing) =>
  listing.familyId === search.familyId &&
  listing.priceMinor <= search.maxPriceMinor &&
  listing.instance.condition >= search.minCondition &&
  (search.evidencePreference === "ANY" ||
    listing.instance.evidence.some((evidence) =>
      ["CHECKED", "VERIFIED"].includes(evidence.status),
    ));

export function toggleWatch(state: GameState, listingId: string): GameState {
  const listing = state.listings.find((item) => item.id === listingId);
  if (!listing || !["ACTIVE", "WATCHED", "NEGOTIATING"].includes(listing.state))
    return state;
  const watched = state.follow.watchedListingIds.includes(listingId);
  return {
    ...state,
    listings: state.listings.map((item) =>
      item.id === listingId && item.state !== "NEGOTIATING"
        ? { ...item, state: watched ? "ACTIVE" : "WATCHED" }
        : item,
    ),
    follow: {
      ...state.follow,
      watchedListingIds: watched
        ? state.follow.watchedListingIds.filter((id) => id !== listingId)
        : [...state.follow.watchedListingIds, listingId],
    },
  };
}

export function addSavedSearch(
  state: GameState,
  familyId: string,
  maxPriceMinor: number,
  minCondition: number,
  evidencePreference: SavedSearch["evidencePreference"] = "ANY",
): GameState {
  if (
    !isValidSavedSearch(
      familyId,
      maxPriceMinor,
      minCondition,
      evidencePreference,
    )
  )
    return state;
  const id = `search:${familyId}:${maxPriceMinor}:${minCondition}:${evidencePreference}`;
  if (state.follow.savedSearches.some((search) => search.id === id))
    return state;
  return {
    ...state,
    follow: {
      ...state.follow,
      savedSearches: [
        ...state.follow.savedSearches,
        {
          id,
          familyId,
          maxPriceMinor,
          minCondition,
          evidencePreference,
          createdAtGameMin: state.gameTimeMin,
        },
      ],
    },
  };
}

export const isValidSavedSearch = (
  familyId: string,
  maxPriceMinor: number,
  minCondition: number,
  evidencePreference: SavedSearch["evidencePreference"],
) =>
  Boolean(familyById(familyId)) &&
  Number.isSafeInteger(maxPriceMinor) &&
  maxPriceMinor >= 0 &&
  Number.isFinite(minCondition) &&
  minCondition >= 0 &&
  minCondition <= 100 &&
  ["ANY", "CHECKED"].includes(evidencePreference);

export const removeSavedSearch = (
  state: GameState,
  searchId: string,
): GameState => ({
  ...state,
  follow: {
    ...state.follow,
    savedSearches: state.follow.savedSearches.filter(
      (search) => search.id !== searchId,
    ),
  },
});

export function recordMarketExits(
  state: GameState,
  exits: Listing[],
): GameState {
  let next = state;
  for (const listing of exits) {
    const watched = next.follow.watchedListingIds.includes(listing.id);
    const matchedSearch = next.follow.savedSearches.some((search) =>
      savedSearchMatches(search, listing),
    );
    if (!watched && !matchedSearch) continue;
    const id = `missed:${listing.id}`;
    if (!next.follow.missedOpportunities.some((item) => item.id === id)) {
      next = {
        ...next,
        follow: {
          ...next.follow,
          watchedListingIds: next.follow.watchedListingIds.filter(
            (listingId) => listingId !== listing.id,
          ),
          missedOpportunities: [
            ...next.follow.missedOpportunities,
            {
              id,
              listingId: listing.id,
              familyId: listing.familyId,
              familyName: listing.instance.family.name,
              assetKey: listing.instance.family.assetKey,
              priceMinor: listing.priceMinor,
              condition: listing.instance.condition,
              reason: listing.exitReason as MarketExitReason,
              atGameMin: listing.closedAtGameMin ?? next.gameTimeMin,
            },
          ].slice(-META_CONFIG.missedOpportunityLimit),
        },
      };
      next = trackAnalytics(
        next,
        "opportunity_lost",
        {
          familyId: listing.familyId,
          reason: listing.exitReason ?? "EXPIRED",
          watched,
          matchedSearch,
        },
        listing.id,
      );
    }
  }
  return next;
}
