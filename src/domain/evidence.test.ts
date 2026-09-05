import { describe, expect, it } from "vitest";
import { initialState, validateState } from "../game";
import { inspectListing } from "./decision";
import { purchaseListing, reconcileJournal } from "./economy";
import { confirmedEvidenceStatus } from "./evidence";
import { completeDuePreparations, startPreparation } from "./preparation";

function fixture(present: boolean) {
  const state = initialState(0, "SANDBOX");
  state.cashMinor = 100_000;
  state.transactionJournal[0].cashDeltaMinor = 100_000;
  const listing = state.listings[0];
  listing.instance.defects = listing.instance.family.defects.map(
    (definition) => ({
      definitionId: definition.id,
      present,
      revealed: false,
    }),
  );
  return state;
}

describe("truthful evidence verification", () => {
  it.each([true, false])(
    "reports actual defect presence (%s) after preparation and save/load",
    (present) => {
      const state = fixture(present);
      const purchased = purchaseListing(state, state.listings[0], 20_000, 0);
      if (!purchased.ok) throw new Error(purchased.reason);
      const asset = purchased.state.ownedAssets[0];
      const started = startPreparation(purchased.state, asset.id, "TEST");
      if (!started.ok) throw new Error(started.reason);
      const done = completeDuePreparations(started.state, started.durationMin);
      const restored = validateState(JSON.parse(JSON.stringify(done)));
      expect(
        restored.ownedAssets[0].instance.evidence.every(
          (record) => record.status === (present ? "CHECKED" : "VERIFIED"),
        ),
      ).toBe(true);
      expect(
        restored.ownedAssets[0].instance.defects.every(
          (defect) => defect.revealed && defect.present === present,
        ),
      ).toBe(true);
      expect(restored.ownedAssets[0].instance.fairValueMinor).toBe(
        asset.instance.fairValueMinor,
      );
      expect(reconcileJournal(restored)).toEqual({
        cash: true,
        activeBookCost: true,
        realizedProfit: true,
      });
      expect(completeDuePreparations(restored, 100)).toEqual(restored);
    },
  );
  it.each([true, false])(
    "preserves a tested result (%s) through photo and seller checks",
    (present) => {
      const state = fixture(present);
      const listing = state.listings[0];
      // A previously revealed fact outside this quick test must remain visible.
      listing.instance.defects[0].revealed = true;
      const tested = inspectListing(state, listing.id, "QUICK_TEST");
      if (!tested.ok) throw new Error(tested.reason);
      const confirmed = tested.state.listings[0].instance.evidence.filter((e) =>
        ["CHECKED", "VERIFIED"].includes(e.status),
      );
      expect(confirmed.length).toBeGreaterThan(0);
      let current = tested.state;
      for (const kind of ["PHOTO", "ASK_SELLER"] as const) {
        const result = inspectListing(current, listing.id, kind);
        if (!result.ok) throw new Error(result.reason);
        current = result.state;
      }
      for (const record of confirmed) {
        expect(
          current.listings[0].instance.evidence.find(
            (e) => e.definitionId === record.definitionId,
          ),
        ).toEqual(record);
      }
      expect(current.listings[0].instance.defects[0].revealed).toBe(true);
    },
  );
  it("detects any present defect when multiple defects share one evidence item", () => {
    const instance = fixture(false).listings[0].instance;
    const definition = instance.family.defects[0];
    instance.family = {
      ...instance.family,
      defects: [
        ...instance.family.defects,
        { ...definition, id: "additional" },
      ],
    };
    instance.defects.push({
      definitionId: "additional",
      present: true,
      revealed: false,
    });
    expect(confirmedEvidenceStatus(instance, definition.evidenceId)).toBe(
      "CHECKED",
    );
  });
});
