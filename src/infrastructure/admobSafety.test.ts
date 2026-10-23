import { describe, expect, it, vi } from "vitest";
import {
  createAdMobAdapters,
  resolveRewardedAdId,
  resolveTradeInterstitialId,
} from "./admob";
const fixture = () => ({
  initialize: vi.fn().mockResolvedValue(undefined),
  trackingAuthorizationStatus: vi.fn().mockResolvedValue({ status: "denied" }),
  requestConsentInfo: vi
    .fn()
    .mockResolvedValue({ status: "NOT_REQUIRED", canRequestAds: true }),
  showConsentForm: vi.fn(),
  showPrivacyOptionsForm: vi.fn().mockResolvedValue(undefined),
  prepareRewardVideoAd: vi.fn().mockResolvedValue({}),
  showRewardVideoAd: vi.fn().mockResolvedValue({ amount: 1, type: "test" }),
  prepareInterstitial: vi.fn().mockResolvedValue({}),
  showInterstitial: vi.fn().mockResolvedValue(undefined),
  addListener: vi
    .fn()
    .mockResolvedValue({ remove: vi.fn().mockResolvedValue(undefined) }),
});
describe("AdMob consent and completion safety", () => {
  it.each([
    undefined,
    {},
    { amount: 0, type: "test" },
    { amount: -1, type: "test" },
    { amount: 1, type: "" },
  ])(
    "does not infer a completed reward from invalid SDK result %j",
    async (value) => {
      const port = fixture();
      port.showRewardVideoAd.mockResolvedValueOnce(value);
      const ads = createAdMobAdapters(port as never, {
        platform: "ios",
        testEnabled: true,
      });
      await ads.consent.refresh();
      expect((await ads.rewarded.show("MARKET_SCOUT")).status).toBe(
        "CANCELLED",
      );
    },
  );
  it("test serving wins over simultaneous production flags and never uses a live unit", async () => {
    expect(resolveRewardedAdId("MARKET_SCOUT", "ios", true, true)).toContain(
      "3940256099942544",
    );
    expect(resolveTradeInterstitialId("ios", true, true)).toContain(
      "3940256099942544",
    );
    const port = fixture();
    const ads = createAdMobAdapters(port as never, {
      platform: "ios",
      productionEnabled: true,
      testEnabled: true,
    });
    await ads.consent.refresh();
    await ads.rewarded.show("MARKET_SCOUT");
    expect(port.prepareRewardVideoAd).toHaveBeenCalledWith(
      expect.objectContaining({
        adId: expect.stringContaining("3940256099942544"),
        isTesting: true,
      }),
    );
  });
  it.each(["UNKNOWN", "REQUIRED"])(
    "does not initialize Mobile Ads on %s consent",
    async (status) => {
      const port = fixture();
      port.requestConsentInfo.mockResolvedValueOnce({
        status,
        canRequestAds: true,
        isConsentFormAvailable: false,
      });
      const ads = createAdMobAdapters(port as never, {
        platform: "ios",
        testEnabled: true,
      });
      expect((await ads.consent.refresh()).canRequestAds).toBe(false);
      expect(port.initialize).not.toHaveBeenCalled();
    },
  );
  it("clears an earlier consent decision on a failed refresh and permits initialization retry", async () => {
    const port = fixture();
    port.initialize.mockRejectedValueOnce(new Error("offline"));
    const ads = createAdMobAdapters(port as never, {
      platform: "ios",
      testEnabled: true,
    });
    await expect(ads.consent.refresh()).rejects.toThrow("offline");
    expect((await ads.rewarded.show("MARKET_SCOUT")).status).toBe("FAILED");
    await ads.consent.refresh();
    expect(port.initialize).toHaveBeenCalledTimes(2);
    port.requestConsentInfo.mockRejectedValueOnce(new Error("offline"));
    await expect(ads.consent.refresh()).rejects.toThrow("offline");
    expect((await ads.rewarded.show("MARKET_SCOUT")).status).toBe("FAILED");
    expect(await ads.showTradeInterstitial()).toBe(false);
  });
  it("deduplicates simultaneous UMP refreshes", async () => {
    const port = fixture();
    let finish!: (value: unknown) => void;
    port.requestConsentInfo.mockImplementationOnce(
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
    finish({ status: "NOT_REQUIRED", canRequestAds: true });
    await Promise.all([first, second]);
    expect(port.requestConsentInfo).toHaveBeenCalledOnce();
    expect(port.initialize).toHaveBeenCalledOnce();
  });
  it("rereads UMP after privacy options, without retaining stale permission", async () => {
    const port = fixture();
    const ads = createAdMobAdapters(port as never, {
      platform: "ios",
      testEnabled: true,
    });
    await ads.consent.refresh();
    port.requestConsentInfo.mockResolvedValueOnce({
      status: "OBTAINED",
      canRequestAds: false,
    });
    await ads.consent.openPrivacyOptions();
    expect((await ads.rewarded.show("MARKET_SCOUT")).status).toBe("FAILED");
    expect(await ads.showTradeInterstitial()).toBe(false);
  });
});
