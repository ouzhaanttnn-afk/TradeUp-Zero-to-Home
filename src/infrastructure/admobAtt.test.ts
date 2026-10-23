import { describe, expect, it, vi } from "vitest";
import { createAdMobAdapters } from "./admob";

const fixture = () => ({
  initialize: vi.fn().mockResolvedValue(undefined),
  trackingAuthorizationStatus: vi.fn().mockResolvedValue({ status: "denied" }),
  requestConsentInfo: vi.fn().mockResolvedValue({
    status: "NOT_REQUIRED",
    canRequestAds: true,
    isConsentFormAvailable: true,
  }),
  // UMP presents the regional form and, when eligible, the Apple ATT prompt.
  showConsentForm: vi.fn().mockResolvedValue({
    status: "NOT_REQUIRED",
    canRequestAds: true,
  }),
  showPrivacyOptionsForm: vi.fn().mockResolvedValue(undefined),
  requestTrackingAuthorization: vi.fn(),
  prepareRewardVideoAd: vi.fn().mockResolvedValue({}),
  showRewardVideoAd: vi.fn().mockResolvedValue({ amount: 1, type: "test" }),
  prepareInterstitial: vi.fn().mockResolvedValue({}),
  showInterstitial: vi.fn().mockResolvedValue(undefined),
  addListener: vi.fn().mockResolvedValue({ remove: vi.fn() }),
});

describe("UMP-managed IDFA/ATT consent", () => {
  it.each(["NOT_REQUIRED", "OBTAINED"])(
    "presents an available IDFA form even when GDPR is %s",
    async (status) => {
      const port = fixture();
      port.requestConsentInfo.mockResolvedValue({
        status,
        canRequestAds: true,
        isConsentFormAvailable: true,
      });
      port.showConsentForm.mockResolvedValue({ status, canRequestAds: true });
      const ads = createAdMobAdapters(port as never, {
        platform: "ios",
        testEnabled: true,
      });
      expect((await ads.consent.refresh()).canRequestAds).toBe(true);
      expect(port.showConsentForm).toHaveBeenCalledOnce();
      expect(port.showConsentForm.mock.invocationCallOrder[0]).toBeLessThan(
        port.initialize.mock.invocationCallOrder[0],
      );
      expect(port.requestTrackingAuthorization).not.toHaveBeenCalled();
    },
  );

  it("holds both ad formats and deduplicates refresh while UMP/ATT is onscreen", async () => {
    const port = fixture();
    port.trackingAuthorizationStatus.mockResolvedValueOnce({
      status: "notDetermined",
    });
    let finish!: (value: { status: string; canRequestAds: boolean }) => void;
    port.showConsentForm.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const ads = createAdMobAdapters(port as never, {
      platform: "ios",
      testEnabled: true,
    });
    const first = ads.consent.refresh();
    const second = ads.consent.refresh();
    await vi.waitFor(() => expect(port.showConsentForm).toHaveBeenCalledOnce());
    expect(port.initialize).not.toHaveBeenCalled();
    expect(await ads.rewarded.preload!("MARKET_SCOUT")).toBe(false);
    expect((await ads.rewarded.show("MARKET_SCOUT")).status).toBe("FAILED");
    expect(await ads.showTradeInterstitial()).toBe(false);
    expect(port.prepareRewardVideoAd).not.toHaveBeenCalled();
    expect(port.prepareInterstitial).not.toHaveBeenCalled();
    finish({ status: "NOT_REQUIRED", canRequestAds: true });
    await Promise.all([first, second]);
    expect(port.initialize).toHaveBeenCalledOnce();
  });

  it.each(["denied", "restricted", "authorized"])(
    "keeps eligible NPA ads and rewards with ATT status %s",
    async (status) => {
      // UMP does not expose ATT authorization in its result: canRequestAds is
      // still true for eligible non-personalized/limited ads after an ATT refusal.
      const port = fixture();
      port.trackingAuthorizationStatus.mockResolvedValue({ status });
      const ads = createAdMobAdapters(port as never, {
        platform: "ios",
        testEnabled: true,
      });
      expect(await ads.consent.refresh()).toEqual({
        canRequestAds: true,
        adPersonalizationAllowed: false,
      });
      expect(port.showRewardVideoAd).not.toHaveBeenCalled();
      expect((await ads.rewarded.show("MARKET_SCOUT")).status).toBe(
        "USER_EARNED",
      );
      expect(await ads.showTradeInterstitial()).toBe(true);
      for (const method of [
        port.prepareRewardVideoAd,
        port.prepareInterstitial,
      ])
        expect(method).toHaveBeenCalledWith(
          expect.objectContaining({ npa: true, isTesting: true }),
        );
    },
  );

  it("does not use a cached ad if the form fails and retries safely on the next action", async () => {
    const port = fixture();
    const ads = createAdMobAdapters(port as never, {
      platform: "ios",
      testEnabled: true,
    });
    await ads.consent.refresh();
    await ads.rewarded.preload!("MARKET_SCOUT");
    port.showConsentForm.mockRejectedValueOnce(
      new Error("consent form failed"),
    );
    await expect(ads.consent.refresh()).rejects.toThrow("consent form failed");
    expect((await ads.rewarded.show("MARKET_SCOUT")).status).toBe("FAILED");
    expect(await ads.showTradeInterstitial()).toBe(false);
    expect(port.showRewardVideoAd).not.toHaveBeenCalled();
    await ads.consent.refresh();
    expect((await ads.rewarded.show("MARKET_SCOUT")).status).toBe(
      "USER_EARNED",
    );
    expect(port.prepareRewardVideoAd).toHaveBeenCalledTimes(2);
  });

  it("keeps a warm NPA ad when UMP/ATT choices did not change", async () => {
    const port = fixture();
    const ads = createAdMobAdapters(port as never, {
      platform: "ios",
      testEnabled: true,
    });
    await ads.consent.refresh();
    await ads.rewarded.preload!("MARKET_SCOUT");
    await ads.consent.refresh();
    await ads.rewarded.show("MARKET_SCOUT");
    expect(port.prepareRewardVideoAd).toHaveBeenCalledOnce();
  });

  it("invalidates a warm ad when tracking is revoked in Apple Settings", async () => {
    const port = fixture();
    port.trackingAuthorizationStatus.mockResolvedValue({
      status: "authorized",
    });
    const ads = createAdMobAdapters(port as never, {
      platform: "ios",
      testEnabled: true,
    });
    await ads.consent.refresh();
    await ads.rewarded.preload!("MARKET_SCOUT");
    port.trackingAuthorizationStatus.mockResolvedValue({ status: "denied" });
    await ads.consent.refresh();
    expect((await ads.rewarded.show("MARKET_SCOUT")).status).toBe(
      "USER_EARNED",
    );
    expect(port.prepareRewardVideoAd).toHaveBeenCalledTimes(2);
    expect(port.requestTrackingAuthorization).not.toHaveBeenCalled();
  });

  it("fails closed on an unknown ATT status without initializing ads", async () => {
    const port = fixture();
    port.trackingAuthorizationStatus.mockResolvedValue({
      status: "unexpected",
    });
    const ads = createAdMobAdapters(port as never, {
      platform: "ios",
      testEnabled: true,
    });
    await expect(ads.consent.refresh()).rejects.toThrow(
      "TRACKING_STATUS_UNAVAILABLE",
    );
    expect(port.initialize).not.toHaveBeenCalled();
    expect(await ads.rewarded.preload!("MARKET_SCOUT")).toBe(false);
  });

  it("never invokes iOS ATT APIs on Android", async () => {
    const port = fixture();
    const ads = createAdMobAdapters(port as never, {
      platform: "android",
      testEnabled: true,
    });
    expect((await ads.consent.refresh()).canRequestAds).toBe(true);
    expect(port.trackingAuthorizationStatus).not.toHaveBeenCalled();
    expect(port.requestTrackingAuthorization).not.toHaveBeenCalled();
    expect((await ads.rewarded.show("MARKET_SCOUT")).status).toBe(
      "USER_EARNED",
    );
    expect(port.prepareRewardVideoAd).toHaveBeenCalledWith(
      expect.objectContaining({
        adId: "ca-app-pub-3940256099942544/5224354917",
        isTesting: true,
        npa: true,
      }),
    );
  });
});
