import { describe, expect, it } from "vitest";
import {
  applyOffline,
  initialState,
  market,
  resolveOffer,
  sellerFloor,
  wealth,
} from "./game";
describe("deterministic economy", () => {
  it("replays the same market for the same seed and cycle", () => {
    const a = market(42, 5000, 3).map((x) => [
      x.family.id,
      x.price,
      x.condition,
    ]);
    const b = market(42, 5000, 3).map((x) => [
      x.family.id,
      x.price,
      x.condition,
    ]);
    expect(a).toEqual(b);
  });
  it("keeps cash separate from inventory wealth", () => {
    const s = initialState();
    s.cash = 10;
    s.inventory = [
      {
        id: "x",
        family: s.listings[0].family,
        paid: 100,
        fair: 500,
        condition: 80,
        acquiredAt: 0,
      },
    ];
    expect(wealth(s)).toBe(510);
    expect(s.cash).toBe(10);
  });
  it("keeps negotiation floor stable", () => {
    const item = market(8, 1000)[0];
    const floor = sellerFloor(item);
    resolveOffer(item, 20, 1);
    expect(sellerFloor(item)).toBe(floor);
  });
  it("clamps offline time and preserves a usable market", () => {
    const s = initialState();
    s.lastSeenAt = 0;
    expect(
      applyOffline(s, 10 * 60 * 60 * 1000).listings.length,
    ).toBeGreaterThanOrEqual(8);
  });
});
