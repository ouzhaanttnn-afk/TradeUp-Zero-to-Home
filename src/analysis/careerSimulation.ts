import { HOME_GOAL_MINOR, market } from "../game";
import { listingEstimateBand } from "../domain/decision";
import { homeGoldPercent } from "../ui/homeAtmosphere";

export const CAREER_STARTING_CASH_MINOR = 42_000;
export const THREE_MILLION_MINOR = 300_000_000;

export type CareerMilestone = {
  wealthMinor: number;
  trades: number;
  refreshes: number;
  goldPercent: number;
};

export type CareerSimulation = {
  seed: number;
  trades: number;
  refreshes: number;
  finalCashMinor: number;
  milestones: CareerMilestone[];
};

const milestoneValues = [
  500_000,
  87_500_000,
  175_000_000,
  262_500_000,
  THREE_MILLION_MINOR,
  315_000_000,
  HOME_GOAL_MINOR,
];

const stableSaleFactor = (seed: number, cycle: number, listingSeed: number) => {
  const mixed = Math.abs(
    Math.imul(seed + 17, 1_103_515_245) ^
      Math.imul(cycle + 31, 12_345) ^
      listingSeed,
  );
  return 0.94 + (mixed % 901) / 10_000;
};

/**
 * Read-only balance probe. It models a careful player who buys only when the
 * visible conservative estimate leaves at least 3% room, then accepts a
 * deterministic buyer offer in the live offer engine's normal value band.
 */
export function simulateCareer(
  seed: number,
  targetMinor = HOME_GOAL_MINOR,
): CareerSimulation {
  let cashMinor = CAREER_STARTING_CASH_MINOR;
  let trades = 0;
  let refreshes = 0;
  let cycle = 0;
  const milestones: CareerMilestone[] = [];

  while (cashMinor < targetMinor && cycle < 50_000) {
    const expertiseLevel = Math.min(10, Math.floor(trades / 6));
    const listings = market(seed, cashMinor, cycle, cycle * 2, 24);
    const candidates = listings
      .filter((listing) => listing.priceMinor <= cashMinor)
      .map((listing) => ({
        listing,
        estimate: listingEstimateBand(listing, expertiseLevel),
      }))
      .filter(
        ({ listing, estimate }) =>
          estimate.lowMinor >= Math.round(listing.priceMinor * 1.03),
      )
      .sort(
        (left, right) =>
          right.estimate.lowMinor -
          right.listing.priceMinor -
          (left.estimate.lowMinor - left.listing.priceMinor),
      );

    const choice = candidates[0];
    if (!choice) {
      refreshes += 1;
      cycle += 1;
      continue;
    }

    const saleFactor = stableSaleFactor(seed, cycle, choice.listing.seed);
    const proceedsMinor =
      Math.round(
        (choice.listing.instance.fairValueMinor * saleFactor) / 1_000,
      ) * 1_000;
    if (proceedsMinor <= choice.listing.priceMinor) {
      refreshes += 1;
      cycle += 1;
      continue;
    }

    cashMinor += proceedsMinor - choice.listing.priceMinor;
    trades += 1;
    cycle += 1;

    for (const wealthMinor of milestoneValues) {
      if (
        wealthMinor <= targetMinor &&
        cashMinor >= wealthMinor &&
        !milestones.some((milestone) => milestone.wealthMinor === wealthMinor)
      ) {
        milestones.push({
          wealthMinor,
          trades,
          refreshes,
          goldPercent: homeGoldPercent(wealthMinor, HOME_GOAL_MINOR, false),
        });
      }
    }
  }

  if (cashMinor < targetMinor) {
    throw new Error(`Career simulation did not reach ${targetMinor}`);
  }

  return { seed, trades, refreshes, finalCashMinor: cashMinor, milestones };
}

export function simulateCareerSample(size = 100) {
  return Array.from({ length: size }, (_, index) =>
    simulateCareer(10_000 + index * 97),
  );
}

export const percentile = (values: number[], ratio: number) => {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.round((sorted.length - 1) * ratio)] ?? 0;
};
