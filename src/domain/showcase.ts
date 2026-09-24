import type { HomeState, OwnedAsset } from "./models";

export const DEFAULT_SHOWCASE_CAPACITY = 3;
export const EXPANDED_SHOWCASE_CAPACITY = 5;

export function maxShowcaseCapacity(home?: HomeState): number {
  if (!home?.purchased || !home.purchasedHomeId) {
    return DEFAULT_SHOWCASE_CAPACITY;
  }
  if (
    home.purchasedHomeId === "stone_courtyard" ||
    home.purchasedHomeId === "coastal_villa"
  ) {
    return EXPANDED_SHOWCASE_CAPACITY;
  }
  return DEFAULT_SHOWCASE_CAPACITY;
}

export function isShowcaseItem(
  showcaseAssetIds: readonly string[] | undefined,
  assetId: string,
): boolean {
  return Boolean(showcaseAssetIds && showcaseAssetIds.includes(assetId));
}

export function toggleShowcaseItem(
  showcaseAssetIds: readonly string[] = [],
  assetId: string,
  capacity = DEFAULT_SHOWCASE_CAPACITY,
): {
  showcaseAssetIds: string[];
  added: boolean;
  reason?: "CAPACITY_REACHED";
} {
  if (showcaseAssetIds.includes(assetId)) {
    return {
      showcaseAssetIds: showcaseAssetIds.filter((id) => id !== assetId),
      added: false,
    };
  }
  if (showcaseAssetIds.length >= capacity) {
    return {
      showcaseAssetIds: [...showcaseAssetIds],
      added: false,
      reason: "CAPACITY_REACHED",
    };
  }
  return {
    showcaseAssetIds: [...showcaseAssetIds, assetId],
    added: true,
  };
}

export function getShowcaseAssets(
  ownedAssets: readonly OwnedAsset[],
  showcaseAssetIds: readonly string[] = [],
): OwnedAsset[] {
  return showcaseAssetIds
    .map((id) => ownedAssets.find((asset) => asset.id === id))
    .filter((asset): asset is OwnedAsset => asset !== undefined);
}
