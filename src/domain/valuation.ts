import { VALUATION_CONFIG } from "./config";
import type { ItemAttribute, SellerKind } from "./models";

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

const roundMinor = (value: number) =>
  Math.max(
    VALUATION_CONFIG.roundingMinor,
    Math.round(value / VALUATION_CONFIG.roundingMinor) *
      VALUATION_CONFIG.roundingMinor,
  );

const stableHash = (value: string) =>
  [...value].reduce(
    (hash, character) => (Math.imul(hash, 31) + character.charCodeAt(0)) >>> 0,
    2_166_136_261,
  );

const interpolate = (from: number, to: number, progress: number) =>
  Math.round(from + (to - from) * clamp(progress, 0, 1));

export function conditionFactorBps(condition: number) {
  const normalized = clamp(condition, 0, 100) / 100;
  return Math.round(
    VALUATION_CONFIG.conditionFloorBps +
      VALUATION_CONFIG.conditionCurveBps *
        Math.pow(normalized, VALUATION_CONFIG.conditionExponent),
  );
}

export function attributeFactorBps(attributes: ItemAttribute[]) {
  if (!attributes.length) return 10_000;
  const factors = attributes.map(({ value }) => {
    if (typeof value === "string") {
      return (
        VALUATION_CONFIG.attributeBps[
          value as keyof Pick<
            typeof VALUATION_CONFIG.attributeBps,
            "Temel" | "Plus" | "Pro"
          >
        ] ?? 10_000
      );
    }
    if (typeof value === "boolean")
      return value
        ? VALUATION_CONFIG.attributeBps.booleanTrue
        : VALUATION_CONFIG.attributeBps.booleanFalse;
    return interpolate(
      VALUATION_CONFIG.attributeBps.numberMin,
      VALUATION_CONFIG.attributeBps.numberMax,
      value / 100,
    );
  });
  return clamp(
    Math.round(
      factors.reduce((total, factor) => total + factor, 0) / factors.length,
    ),
    9_300,
    11_000,
  );
}

export function referenceFactors(
  familyId: string,
  category: string,
  marketCycle: number,
  ageRoll: number,
) {
  const hash = stableHash(familyId);
  const [trendMin, trendMax] = VALUATION_CONFIG.trendRangeBps;
  const trendBps =
    trendMin +
    ((hash + Math.max(0, marketCycle) * 131) % (trendMax - trendMin + 1));
  const seasonIndex =
    (Math.floor(Math.max(0, marketCycle) / 4) + stableHash(category)) %
    VALUATION_CONFIG.seasonBps.length;
  const [ageMin, ageMax] = VALUATION_CONFIG.ageRangeBps;
  return {
    trendBps,
    seasonBps: VALUATION_CONFIG.seasonBps[seasonIndex],
    ageBps: interpolate(ageMin, ageMax, ageRoll),
  };
}

export function instanceFairValueMinor(input: {
  baseValueMinor: number;
  variantBps: number;
  condition: number;
  attributes: ItemAttribute[];
  accessoryComplete: boolean;
  defectPenaltyBps: number;
  rarity: number;
  trendBps: number;
  seasonBps: number;
  ageBps: number;
}) {
  const rarityIndex = clamp(
    Math.round(input.rarity) - 1,
    0,
    VALUATION_CONFIG.rarityBps.length - 1,
  );
  const factors = [
    input.trendBps,
    input.variantBps,
    input.ageBps,
    input.seasonBps,
    conditionFactorBps(input.condition),
    attributeFactorBps(input.attributes),
    input.accessoryComplete ? 10_000 : VALUATION_CONFIG.accessoryMissingBps,
    clamp(10_000 - input.defectPenaltyBps, 5_000, 10_000),
    VALUATION_CONFIG.rarityBps[rarityIndex],
  ];
  const value = factors.reduce(
    (current, factor) => (current * factor) / 10_000,
    input.baseValueMinor,
  );
  return roundMinor(value);
}

const listingNoiseBps = (fairValueMinor: number) => {
  const progress =
    (fairValueMinor - VALUATION_CONFIG.highTicketMinor) /
    (VALUATION_CONFIG.fullCompressionMinor - VALUATION_CONFIG.highTicketMinor);
  return interpolate(
    VALUATION_CONFIG.listingNoiseLowTicketBps,
    VALUATION_CONFIG.listingNoiseHighTicketBps,
    progress,
  );
};

export function listingAskMinor(
  fairValueMinor: number,
  seller: SellerKind,
  urgency: number,
  noiseRoll: number,
) {
  const noiseWidth = listingNoiseBps(fairValueMinor);
  const noiseBps = Math.round((clamp(noiseRoll, 0, 1) * 2 - 1) * noiseWidth);
  const urgencyDiscountBps = Math.round(
    clamp(urgency, 0, 1) * VALUATION_CONFIG.urgencyDiscountMaxBps,
  );
  const askBps = clamp(
    VALUATION_CONFIG.sellerCenterBps[seller] + noiseBps - urgencyDiscountBps,
    7_000,
    13_000,
  );
  return roundMinor((fairValueMinor * askBps) / 10_000);
}

export function sellerFloorMinor(
  fairValueMinor: number,
  seller: SellerKind,
  urgency: number,
) {
  const urgencyDiscountBps = Math.round(clamp(urgency, 0, 1) * 600);
  return roundMinor(
    (fairValueMinor *
      (VALUATION_CONFIG.sellerFloorBps[seller] - urgencyDiscountBps)) /
      10_000,
  );
}

export function exitPricingBps(fairValueMinor: number) {
  const progress = clamp(
    (fairValueMinor - VALUATION_CONFIG.highTicketMinor) /
      (VALUATION_CONFIG.fullCompressionMinor -
        VALUATION_CONFIG.highTicketMinor),
    0,
    1,
  );
  return {
    quickSaleBps: interpolate(8_200, 8_700, progress),
    balancedAskingBps: interpolate(10_500, 10_300, progress),
  };
}

export const valuationRevision = VALUATION_CONFIG.revision;
