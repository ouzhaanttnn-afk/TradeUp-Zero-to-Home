import { describe, expect, it } from "vitest";
import { activeMarketEvent, eventAffectsCategory } from "./marketEvents";

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
    expect(event.demandMultiplier).toBeLessThanOrEqual(1.12);
    expect(eventAffectsCategory(event, "unrelated")).toBe(
      event.affectedCategories.length === 0,
    );
  });
});
