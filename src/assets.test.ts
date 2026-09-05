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
    expect(new Set(families.map((family) => family.assetKey)).size).toBe(64);
    expect(registeredAssetKeys).toHaveLength(64);
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
    expect(hasDedicatedAsset("prd_game_cartridge")).toBe(true);
    expect(hasDedicatedAsset("prd_perfume_set")).toBe(true);
    expect(hasDedicatedAsset("prd_makeup_set")).toBe(true);
    expect(hasDedicatedAsset("prd_trench_coat")).toBe(true);
    expect(hasDedicatedAsset("prd_leather_bag")).toBe(true);
    expect(hasDedicatedAsset("prd_vr_headset")).toBe(true);
    expect(hasDedicatedAsset("prd_robot_vacuum")).toBe(true);
    expect(hasDedicatedAsset("prd_camera_lens")).toBe(true);
    expect(hasDedicatedAsset("prd_fold_phone")).toBe(true);
    expect(hasDedicatedAsset("prd_racing_wheel")).toBe(true);
    expect(hasDedicatedAsset("prd_stand_mixer")).toBe(true);
    expect(hasDedicatedAsset("prd_studio_monitor")).toBe(true);
    expect(hasDedicatedAsset("prd_dac_amp")).toBe(true);
    expect(hasDedicatedAsset("prd_cassette_player")).toBe(true);
    expect(hasDedicatedAsset("prd_e_reader")).toBe(true);
    expect(hasDedicatedAsset("prd_mobile_projector")).toBe(true);
    expect(hasDedicatedAsset("prd_monitor")).toBe(true);
    expect(hasDedicatedAsset("prd_mini_pc")).toBe(true);
    expect(hasDedicatedAsset("prd_mechanical_keyboard")).toBe(true);
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
