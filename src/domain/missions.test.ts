import { describe, expect, it } from "vitest";
import { getActiveMissions } from "./missions";
import { initialState } from "../game";

describe("missions domain module", () => {
  it("generates deterministic missions with progress matching game state", () => {
    const state = initialState(0, "SANDBOX");
    const missions = getActiveMissions(state);

    expect(missions).toHaveLength(3);
    expect(missions[0].id).toBe("prep_mastery");
    expect(missions[0].completed).toBe(false);
    expect(missions[1].id).toBe("profitable_trader");
    expect(missions[2].id).toBe("market_volume");
  });

  it("marks missions completed when condition criteria are met", () => {
    const state = initialState(0, "SANDBOX");
    state.ownedAssets = [
      {
        id: "a1",
        state: "SOLD_COMPLETE",
        instance: {
          preparationHistory: [
            { id: "p1" },
            { id: "p2" },
          ],
        },
      } as any,
    ];
    state.transactionJournal.push(
      { kind: "SALE", realizedProfitDeltaMinor: 5000 } as any,
      { kind: "SALE", realizedProfitDeltaMinor: 6000 } as any,
      { kind: "SALE", realizedProfitDeltaMinor: 7000 } as any,
    );

    const missions = getActiveMissions(state);
    expect(missions.find((m) => m.id === "prep_mastery")?.completed).toBe(true);
    expect(missions.find((m) => m.id === "profitable_trader")?.completed).toBe(true);
  });
});
