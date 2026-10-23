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

  it("uses official demo units only with explicit test serving", () => {
    expect(resolveRewardedAdId("MARKET_SCOUT", "ios", false)).toBeNull();
    expect(resolveRewardedAdId("MARKET_SCOUT", "ios", false, true)).toBe(
      "ca-app-pub-3940256099942544/1712485313",
    );
    expect(resolveRewardedAdId("LISTING_REACH", "android", false, true)).toBe(
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

  it("uses a test interstitial only with explicit test serving", () => {
    expect(resolveTradeInterstitialId("ios", false)).toBeNull();
    expect(resolveTradeInterstitialId("ios", false, true)).toBe(
      "ca-app-pub-3940256099942544/4411468910",
    );
    expect(resolveTradeInterstitialId("ios", true)).toBe(
      "ca-app-pub-4229088811556918/1985851659",
    );
    expect(resolveTradeInterstitialId("android", true)).toBeNull();
  });
});

// UMP owns ATT presentation and regional consent sequencing. A separate JS
// prompt must not duplicate/bypass UMP or block ads merely because ATT is denied.
const attTripwires = () => ({
  trackingAuthorizationStatus: vi.fn().mockResolvedValue({ status: "denied" }),
  requestTrackingAuthorization: vi.fn(() => {
    throw new Error("ATT_MUST_NOT_BE_REQUESTED");
  }),
});

describe("AdMob native adapters", () => {
  it("disabled mode makes zero native calls and cannot grant a reward", async () => {
    const port = Object.fromEntries(
      [
        "initialize",
        "requestConsentInfo",
        "showConsentForm",
        "showPrivacyOptionsForm",
        "prepareRewardVideoAd",
        "showRewardVideoAd",
        "prepareInterstitial",
        "showInterstitial",
        "addListener",
      ].map((name) => [name, vi.fn()]),
    );
    const adapters = createAdMobAdapters(port as never, {
      platform: "ios",
      productionEnabled: false,
      testEnabled: false,
    });
    expect(adapters.consent.available).toBe(false);
    expect(await adapters.consent.refresh()).toEqual({
      canRequestAds: false,
      adPersonalizationAllowed: false,
    });
    await expect(adapters.consent.openPrivacyOptions()).rejects.toThrow(
      "PRIVACY_OPTIONS_UNAVAILABLE",
    );
    expect(await adapters.rewarded.show("MARKET_SCOUT")).toEqual({
      status: "FAILED",
      reason: "PROVIDER",
    });
    expect(await adapters.showTradeInterstitial()).toBe(false);
    for (const call of Object.values(port)) expect(call).not.toHaveBeenCalled();
  });
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
      ...attTripwires(),
      prepareRewardVideoAd: vi.fn(),
      showRewardVideoAd: vi.fn(),
      prepareInterstitial: vi.fn(),
      showInterstitial: vi.fn(),
    };
    const adapters = createAdMobAdapters(port as never, {
      platform: "ios",
      productionEnabled: false,
      testEnabled: true,
    });
    await adapters.consent.refresh();
    expect(await adapters.rewarded.show("MARKET_SCOUT")).toEqual({
      status: "FAILED",
      reason: "PROVIDER",
    });
    expect(port.prepareRewardVideoAd).not.toHaveBeenCalled();
    expect(await adapters.showTradeInterstitial()).toBe(false);
    expect(port.prepareInterstitial).not.toHaveBeenCalled();
    expect(port.initialize).not.toHaveBeenCalled();
  });

  it("waits for the UMP-owned GDPR/ATT flow before any ad request", async () => {
    const port = {
      initialize: vi.fn().mockResolvedValue(undefined),
      requestConsentInfo: vi.fn().mockResolvedValue({
        status: "REQUIRED",
        isConsentFormAvailable: true,
        canRequestAds: false,
      }),
      showConsentForm: vi.fn().mockResolvedValue({
        status: "OBTAINED",
        canRequestAds: true,
      }),
      showPrivacyOptionsForm: vi.fn().mockResolvedValue(undefined),
      ...attTripwires(),
      prepareRewardVideoAd: vi.fn().mockResolvedValue({}),
      showRewardVideoAd: vi.fn().mockResolvedValue({ amount: 1, type: "test" }),
      prepareInterstitial: vi.fn().mockResolvedValue({}),
      showInterstitial: vi.fn().mockResolvedValue(undefined),
      addListener: vi.fn().mockResolvedValue({ remove: vi.fn() }),
    };
    const adapters = createAdMobAdapters(port as never, {
      platform: "ios",
      testEnabled: true,
    });
    expect(await adapters.rewarded.show("MARKET_SCOUT")).toEqual({
      status: "FAILED",
      reason: "PROVIDER",
    });
    expect(await adapters.showTradeInterstitial()).toBe(false);
    expect(port.prepareRewardVideoAd).not.toHaveBeenCalled();
    expect(port.prepareInterstitial).not.toHaveBeenCalled();

    expect(await adapters.consent.refresh()).toEqual({
      canRequestAds: true,
      adPersonalizationAllowed: false,
    });
    expect(port.showConsentForm).toHaveBeenCalledOnce();
    expect(port.requestConsentInfo.mock.invocationCallOrder[0]).toBeLessThan(
      port.initialize.mock.invocationCallOrder[0],
    );
    expect(port.showConsentForm.mock.invocationCallOrder[0]).toBeLessThan(
      port.initialize.mock.invocationCallOrder[0],
    );
    await adapters.consent.openPrivacyOptions();
    expect(port.showPrivacyOptionsForm).toHaveBeenCalledOnce();
    expect((await adapters.rewarded.show("MARKET_SCOUT")).status).toBe(
      "USER_EARNED",
    );
    expect(await adapters.showTradeInterstitial()).toBe(true);
    expect(port.trackingAuthorizationStatus).toHaveBeenCalled();
    expect(port.requestTrackingAuthorization).not.toHaveBeenCalled();
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
      ...attTripwires(),
      prepareRewardVideoAd: vi.fn(),
      showRewardVideoAd: vi.fn(),
      prepareInterstitial: vi.fn().mockResolvedValue({ adUnitId: "test" }),
      showInterstitial: vi.fn().mockResolvedValue(undefined),
    };
    const adapters = createAdMobAdapters(port as never, {
      platform: "ios",
      productionEnabled: false,
      testEnabled: true,
    });
    await adapters.consent.refresh();
    expect(await adapters.showTradeInterstitial()).toBe(true);
    expect(port.prepareInterstitial).toHaveBeenCalledWith({
      adId: "ca-app-pub-3940256099942544/4411468910",
      isTesting: true,
      npa: true,
    });
    expect(port.trackingAuthorizationStatus).toHaveBeenCalled();
    expect(port.requestTrackingAuthorization).not.toHaveBeenCalled();
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
      ...attTripwires(),
      prepareRewardVideoAd: vi.fn().mockResolvedValue({ adUnitId: "test" }),
      showRewardVideoAd: vi.fn().mockResolvedValue({ amount: 1, type: "test" }),
      addListener: vi.fn().mockResolvedValue({ remove: vi.fn() }),
    };
    const adapters = createAdMobAdapters(port as never, {
      platform: "ios",
      productionEnabled: false,
      testEnabled: true,
    });
    await adapters.consent.refresh();
    const result = await adapters.rewarded.show("FAST_INSPECTION");
    expect(result.status).toBe("USER_EARNED");
    expect(port.prepareRewardVideoAd).toHaveBeenCalledWith(
      expect.objectContaining({ isTesting: true, npa: true }),
    );
    expect(port.trackingAuthorizationStatus).toHaveBeenCalled();
    expect(port.requestTrackingAuthorization).not.toHaveBeenCalled();
  });

  it("keeps production rewarded and interstitial requests non-personalized", async () => {
    const port = {
      initialize: vi.fn().mockResolvedValue(undefined),
      requestConsentInfo: vi
        .fn()
        .mockResolvedValue({ status: "OBTAINED", canRequestAds: true }),
      ...attTripwires(),
      prepareRewardVideoAd: vi.fn().mockResolvedValue({}),
      showRewardVideoAd: vi.fn().mockResolvedValue({ amount: 1, type: "test" }),
      prepareInterstitial: vi.fn().mockResolvedValue({}),
      showInterstitial: vi.fn().mockResolvedValue(undefined),
      addListener: vi.fn().mockResolvedValue({ remove: vi.fn() }),
    };
    const adapters = createAdMobAdapters(port as never, {
      platform: "ios",
      productionEnabled: true,
    });
    await adapters.consent.refresh();
    expect((await adapters.rewarded.show("LISTING_REACH")).status).toBe(
      "USER_EARNED",
    );
    expect(await adapters.showTradeInterstitial()).toBe(true);
    expect(port.prepareRewardVideoAd).toHaveBeenCalledWith({
      adId: "ca-app-pub-4229088811556918/4992979324",
      isTesting: false,
      npa: true,
    });
    expect(port.prepareInterstitial).toHaveBeenCalledWith({
      adId: "ca-app-pub-4229088811556918/1985851659",
      isTesting: false,
      npa: true,
    });
    expect(port.trackingAuthorizationStatus).toHaveBeenCalled();
    expect(port.requestTrackingAuthorization).not.toHaveBeenCalled();
  });

  it("grants no reward and shows nothing when ad preparation fails", async () => {
    const port = {
      initialize: vi.fn().mockResolvedValue(undefined),
      requestConsentInfo: vi.fn().mockResolvedValue({
        status: "NOT_REQUIRED",
        canRequestAds: true,
        privacyOptionsRequirementStatus: "NOT_REQUIRED",
      }),
      showConsentForm: vi.fn(),
      showPrivacyOptionsForm: vi.fn(),
      ...attTripwires(),
      prepareRewardVideoAd: vi.fn().mockRejectedValue(new Error("unavailable")),
      showRewardVideoAd: vi.fn(),
      prepareInterstitial: vi.fn().mockRejectedValue(new Error("unavailable")),
      showInterstitial: vi.fn(),
    };
    const adapters = createAdMobAdapters(port as never, {
      platform: "ios",
      testEnabled: true,
    });
    await adapters.consent.refresh();
    expect(await adapters.rewarded.show("MARKET_SCOUT")).toEqual({
      status: "FAILED",
      reason: "PROVIDER",
    });
    expect(port.showRewardVideoAd).not.toHaveBeenCalled();
    expect(await adapters.showTradeInterstitial()).toBe(false);
    expect(port.showInterstitial).not.toHaveBeenCalled();
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
        ...attTripwires(),
        prepareRewardVideoAd: vi.fn().mockResolvedValue({}),
        showRewardVideoAd: vi.fn(() => new Promise(() => {})),
        addListener: vi.fn(async (event: string, callback: () => void) => {
          callbacks.set(event, callback);
          return { remove };
        }),
      };
      const adapters = createAdMobAdapters(port as never, {
        platform: "ios",
        testEnabled: true,
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
        () => Promise.resolve({ amount: 1, type: "test" }) as never,
      );
      expect((await adapters.rewarded.show("MARKET_SCOUT")).status).toBe(
        "USER_EARNED",
      );
    },
  );

  it.each(["preparation", "registration", "removal"] as const)(
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
        ...attTripwires(),
        prepareRewardVideoAd: vi.fn().mockResolvedValue({}),
        showRewardVideoAd: vi
          .fn()
          .mockResolvedValue({ amount: 1, type: "test" }),
        addListener: vi.fn().mockResolvedValue({ remove }),
      };
      if (stage === "preparation")
        port.prepareRewardVideoAd.mockImplementationOnce(() => stuck);
      if (stage === "registration")
        port.addListener.mockImplementationOnce(() => stuck);
      if (stage === "removal") remove.mockImplementationOnce(() => stuck);
      const adapters = createAdMobAdapters(port as never, {
        platform: "ios",
        testEnabled: true,
        rewardTimeoutMs: 5,
      });
      await adapters.consent.refresh();
      const result = await adapters.rewarded.show("MARKET_SCOUT");
      expect(result.status).toBe(
        stage === "removal" ? "USER_EARNED" : "FAILED",
      );
      if (stage !== "removal")
        expect(port.showRewardVideoAd).not.toHaveBeenCalled();
      release((stage === "registration" ? { remove } : {}) as never);
      await Promise.resolve();
      await Promise.resolve();
      if (stage === "registration") expect(remove).toHaveBeenCalledOnce();
      expect((await adapters.rewarded.show("MARKET_SCOUT")).status).toBe(
        "USER_EARNED",
      );
      expect(port.showRewardVideoAd).toHaveBeenCalledTimes(
        stage === "removal" ? 2 : 1,
      );
    },
  );
});
