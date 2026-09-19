import { describe, expect, it } from "vitest";
import {
  activeMarketEvent,
  eventAffectsCategory,
  MARKET_EVENTS,
  radarSignal,
} from "./marketEvents";

describe("controlled market events", () => {
  it("keeps the first hours free from events and leaves quiet gaps", () => {
    expect(activeMarketEvent(1, 179)).toBeNull();
    expect(activeMarketEvent(1, 180)).not.toBeNull();
    expect(activeMarketEvent(1, 300)).toBeNull();
  });

  it("is deterministic and caps demand effects to a restrained range", () => {
    expect(activeMarketEvent(90421, 180)).toEqual(
      activeMarketEvent(90421, 180),
    );
    const event = activeMarketEvent(90421, 180)!;
    expect(event.demandMultiplier).toBeGreaterThanOrEqual(0.9);
    expect(event.demandMultiplier).toBeLessThanOrEqual(1.3);
    expect(eventAffectsCategory(event, "unrelated")).toBe(
      event.affectedCategories.length === 0,
    );
  });
});

describe("Pazar Radarı", () => {
  it("is null outside any event window (Normal)", () => {
    expect(radarSignal(1, 300)).toBeNull();
  });

  it("surfaces HIGH/RISING windows with 1-3 categories and a matching headline", () => {
    for (let gameTimeMin = 180; gameTimeMin < 180 + 360 * 6; gameTimeMin += 1) {
      const signal = radarSignal(90421, gameTimeMin);
      if (!signal) continue;
      expect(signal.categories.length).toBeGreaterThanOrEqual(1);
      expect(signal.categories.length).toBeLessThanOrEqual(3);
      expect(["HIGH", "RISING"]).toContain(signal.tier);
      expect(signal.headline).toBe(
        signal.tier === "HIGH" ? "Talep yüksek" : "Yükselişte",
      );
    }
  });

  it("never surfaces a CALM event or one with no categories", () => {
    const calmOrGlobal = MARKET_EVENTS.filter(
      (event) => event.radarTier === "CALM" || event.affectedCategories.length === 0,
    );
    expect(calmOrGlobal.length).toBeGreaterThan(0);
    for (const event of calmOrGlobal) {
      expect(event.radarTier).toBe("CALM");
    }
  });

  it("is a pure function of seed and game time -- nothing new to persist", () => {
    expect(radarSignal(90421, 400)).toEqual(radarSignal(90421, 400));
  });
});
