import { describe, expect, it } from "vitest";
import { sanitizeAppearance } from "./appearance";
import type { EntitlementState } from "./models";

const owned = (entitlementId: EntitlementState["entitlementId"]): EntitlementState => ({
  productId:
    entitlementId === "premium_lifetime"
      ? "tradeup_premium_lifetime"
      : entitlementId === "theme_night_market"
        ? "tradeup_theme_night_market"
        : entitlementId === "theme_workshop"
          ? "tradeup_theme_workshop"
          : "tradeup_home_styles_01",
  entitlementId,
  status: "OWNED",
  platform: "ios",
});

describe("appearance entitlements", () => {
  it("falls back when a cosmetic entitlement is absent or revoked", () => {
    expect(
      sanitizeAppearance(
        { shellTheme: "night-market", homeInteriorStyle: "coastal" },
        [],
      ),
    ).toEqual({ shellTheme: "classic", homeInteriorStyle: "classic" });
  });

  it("keeps owned themes and home styles", () => {
    expect(
      sanitizeAppearance(
        { shellTheme: "obsidian", homeInteriorStyle: "heritage" },
        [owned("premium_lifetime"), owned("home_styles_01")],
      ),
    ).toEqual({ shellTheme: "obsidian", homeInteriorStyle: "heritage" });
  });
});
