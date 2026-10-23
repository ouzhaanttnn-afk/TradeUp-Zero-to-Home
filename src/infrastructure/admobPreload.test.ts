import { afterEach, describe, expect, it, vi } from "vitest";
import { createAdMobAdapters, resolveRewardedAdId } from "./admob";

const fixture = () => {
  const port = {
    initialize: vi.fn().mockResolvedValue(undefined),
    trackingAuthorizationStatus: vi.fn().mockResolvedValue({ status: "denied" }),
    requestConsentInfo: vi
      .fn()
      .mockResolvedValue({ status: "NOT_REQUIRED", canRequestAds: true }),
    showConsentForm: vi.fn(),
    showPrivacyOptionsForm: vi.fn().mockResolvedValue(undefined),
    prepareRewardVideoAd: vi.fn().mockResolvedValue({}),
    showRewardVideoAd: vi.fn().mockResolvedValue({ amount: 1, type: "test" }),
    addListener: vi.fn().mockResolvedValue({ remove: vi.fn() }),
    prepareInterstitial: vi.fn().mockResolvedValue({}),
    showInterstitial: vi.fn().mockResolvedValue(undefined),
  };
  return {
    port,
    adapters: createAdMobAdapters(port as never, {
      platform: "ios",
      testEnabled: false,
      productionEnabled: true,
    }),
  };
};
afterEach(() => vi.useRealTimers());
describe("one consent-gated rewarded preload slot", () => {
  it("does not load before UMP; reuses a warm slot through another consent check", async () => {
    const { port, adapters } = fixture();
    expect(await adapters.rewarded.preload!("MARKET_SCOUT")).toBe(false);
    expect(port.prepareRewardVideoAd).not.toHaveBeenCalled();
    await adapters.consent.refresh();
    expect(await adapters.rewarded.preload!("MARKET_SCOUT")).toBe(true);
    await adapters.consent.refresh();
    expect(await adapters.rewarded.preload!("MARKET_SCOUT")).toBe(true);
    expect(port.prepareRewardVideoAd).toHaveBeenCalledTimes(1);
    expect(port.showRewardVideoAd).not.toHaveBeenCalled();
    expect((await adapters.rewarded.show("MARKET_SCOUT")).status).toBe(
      "USER_EARNED",
    );
    expect(port.prepareRewardVideoAd).toHaveBeenCalledTimes(1);
    await adapters.rewarded.preload!("MARKET_SCOUT");
    expect(port.prepareRewardVideoAd).toHaveBeenCalledTimes(2);
  });
  it("expires a slot at one hour and on clock rollback", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000);
    const { port, adapters } = fixture();
    await adapters.consent.refresh();
    await adapters.rewarded.preload!("MARKET_SCOUT");
    vi.setSystemTime(4_600_000);
    await adapters.rewarded.preload!("MARKET_SCOUT");
    vi.setSystemTime(500_000);
    await adapters.rewarded.preload!("MARKET_SCOUT");
    expect(port.prepareRewardVideoAd).toHaveBeenCalledTimes(3);
  });
  it("loads the requested placement rather than showing a scout slot for another reward", async () => {
    const { port, adapters } = fixture();
    await adapters.consent.refresh();
    await adapters.rewarded.preload!("MARKET_SCOUT");
    await adapters.rewarded.show("FAST_INSPECTION");
    expect(port.prepareRewardVideoAd).toHaveBeenLastCalledWith(
      expect.objectContaining({
        adId: resolveRewardedAdId("FAST_INSPECTION", "ios", true),
      }),
    );
    expect(port.showRewardVideoAd).toHaveBeenCalledWith({
      adId: resolveRewardedAdId("FAST_INSPECTION", "ios", true),
    });
  });
  it("deduplicates concurrent warming and skips interstitial during native preparation", async () => {
    const { port, adapters } = fixture();
    let complete!: (value: object) => void;
    port.prepareRewardVideoAd.mockReturnValue(
      new Promise((resolve) => {
        complete = resolve;
      }),
    );
    await adapters.consent.refresh();
    const first = adapters.rewarded.preload!("MARKET_SCOUT");
    const second = adapters.rewarded.preload!("MARKET_SCOUT");
    expect(await adapters.showTradeInterstitial()).toBe(false);
    expect(port.prepareRewardVideoAd).toHaveBeenCalledTimes(1);
    complete({});
    expect(await Promise.all([first, second])).toEqual([true, true]);
    expect(port.prepareRewardVideoAd).toHaveBeenCalledTimes(1);
  });
  it("revocation while loading discards the slot and never shows or rewards", async () => {
    const { port, adapters } = fixture();
    let complete!: (value: object) => void;
    port.prepareRewardVideoAd.mockReturnValue(
      new Promise((resolve) => {
        complete = resolve;
      }),
    );
    await adapters.consent.refresh();
    const warming = adapters.rewarded.preload!("MARKET_SCOUT");
    port.requestConsentInfo.mockResolvedValue({
      status: "REQUIRED",
      canRequestAds: false,
    });
    await adapters.consent.refresh();
    complete({});
    expect(await warming).toBe(false);
    expect((await adapters.rewarded.show("MARKET_SCOUT")).status).toBe(
      "FAILED",
    );
    expect(port.showRewardVideoAd).not.toHaveBeenCalled();
  });
  it("no-fill preload is inert and a later explicit request can retry", async () => {
    const { port, adapters } = fixture();
    await adapters.consent.refresh();
    port.prepareRewardVideoAd.mockRejectedValueOnce(new Error("no fill"));
    expect(await adapters.rewarded.preload!("MARKET_SCOUT")).toBe(false);
    expect((await adapters.rewarded.show("MARKET_SCOUT")).status).toBe(
      "USER_EARNED",
    );
    expect(port.prepareRewardVideoAd).toHaveBeenCalledTimes(2);
  });
});
