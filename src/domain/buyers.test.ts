import { describe, expect, it } from "vitest";
import { initialState } from "../game";
import { purchaseListing } from "./economy";
import { BUYER_PERSONAS, eligibleBuyerTypes } from "./buyers";

describe("buyer personas", () => {
  it("keeps risk-sensitive personas away from weak evidence", () => {
    const state = initialState(0, "SANDBOX");
    state.cashMinor = Number.MAX_SAFE_INTEGER;
    const purchase = purchaseListing(state, state.listings[0], 100, 0);
    if (!purchase.ok) throw new Error(purchase.reason);
    const asset = purchase.state.ownedAssets[0];
    asset.instance.evidenceConfidence = 0.3;
    expect(eligibleBuyerTypes(purchase.state, asset)).toEqual([
      "QUICK",
      "NEGOTIATOR",
    ]);
  });

  it("gives readable and mechanically distinct tendencies", () => {
    expect(BUYER_PERSONAS.QUALITY.amountMultiplier).toBeGreaterThan(
      BUYER_PERSONAS.QUICK.amountMultiplier,
    );
    expect(BUYER_PERSONAS.NEGOTIATOR.counterAcceptBelow).toBeLessThan(
      BUYER_PERSONAS.QUICK.counterAcceptBelow,
    );
    for (const persona of Object.values(BUYER_PERSONAS)) {
      expect(persona.label).toBeTruthy();
      expect(persona.tendency).toBeTruthy();
      expect(persona.names.length).toBeGreaterThan(0);
    }
  });
});
