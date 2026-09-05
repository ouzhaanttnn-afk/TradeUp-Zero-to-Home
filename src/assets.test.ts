import { describe, expect, it } from "vitest";
import { families, initialState } from "./game";
import {
  assetFor,
  hasDedicatedAsset,
  registeredAssetKeys,
  visualTreatmentFor,
} from "./assets";

describe("asset manifest and visual treatments", () => {
  it("registers one stable asset key for every hero family", () => {
    expect(new Set(families.map((family) => family.assetKey)).size).toBe(24);
    expect(registeredAssetKeys).toHaveLength(24);
    for (const family of families) {
      expect(registeredAssetKeys).toContain(family.assetKey);
      expect(assetFor(family.assetKey)).toBeTruthy();
      expect(hasDedicatedAsset(family.assetKey)).toBe(true);
    }
  });

  it("returns a deterministic fallback for an unknown asset key", () => {
    expect(assetFor("missing-one")).toBe(assetFor("missing-two"));
    expect(assetFor("missing-one")).toBe(assetFor("prd_notebook"));
  });

  it("never reveals an unverified defect through the visual layer", () => {
    const listing = initialState(0, "SANDBOX").listings[0];
    const hiddenDefect = {
      ...listing.instance,
      defects: listing.instance.defects.map((defect, index) => ({
        ...defect,
        present: index === 0,
        revealed: false,
      })),
    };
    expect(visualTreatmentFor(hiddenDefect).revealedDefect).toBe(false);
    const revealed = {
      ...hiddenDefect,
      defects: hiddenDefect.defects.map((defect, index) => ({
        ...defect,
        revealed: index === 0,
      })),
    };
    expect(visualTreatmentFor(revealed).revealedDefect).toBe(true);
  });
});
