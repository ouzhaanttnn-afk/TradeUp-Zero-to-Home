import { describe, expect, it } from "vitest";
import {
  avatarPrecachePaths,
  deliveryBudgetViolation,
  deliveryBudgets,
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

  it("fails future builds that regress entry, chunk or stylesheet delivery budgets", () => {
    expect(
      deliveryBudgetViolation(
        "assets/index.js",
        deliveryBudgets.entryJavaScriptBytes,
        true,
      ),
    ).toBeUndefined();
    expect(
      deliveryBudgetViolation(
        "assets/index.js",
        deliveryBudgets.entryJavaScriptBytes + 1,
        true,
      ),
    ).toContain("delivery budget");
    expect(
      deliveryBudgetViolation(
        "assets/shared.js",
        deliveryBudgets.chunkJavaScriptBytes + 1,
      ),
    ).toContain("delivery budget");
    expect(
      deliveryBudgetViolation(
        "assets/index.css",
        deliveryBudgets.stylesheetBytes + 1,
      ),
    ).toContain("delivery budget");
    expect(deliveryBudgetViolation("assets/product.webp", 10_000_000)).toBe(
      undefined,
    );
  });
});
