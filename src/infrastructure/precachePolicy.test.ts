import { describe, expect, it } from "vitest";
import {
  avatarPrecachePaths,
  shouldPrecacheBuildAsset,
} from "../../vite.config";

describe("offline precache policy", () => {
  it("preloads the playable shell without forcing the whole image catalog", () => {
    expect(shouldPrecacheBuildAsset("assets/game.js")).toBe(true);
    expect(shouldPrecacheBuildAsset("assets/game.css")).toBe(true);
    expect(shouldPrecacheBuildAsset("assets/product.png")).toBe(false);
    expect(shouldPrecacheBuildAsset("assets/product.webp")).toBe(false);
    expect(shouldPrecacheBuildAsset("assets/game.js.map")).toBe(false);
  });

  it("keeps generated product art lazy while the six profile identities are explicit shell assets", () => {
    expect(avatarPrecachePaths).toHaveLength(6);
    expect(avatarPrecachePaths).toContain("/assets/avatars/pazar-kasifi.webp");
    expect(shouldPrecacheBuildAsset(avatarPrecachePaths[0])).toBe(false);
  });
});
