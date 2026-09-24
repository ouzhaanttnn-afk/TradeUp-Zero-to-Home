import { describe, expect, it } from "vitest";
import {
  DEFAULT_SHOWCASE_CAPACITY,
  EXPANDED_SHOWCASE_CAPACITY,
  getShowcaseAssets,
  isShowcaseItem,
  maxShowcaseCapacity,
  toggleShowcaseItem,
} from "./showcase";
import type { OwnedAsset } from "./models";

describe("showcase domain module", () => {
  it("determines showcase capacity based on purchased home tier", () => {
    expect(maxShowcaseCapacity(undefined)).toBe(DEFAULT_SHOWCASE_CAPACITY);
    expect(
      maxShowcaseCapacity({
        unlocked: true,
        purchased: true,
        purchasedHomeId: "garden_edge",
        progressMilestones: [],
      }),
    ).toBe(DEFAULT_SHOWCASE_CAPACITY);
    expect(
      maxShowcaseCapacity({
        unlocked: true,
        purchased: true,
        purchasedHomeId: "stone_courtyard",
        progressMilestones: [],
      }),
    ).toBe(EXPANDED_SHOWCASE_CAPACITY);
  });

  it("toggles items in and out of showcase within capacity limits", () => {
    let list: string[] = [];
    const first = toggleShowcaseItem(list, "asset-1", 2);
    expect(first.added).toBe(true);
    list = first.showcaseAssetIds;

    const second = toggleShowcaseItem(list, "asset-2", 2);
    expect(second.added).toBe(true);
    list = second.showcaseAssetIds;

    const third = toggleShowcaseItem(list, "asset-3", 2);
    expect(third.added).toBe(false);
    expect(third.reason).toBe("CAPACITY_REACHED");
    expect(third.showcaseAssetIds).toHaveLength(2);

    const removeFirst = toggleShowcaseItem(list, "asset-1", 2);
    expect(removeFirst.added).toBe(false);
    expect(removeFirst.showcaseAssetIds).toEqual(["asset-2"]);
    expect(isShowcaseItem(removeFirst.showcaseAssetIds, "asset-2")).toBe(true);
    expect(isShowcaseItem(removeFirst.showcaseAssetIds, "asset-1")).toBe(false);
  });

  it("filters and matches showcase assets correctly", () => {
    const assets: OwnedAsset[] = [
      { id: "a1" } as OwnedAsset,
      { id: "a2" } as OwnedAsset,
    ];
    expect(getShowcaseAssets(assets, ["a1", "missing"])).toEqual([assets[0]]);
  });
});
