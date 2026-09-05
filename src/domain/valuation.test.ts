import { describe, expect, it } from "vitest";
import { familyById } from "../content/families";
import { market } from "../game";
import {
  attributeFactorBps,
  conditionFactorBps,
  instanceFairValueMinor,
  listingAskMinor,
  referenceFactors,
  sellerFloorMinor,
} from "./valuation";

describe("canonical valuation engine", () => {
  it("keeps representative Turkish second-hand categories in credible order", () => {
    const trench = familyById("trench_coat")!;
    const bag = familyById("leather_bag")!;
    const controller = familyById("controller")!;
    const console = familyById("console")!;
    const laptop = familyById("laptop")!;
    const camera = familyById("camera")!;

    expect(trench.baseValueMinor).toBeGreaterThanOrEqual(100_000);
    expect(trench.baseValueMinor).toBeLessThanOrEqual(200_000);
    expect(bag.baseValueMinor).toBeGreaterThan(trench.baseValueMinor);
    expect(bag.baseValueMinor).toBeLessThanOrEqual(400_000);
    expect(console.baseValueMinor).toBeGreaterThan(controller.baseValueMinor);
    expect(laptop.baseValueMinor).toBeGreaterThan(console.baseValueMinor);
    expect(camera.baseValueMinor).toBeGreaterThan(laptop.baseValueMinor);
  });

  it("prices condition, attributes, accessories and defects causally", () => {
    expect(conditionFactorBps(90)).toBeGreaterThan(conditionFactorBps(60));
    expect(
      attributeFactorBps([
        { definitionId: "material", value: "Pro" },
        { definitionId: "quality", value: 90 },
        { definitionId: "complete", value: true },
      ]),
    ).toBeGreaterThan(
      attributeFactorBps([
        { definitionId: "material", value: "Temel" },
        { definitionId: "quality", value: 20 },
        { definitionId: "complete", value: false },
      ]),
    );

    const common = {
      baseValueMinor: 275_000,
      variantBps: 10_000,
      condition: 82,
      attributes: [{ definitionId: "material", value: "Plus" }],
      rarity: 1,
      trendBps: 10_000,
      seasonBps: 10_000,
      ageBps: 10_000,
    };
    const complete = instanceFairValueMinor({
      ...common,
      accessoryComplete: true,
      defectPenaltyBps: 0,
    });
    const incomplete = instanceFairValueMinor({
      ...common,
      accessoryComplete: false,
      defectPenaltyBps: 1_600,
    });
    expect(complete).toBeGreaterThan(incomplete);
  });

  it("keeps market factors deterministic and capped", () => {
    const first = referenceFactors("leather_bag", "Moda/Bakım", 12, 0.4);
    const replay = referenceFactors("leather_bag", "Moda/Bakım", 12, 0.4);
    expect(replay).toEqual(first);
    expect(first.trendBps).toBeGreaterThanOrEqual(9_700);
    expect(first.trendBps).toBeLessThanOrEqual(10_300);
    expect(first.seasonBps).toBeGreaterThanOrEqual(9_700);
    expect(first.seasonBps).toBeLessThanOrEqual(10_300);
  });

  it("makes seller profile and urgency matter without breaking price caps", () => {
    const fair = 300_000;
    const urgent = listingAskMinor(fair, "urgent", 0.8, 0.5);
    const emotional = listingAskMinor(fair, "emotional", 0.1, 0.5);
    expect(emotional).toBeGreaterThan(urgent);
    expect(sellerFloorMinor(fair, "urgent", 1)).toBeLessThan(
      sellerFloorMinor(fair, "urgent", 0),
    );
    expect(listingAskMinor(fair, "uninformed", 0, 0)).toBeGreaterThanOrEqual(
      fair * 0.7,
    );
    expect(listingAskMinor(fair, "emotional", 0, 1)).toBeLessThanOrEqual(
      fair * 1.3,
    );
  });

  it("compresses percentage noise for high-ticket products", () => {
    const low = 300_000;
    const high = 5_000_000;
    const lowSpread =
      (listingAskMinor(low, "expert", 0, 1) -
        listingAskMinor(low, "expert", 0, 0)) /
      low;
    const highSpread =
      (listingAskMinor(high, "expert", 0, 1) -
        listingAskMinor(high, "expert", 0, 0)) /
      high;
    expect(highSpread).toBeLessThan(lowSpread);
  });

  it("keeps generated trench-coat and leather-bag listings in distinct credible bands", () => {
    const listings = Array.from({ length: 160 }, (_, cycle) =>
      market(90_421, 100_000_000, cycle, cycle * 2, 24),
    ).flat();
    const trenchPrices = listings
      .filter((listing) => listing.familyId === "trench_coat")
      .map((listing) => listing.priceMinor);
    const bagPrices = listings
      .filter((listing) => listing.familyId === "leather_bag")
      .map((listing) => listing.priceMinor);

    expect(trenchPrices.length).toBeGreaterThan(20);
    expect(bagPrices.length).toBeGreaterThan(20);
    expect(Math.min(...trenchPrices)).toBeGreaterThanOrEqual(50_000);
    expect(Math.max(...trenchPrices)).toBeLessThanOrEqual(220_000);
    expect(Math.min(...bagPrices)).toBeGreaterThanOrEqual(100_000);
    expect(Math.max(...bagPrices)).toBeLessThanOrEqual(500_000);
    expect(
      bagPrices.reduce((sum, price) => sum + price, 0) / bagPrices.length,
    ).toBeGreaterThan(
      trenchPrices.reduce((sum, price) => sum + price, 0) / trenchPrices.length,
    );
  });
});
