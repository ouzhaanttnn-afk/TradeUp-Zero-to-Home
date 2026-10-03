import { describe, expect, it, vi } from "vitest";
import { RewardAdPluginEvents } from "@capacitor-community/admob";
import {
  classifyAdMobFailure,
  createAdMobAdapters,
  isProductionAdServingEnabled,
  resolveRewardedAdId,
  resolveTradeInterstitialId,
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

  it("uses a test interstitial until the iOS production gate opens", () => {
    expect(resolveTradeInterstitialId("ios", false)).toBe(
      "ca-app-pub-3940256099942544/4411468910",
    );
    expect(resolveTradeInterstitialId("ios", true)).toBe(
      "ca-app-pub-4229088811556918/1985851659",
    );
    expect(resolveTradeInterstitialId("android", true)).toBeNull();
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
      trackingAuthorizationStatus: vi
        .fn()
        .mockResolvedValue({ status: "denied" }),
      requestTrackingAuthorization: vi.fn(),
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
    expect(await adapters.showTradeInterstitial()).toBe(false);
  });

  it("tries one interstitial with the official test unit after consent", async () => {
    const port = {
      initialize: vi.fn().mockResolvedValue(undefined),
      requestConsentInfo: vi.fn().mockResolvedValue({
        status: "NOT_REQUIRED",
        canRequestAds: true,
        privacyOptionsRequirementStatus: "NOT_REQUIRED",
      }),
      showConsentForm: vi.fn(),
      showPrivacyOptionsForm: vi.fn(),
      trackingAuthorizationStatus: vi
        .fn()
        .mockResolvedValue({ status: "notDetermined" }),
      requestTrackingAuthorization: vi.fn().mockResolvedValue(undefined),
      prepareRewardVideoAd: vi.fn(),
      showRewardVideoAd: vi.fn(),
      prepareInterstitial: vi.fn().mockResolvedValue({ adUnitId: "test" }),
      showInterstitial: vi.fn().mockResolvedValue(undefined),
    };
    const adapters = createAdMobAdapters(port as never, {
      platform: "ios",
      productionEnabled: false,
    });
    await adapters.consent.refresh();
    expect(await adapters.showTradeInterstitial()).toBe(true);
    expect(port.prepareInterstitial).toHaveBeenCalledWith({
      adId: "ca-app-pub-3940256099942544/4411468910",
      isTesting: true,
      npa: true,
    });
    expect(port.requestTrackingAuthorization).toHaveBeenCalledOnce();
    expect(
      port.requestTrackingAuthorization.mock.invocationCallOrder[0],
    ).toBeLessThan(port.prepareInterstitial.mock.invocationCallOrder[0]);
    expect(port.showInterstitial).toHaveBeenCalledOnce();
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
      trackingAuthorizationStatus: vi
        .fn()
        .mockResolvedValue({ status: "denied" }),
      requestTrackingAuthorization: vi.fn(),
      prepareRewardVideoAd: vi.fn().mockResolvedValue({ adUnitId: "test" }),
      showRewardVideoAd: vi.fn().mockResolvedValue({ amount: 1, type: "test" }),
      addListener: vi.fn().mockResolvedValue({ remove: vi.fn() }),
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
    expect(port.requestTrackingAuthorization).not.toHaveBeenCalled();
  });

  it("skips the ad without granting a reward if the tracking permission flow fails", async () => {
    const port = {
      initialize: vi.fn().mockResolvedValue(undefined),
      requestConsentInfo: vi.fn().mockResolvedValue({
        status: "NOT_REQUIRED",
        canRequestAds: true,
        privacyOptionsRequirementStatus: "NOT_REQUIRED",
      }),
      showConsentForm: vi.fn(),
      showPrivacyOptionsForm: vi.fn(),
      trackingAuthorizationStatus: vi
        .fn()
        .mockResolvedValue({ status: "notDetermined" }),
      requestTrackingAuthorization: vi
        .fn()
        .mockRejectedValue(new Error("unavailable")),
      prepareRewardVideoAd: vi.fn(),
      showRewardVideoAd: vi.fn(),
    };
    const adapters = createAdMobAdapters(port as never, { platform: "ios" });
    await adapters.consent.refresh();
    expect(await adapters.rewarded.show("MARKET_SCOUT")).toEqual({
      status: "FAILED",
      reason: "PROVIDER",
    });
    expect(port.prepareRewardVideoAd).not.toHaveBeenCalled();
  });

  it("classifies provider failures without exposing native error details", () => {
    expect(classifyAdMobFailure(new Error("No fill"))).toBe("NO_FILL");
    expect(classifyAdMobFailure(new Error("Network timeout"))).toBe("NETWORK");
    expect(classifyAdMobFailure(new Error("unknown"))).toBe("PROVIDER");
  });

  it.each(["cancel", "failure", "earned", "timeout"] as const)(
    "settles and removes listeners after native %s even if show never resolves",
    async (scenario) => {
      const callbacks = new Map<string, () => void>();
      const remove = vi.fn().mockResolvedValue(undefined);
      const port = {
        initialize: vi.fn().mockResolvedValue(undefined),
        requestConsentInfo: vi.fn().mockResolvedValue({
          status: "NOT_REQUIRED",
          canRequestAds: true,
        }),
        trackingAuthorizationStatus: vi
          .fn()
          .mockResolvedValue({ status: "denied" }),
        requestTrackingAuthorization: vi.fn().mockResolvedValue(undefined),
        prepareRewardVideoAd: vi.fn().mockResolvedValue({}),
        showRewardVideoAd: vi.fn(() => new Promise(() => {})),
        addListener: vi.fn(async (event: string, callback: () => void) => {
          callbacks.set(event, callback);
          return { remove };
        }),
      };
      const adapters = createAdMobAdapters(port as never, {
        platform: "ios",
        rewardTimeoutMs: scenario === "timeout" ? 5 : 1000,
      });
      await adapters.consent.refresh();
      const pending = adapters.rewarded.show("MARKET_SCOUT");
      await vi.waitFor(() =>
        expect(port.showRewardVideoAd).toHaveBeenCalledOnce(),
      );
      if (scenario === "earned")
        callbacks.get(RewardAdPluginEvents.Rewarded)?.();
      if (scenario === "failure")
        callbacks.get(RewardAdPluginEvents.FailedToShow)?.();
      if (scenario === "cancel" || scenario === "earned") {
        callbacks.get(RewardAdPluginEvents.Dismissed)?.();
        callbacks.get(RewardAdPluginEvents.Dismissed)?.();
      }
      const result = await pending;
      expect(result.status).toBe(
        scenario === "earned"
          ? "USER_EARNED"
          : scenario === "cancel"
            ? "CANCELLED"
            : "FAILED",
      );
      expect(remove).toHaveBeenCalledTimes(3);
      port.showRewardVideoAd.mockImplementation(
        () => Promise.resolve({}) as never,
      );
      expect((await adapters.rewarded.show("MARKET_SCOUT")).status).toBe(
        "USER_EARNED",
      );
    },
  );

  it.each(["tracking", "preparation", "registration", "removal"] as const)(
    "bounds unresolved native %s without granting or retaining the busy guard",
    async (stage) => {
      let release!: (value: never) => void;
      const stuck = new Promise((resolve) => {
        release = resolve;
      });
      const remove = vi.fn().mockResolvedValue(undefined);
      const port = {
        initialize: vi.fn().mockResolvedValue(undefined),
        requestConsentInfo: vi
          .fn()
          .mockResolvedValue({ status: "NOT_REQUIRED", canRequestAds: true }),
        trackingAuthorizationStatus: vi
          .fn()
          .mockResolvedValue({ status: "denied" }),
        requestTrackingAuthorization: vi.fn().mockResolvedValue(undefined),
        prepareRewardVideoAd: vi.fn().mockResolvedValue({}),
        showRewardVideoAd: vi.fn().mockResolvedValue({}),
        addListener: vi.fn().mockResolvedValue({ remove }),
      };
      if (stage === "tracking")
        port.trackingAuthorizationStatus.mockImplementationOnce(() => stuck);
      if (stage === "preparation")
        port.prepareRewardVideoAd.mockImplementationOnce(() => stuck);
      if (stage === "registration")
        port.addListener.mockImplementationOnce(() => stuck);
      if (stage === "removal") remove.mockImplementationOnce(() => stuck);
      const adapters = createAdMobAdapters(port as never, {
        platform: "ios",
        rewardTimeoutMs: 5,
      });
      await adapters.consent.refresh();
      const result = await adapters.rewarded.show("MARKET_SCOUT");
      expect(result.status).toBe(
        stage === "removal" ? "USER_EARNED" : "FAILED",
      );
      if (stage !== "removal")
        expect(port.showRewardVideoAd).not.toHaveBeenCalled();
      release(
        (stage === "registration"
          ? { remove }
          : { status: "notDetermined" }) as never,
      );
      await Promise.resolve();
      await Promise.resolve();
      if (stage === "registration") expect(remove).toHaveBeenCalledOnce();
      expect(port.requestTrackingAuthorization).not.toHaveBeenCalled();
      expect((await adapters.rewarded.show("MARKET_SCOUT")).status).toBe(
        "USER_EARNED",
      );
      expect(port.showRewardVideoAd).toHaveBeenCalledTimes(
        stage === "removal" ? 2 : 1,
      );
    },
  );
});
