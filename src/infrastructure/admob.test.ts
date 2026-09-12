import { describe, expect, it, vi } from "vitest";
import {
  classifyAdMobFailure,
  createAdMobAdapters,
  isProductionAdServingEnabled,
  resolveRewardedAdId,
} from "./admob";

describe("AdMob production safety", () => {
  it("enables production serving only for the exact explicit flag", () => {
    expect(isProductionAdServingEnabled("true")).toBe(true);
    expect(isProductionAdServingEnabled("TRUE")).toBe(false);
    expect(isProductionAdServingEnabled(true)).toBe(false);
    expect(isProductionAdServingEnabled(undefined)).toBe(false);
  });

  it("uses official demo units until the production gate is enabled", () => {
    expect(resolveRewardedAdId("MARKET_SCOUT", "ios", false)).toBe(
      "ca-app-pub-3940256099942544/1712485313",
    );
    expect(resolveRewardedAdId("LISTING_REACH", "android", false)).toBe(
      "ca-app-pub-3940256099942544/5224354917",
    );
    expect(resolveRewardedAdId("MARKET_SCOUT", "android", true)).toBeNull();
  });

  it("keeps all four iOS production placements distinct", () => {
    const ids = [
      "MARKET_SCOUT",
      "FAST_INSPECTION",
      "FAST_PREPARATION",
      "LISTING_REACH",
    ].map((placement) =>
      resolveRewardedAdId(
        placement as Parameters<typeof resolveRewardedAdId>[0],
        "ios",
        true,
      ),
    );
    expect(new Set(ids).size).toBe(4);
    expect(ids.every((id) => id?.startsWith("ca-app-pub-"))).toBe(true);
  });
});

describe("AdMob native adapters", () => {
  it("does not request an ad before consent allows it", async () => {
    const port = {
      initialize: vi.fn().mockResolvedValue(undefined),
      requestConsentInfo: vi.fn().mockResolvedValue({
        status: "NOT_REQUIRED",
        canRequestAds: false,
        privacyOptionsRequirementStatus: "NOT_REQUIRED",
      }),
      showConsentForm: vi.fn(),
      showPrivacyOptionsForm: vi.fn(),
      prepareRewardVideoAd: vi.fn(),
      showRewardVideoAd: vi.fn(),
    };
    const adapters = createAdMobAdapters(port as never, {
      platform: "ios",
      productionEnabled: false,
    });
    await adapters.consent.refresh();
    expect(await adapters.rewarded.show("MARKET_SCOUT")).toEqual({
      status: "FAILED",
      reason: "PROVIDER",
    });
    expect(port.prepareRewardVideoAd).not.toHaveBeenCalled();
  });

  it("grants only after the rewarded show promise resolves", async () => {
    const port = {
      initialize: vi.fn().mockResolvedValue(undefined),
      requestConsentInfo: vi.fn().mockResolvedValue({
        status: "NOT_REQUIRED",
        canRequestAds: true,
        privacyOptionsRequirementStatus: "NOT_REQUIRED",
      }),
      showConsentForm: vi.fn(),
      showPrivacyOptionsForm: vi.fn(),
      prepareRewardVideoAd: vi.fn().mockResolvedValue({ adUnitId: "test" }),
      showRewardVideoAd: vi.fn().mockResolvedValue({ amount: 1, type: "test" }),
    };
    const adapters = createAdMobAdapters(port as never, {
      platform: "ios",
      productionEnabled: false,
    });
    await adapters.consent.refresh();
    const result = await adapters.rewarded.show("FAST_INSPECTION");
    expect(result.status).toBe("USER_EARNED");
    expect(port.prepareRewardVideoAd).toHaveBeenCalledWith(
      expect.objectContaining({ isTesting: true, npa: true }),
    );
  });

  it("classifies provider failures without exposing native error details", () => {
    expect(classifyAdMobFailure(new Error("No fill"))).toBe("NO_FILL");
    expect(classifyAdMobFailure(new Error("Network timeout"))).toBe("NETWORK");
    expect(classifyAdMobFailure(new Error("unknown"))).toBe("PROVIDER");
  });
});
