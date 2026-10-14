import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { initialState } from "../game";
const native = vi.hoisted(() => ({
  setConsent: vi.fn().mockResolvedValue(undefined),
  setEnabled: vi.fn().mockResolvedValue(undefined),
  resetAnalyticsData: vi.fn().mockResolvedValue(undefined),
  logEvent: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: () => true, getPlatform: () => "ios" },
}));
vi.mock("@capacitor-firebase/analytics", () => ({
  FirebaseAnalytics: native,
  ConsentType: {
    AnalyticsStorage: "ANALYTICS_STORAGE",
    AdStorage: "AD_STORAGE",
    AdUserData: "AD_USER_DATA",
    AdPersonalization: "AD_PERSONALIZATION",
  },
  ConsentStatus: { Granted: "granted", Denied: "denied" },
}));
beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  const values = new Map<string, string>();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    },
  });
});
afterEach(() => vi.unstubAllGlobals());
describe("native Firebase consent lifecycle", () => {
  it("retains the user's analytics preference, but never grants ad personalization", async () => {
    const analytics = await import("./firebaseAnalytics");
    analytics.saveFirebaseAnalyticsConsent(true);
    await analytics.applyFirebaseAnalyticsConsent(true);
    expect(analytics.hasFirebaseAnalyticsConsent()).toBe(true);
    expect(native.setEnabled).toHaveBeenLastCalledWith({ enabled: true });
    for (const type of ["AD_STORAGE", "AD_USER_DATA", "AD_PERSONALIZATION"])
      expect(native.setConsent).toHaveBeenCalledWith({
        type,
        status: "denied",
      });
  });
  it("starts sending event names after opt-in without requiring an app restart", async () => {
    const analytics = await import("./firebaseAnalytics");
    const game = initialState(0, "SANDBOX");
    game.analytics.enabled = true;
    game.analytics.events = [
      {
        id: "local-private-id",
        name: "listing_open",
        atGameMin: 0,
        properties: { playerName: "private", price: 123 },
      },
    ];
    let update!: () => void;
    analytics.startFirebaseAnalytics({
      getState: () => ({ game, ready: true }),
      subscribe: (listener) => {
        update = listener;
        return () => {};
      },
    });
    await vi.waitFor(() =>
      expect(native.setEnabled).toHaveBeenCalledWith({ enabled: false }),
    );
    expect(native.logEvent).not.toHaveBeenCalled();
    analytics.saveFirebaseAnalyticsConsent(true);
    await analytics.applyFirebaseAnalyticsConsent(true);
    update();
    await vi.waitFor(() => expect(native.logEvent).toHaveBeenCalledOnce());
    expect(native.logEvent).toHaveBeenCalledWith({ name: "listing_open" });
    analytics.saveFirebaseAnalyticsConsent(false);
    await analytics.applyFirebaseAnalyticsConsent(false);
    update();
    expect(native.setEnabled).toHaveBeenLastCalledWith({ enabled: false });
    expect(native.logEvent).toHaveBeenCalledOnce();
  });
  it("serializes rapid preference changes so an old grant cannot overwrite denial", async () => {
    const analytics = await import("./firebaseAnalytics");
    await Promise.all([
      analytics.applyFirebaseAnalyticsConsent(true),
      analytics.applyFirebaseAnalyticsConsent(false),
    ]);
    expect(
      native.setEnabled.mock.calls.map(([value]) => value.enabled),
    ).toEqual([true, false]);
    expect(native.resetAnalyticsData).toHaveBeenCalledOnce();
  });
});
