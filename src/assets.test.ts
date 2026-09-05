import { describe, expect, it } from "vitest";
import { families, initialState } from "./game";
import { heroFamilies } from "./content/families";
import {
  assetFor,
  hasDedicatedAsset,
  registeredAssetKeys,
  visualTreatmentFor,
} from "./assets";

describe("asset manifest and visual treatments", () => {
  it("registers every internal-alpha family and measured dedicated expansion", () => {
    expect(new Set(families.map((family) => family.assetKey)).size).toBe(60);
    expect(registeredAssetKeys).toHaveLength(60);
    for (const family of families) {
      expect(registeredAssetKeys).toContain(family.assetKey);
      expect(assetFor(family.assetKey, family.category)).toBeTruthy();
    }
    for (const family of heroFamilies) {
      expect(hasDedicatedAsset(family.assetKey)).toBe(true);
    }
    expect(hasDedicatedAsset("prd_board_game")).toBe(true);
    expect(hasDedicatedAsset("prd_portable_radio")).toBe(true);
    expect(hasDedicatedAsset("prd_fountain_pen")).toBe(true);
    expect(hasDedicatedAsset("prd_floor_lamp")).toBe(true);
  });

  it("returns a deterministic fallback for an unknown asset key", () => {
    expect(assetFor("missing-one")).toBe(assetFor("missing-two"));
    expect(assetFor("missing-one")).toBe(assetFor("prd_notebook"));
    expect(assetFor("missing-camera", "Fotoğraf")).not.toBe(
      assetFor("missing-computer", "Bilgisayar"),
    );
    expect(assetFor("missing-camera", "Fotoğraf")).toContain(
      "data:image/svg+xml",
    );
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
