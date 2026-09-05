import { describe, expect, it } from "vitest";
import { initialState, validateState } from "../game";
import { purchaseListing, reconcileJournal } from "../domain/economy";
import {
  completeDuePreparations,
  preparationOutcome,
  startPreparation,
} from "../domain/preparation";
import { preparationPresentation } from "./preparationPresentation";
import type { PreparationKind } from "../domain/models";

function fixture() {
  const state = initialState(0, "SANDBOX");
  state.cashMinor = 100_000;
  state.transactionJournal[0].cashDeltaMinor = 100_000;
  const result = purchaseListing(state, state.listings[0], 20_000, 0);
  if (!result.ok) throw new Error(result.reason);
  return result.state;
}

describe("preparation previews", () => {
  it.each<PreparationKind>(["CLEAN", "TEST", "COMPLETE"])(
    "matches the actual %s outcome after save/load without charging twice",
    (kind) => {
      const state = fixture();
      const asset = state.ownedAssets[0];
      asset.instance.condition = asset.instance.family.conditionCap - 1;
      asset.instance.evidenceConfidence = 0.99;
      const definition = asset.instance.family.preparation.find(
        (action) => action.kind === kind,
      )!;
      const predicted = preparationOutcome(asset, definition);
      const started = startPreparation(state, asset.id, kind);
      if (!started.ok) throw new Error(started.reason);
      const restored = validateState(JSON.parse(JSON.stringify(started.state)));
      const completed = completeDuePreparations(
        restored,
        restored.gameTimeMin + definition.durationMin,
      );
      expect(completed.ownedAssets[0].instance).toMatchObject(predicted);
      expect(completed.cashMinor).toBe(state.cashMinor - definition.costMinor);
      expect(reconcileJournal(completed)).toEqual({
        cash: true,
        activeBookCost: true,
        realizedProfit: true,
      });
      expect(completeDuePreparations(completed, 100)).toEqual(completed);
      expect(
        preparationPresentation(asset, definition).join(" "),
      ).not.toContain(String(predicted.fairValueMinor));
    },
  );
  it("shows only the remaining condition improvement and explicitly names the cap", () => {
    const asset = fixture().ownedAssets[0];
    const action = asset.instance.family.preparation.find(
      (a) => a.kind === "CLEAN",
    )!;
    asset.instance.condition = asset.instance.family.conditionCap - 1;
    expect(preparationPresentation(asset, action)).toContain(
      "Kondisyon +1 puan",
    );
    asset.instance.condition = asset.instance.family.conditionCap;
    expect(preparationPresentation(asset, action)).toContain(
      "Kondisyon sınırda",
    );
    expect(preparationPresentation(asset, action)).toContain(
      "Değer etkisi +%1,8",
    );
    expect(preparationPresentation(asset, action)).toContain(
      "Satış hızı +2,5 puan",
    );
  });
  it("does not promise full confidence gains near the maximum", () => {
    const asset = fixture().ownedAssets[0];
    const action = asset.instance.family.preparation.find(
      (a) => a.kind === "TEST",
    )!;
    asset.instance.evidenceConfidence = 0.99;
    expect(preparationPresentation(asset, action)).toContain(
      "Bilgi güveni +1 puan",
    );
    asset.instance.evidenceConfidence = 1;
    expect(preparationPresentation(asset, action)).toContain(
      "Bilgi güveni tam",
    );
    expect(preparationPresentation(asset, action)).toContain(
      "Doğrudan değer artışı yok",
    );
  });
});
