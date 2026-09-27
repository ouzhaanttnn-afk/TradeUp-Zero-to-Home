import { afterEach, describe, expect, it, vi } from "vitest";
import { initialState } from "../game";
import { trackAnalytics } from "./analytics";
import {
  hasFirebaseAnalyticsConsent,
  pendingFirebaseEvents,
  saveFirebaseAnalyticsConsent,
  withExplicitAnalyticsConsent,
} from "./firebaseAnalytics";

function fakeStorage() {
  const values = new Map<string, string>();
  const localStorage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
    removeItem: (key: string) => void values.delete(key),
  } as Storage;
  vi.stubGlobal("window", { localStorage });
}

afterEach(() => vi.unstubAllGlobals());

describe("Firebase analytics consent", () => {
  it("does not treat the old local-only analytics flag as permission to transmit", () => {
    fakeStorage();
    const game = trackAnalytics(initialState(0, "SANDBOX"), "listing_open");
    expect(game.analytics.enabled).toBe(true);
    const migrated = withExplicitAnalyticsConsent(game);
    expect(migrated.analytics).toEqual({ enabled: false, events: [] });
    expect(hasFirebaseAnalyticsConsent()).toBe(false);
  });

  it("retains the local event queue only after an explicit opt-in", () => {
    fakeStorage();
    expect(saveFirebaseAnalyticsConsent(true)).toBe(true);
    const game = trackAnalytics(initialState(0, "SANDBOX"), "listing_open");
    expect(withExplicitAnalyticsConsent(game).analytics.events).toHaveLength(1);
    expect(hasFirebaseAnalyticsConsent()).toBe(true);
    expect(saveFirebaseAnalyticsConsent(false)).toBe(true);
    expect(withExplicitAnalyticsConsent(game).analytics.events).toHaveLength(0);
  });

  it("sends each event once per career seed", () => {
    fakeStorage();
    const game = trackAnalytics(initialState(0, "SANDBOX"), "listing_open");
    const id = game.analytics.events[0].id;
    expect(pendingFirebaseEvents(game.analytics.events, new Set(), game.seed)).toHaveLength(1);
    expect(pendingFirebaseEvents(game.analytics.events, new Set([`${game.seed}:${id}`]), game.seed)).toHaveLength(0);
    expect(pendingFirebaseEvents(game.analytics.events, new Set([`${game.seed + 1}:${id}`]), game.seed)).toHaveLength(1);
  });
});
