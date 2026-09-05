import { describe, expect, it } from "vitest";
import { initialState, market, rng, validateState } from "../game";
import { families } from "../content/families";
import { BUYER_TEMPO_CONFIG } from "./config";
import {
  createPlayerListing,
  purchaseListing,
  quoteAssetExit,
  reconcileJournal,
} from "./economy";
import { advanceWorldTo, buyerOfferForMinute } from "./world";

const baseline = { minimumAgeMin: 3, arrivalMultiplier: 1 };
function fixture() {
  const state = initialState(0, "SANDBOX");
  const purchased = purchaseListing(state, state.listings[0], 100, 0);
  if (!purchased.ok) throw new Error(purchased.reason);
  const asset = purchased.state.ownedAssets[0];
  const listed = createPlayerListing(
    purchased.state,
    asset.id,
    quoteAssetExit(asset).balancedAskingMinor,
    0,
  );
  if (!listed.ok) throw new Error(listed.reason);
  return listed.state;
}

describe("user-approved buyer wait calibration", () => {
  it("measures first offers across all families without guaranteeing immediate buyers", () => {
    const template = fixture();
    const oldWaits: number[] = [];
    const newWaits: number[] = [];
    let unchangedOffers = 0;
    for (const family of families) {
      for (let sample = 1; sample <= 128; sample++) {
        const seed = Math.floor(rng(sample * 104_729)() * 0xffffffff);
        const instance = {
          ...market(seed, 100_000, 0, 0, 1)[0].instance,
          family,
        };
        const asset = {
          ...template.ownedAssets[0],
          familyId: family.id,
          instance,
        };
        const listing = {
          ...template.playerListings[0],
          id: `tempo:${family.id}:${seed}`,
          askingPriceMinor: quoteAssetExit(asset).balancedAskingMinor,
        };
        const state = {
          ...template,
          seed,
          ownedAssets: [asset],
          playerListings: [listing],
        };
        let previousWait = 181;
        let currentWait = 181;
        for (let minute = 1; minute <= 180; minute++) {
          const oldOffer = buyerOfferForMinute(
            state,
            listing,
            minute,
            0,
            baseline,
          );
          const newOffer = buyerOfferForMinute(state, listing, minute);
          if (oldOffer && previousWait === 181) previousWait = minute;
          if (newOffer && currentWait === 181) currentWait = minute;
          if (oldOffer) {
            expect(newOffer).toEqual(oldOffer);
            unchangedOffers++;
          }
          if (previousWait < 181 && currentWait < 181) break;
        }
        expect(currentWait).toBeLessThanOrEqual(previousWait);
        oldWaits.push(previousWait);
        newWaits.push(currentWait);
      }
    }
    const stats = (waits: number[]) => {
      const sorted = [...waits].sort((a, b) => a - b);
      return {
        median: sorted[Math.floor(sorted.length * 0.5)],
        p90: sorted[Math.floor(sorted.length * 0.9)],
        within10MinPercent: Math.round(
          (100 * waits.filter((wait) => wait <= 10).length) / waits.length,
        ),
        noOfferWithin180: waits.filter((wait) => wait === 181).length,
      };
    };
    const oldStats = stats(oldWaits);
    const newStats = stats(newWaits);
    console.info(
      JSON.stringify({
        samples: newWaits.length,
        old: oldStats,
        current: newStats,
      }),
    );
    expect(newStats.median).toBeLessThan(oldStats.median);
    expect(newStats.p90).toBeLessThan(oldStats.p90);
    expect(newWaits.some((wait) => wait === 1)).toBe(true);
    expect(newWaits.some((wait) => wait > 10)).toBe(true);
    expect(unchangedOffers).toBeGreaterThan(0);
  });

  it("has no offer at listing creation and preserves pending offers", () => {
    const state = fixture();
    const listing = state.playerListings[0];
    expect(BUYER_TEMPO_CONFIG.minimumAgeMin).toBe(1);
    expect(buyerOfferForMinute(state, listing, 0)).toBeUndefined();
    let offered = state;
    for (let minute = 1; minute <= 180 && !offered.buyerOffers.length; minute++)
      offered = advanceWorldTo(offered, minute).state;
    expect(offered.buyerOffers).toHaveLength(1);
    const existing = offered.buyerOffers[0];
    offered = validateState(JSON.parse(JSON.stringify(offered)));
    const next = advanceWorldTo(offered, offered.gameTimeMin + 1).state;
    expect(next.buyerOffers).toEqual([existing]);
    expect(next.cashMinor).toBe(state.cashMinor);
    expect(next.transactionJournal).toEqual(state.transactionJournal);
    expect(reconcileJournal(next)).toEqual({
      cash: true,
      activeBookCost: true,
      realizedProfit: true,
    });
  });

  it("replays the same world after save/load or split time advancement", () => {
    const state = fixture();
    const direct = advanceWorldTo(state, 40).state;
    const midway = validateState(
      JSON.parse(JSON.stringify(advanceWorldTo(state, 10).state)),
    );
    expect(validateState(advanceWorldTo(midway, 40).state)).toEqual(
      validateState(direct),
    );
  });
});
