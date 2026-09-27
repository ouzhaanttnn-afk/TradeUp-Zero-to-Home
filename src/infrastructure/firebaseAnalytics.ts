import { Capacitor } from "@capacitor/core";
import type { AnalyticsEvent, GameState } from "../domain/models";

const CONSENT_KEY = "tradeup.firebase-analytics-consent.v1";
const SENT_KEY = "tradeup.firebase-analytics-sent.v1";
const MAX_SENT_IDS = 500;

function storage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

export function hasFirebaseAnalyticsConsent(): boolean {
  try {
    return storage()?.getItem(CONSENT_KEY) === "granted";
  } catch {
    return false;
  }
}

export function saveFirebaseAnalyticsConsent(enabled: boolean): boolean {
  try {
    const target = storage();
    if (!target) return false;
    target.setItem(CONSENT_KEY, enabled ? "granted" : "denied");
    if (!enabled) target.removeItem(SENT_KEY);
    return true;
  } catch {
    return false;
  }
}

export function withExplicitAnalyticsConsent(game: GameState): GameState {
  const enabled = hasFirebaseAnalyticsConsent();
  if (game.analytics.enabled === enabled && (enabled || game.analytics.events.length === 0))
    return game;
  return {
    ...game,
    analytics: {
      enabled,
      events: enabled ? game.analytics.events : [],
    },
  };
}

function sentIds(): Set<string> {
  try {
    const stored = JSON.parse(storage()?.getItem(SENT_KEY) ?? "[]") as unknown;
    return new Set(
      Array.isArray(stored) ? stored.filter((id): id is string => typeof id === "string") : [],
    );
  } catch {
    return new Set();
  }
}

export function pendingFirebaseEvents(
  events: AnalyticsEvent[],
  sent: ReadonlySet<string>,
  seed: number,
): AnalyticsEvent[] {
  return events.filter((event) => !sent.has(`${seed}:${event.id}`));
}

function markSent(seed: number, event: AnalyticsEvent, delivered: Set<string>): void {
  delivered.add(`${seed}:${event.id}`);
  try {
    storage()?.setItem(SENT_KEY, JSON.stringify([...delivered].slice(-MAX_SENT_IDS)));
  } catch {
    // Restricted storage must never interrupt gameplay.
  }
}

type GameSnapshot = { game: GameState; ready: boolean };
type GameSource = {
  getState: () => GameSnapshot;
  subscribe: (listener: () => void) => () => void;
};

let nativeAnalytics: Promise<typeof import("@capacitor-firebase/analytics")> | undefined;

function loadNativeAnalytics() {
  nativeAnalytics ??= import("@capacitor-firebase/analytics");
  return nativeAnalytics;
}

export async function applyFirebaseAnalyticsConsent(enabled: boolean): Promise<void> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "ios") return;
  try {
    const { FirebaseAnalytics, ConsentType, ConsentStatus } = await loadNativeAnalytics();
    await FirebaseAnalytics.setConsent({
      type: ConsentType.AnalyticsStorage,
      status: enabled ? ConsentStatus.Granted : ConsentStatus.Denied,
    });
    await FirebaseAnalytics.setEnabled({ enabled });
    if (!enabled) await FirebaseAnalytics.resetAnalyticsData();
  } catch {
    // Optional telemetry never blocks the offline game.
  }
}

export function startFirebaseAnalytics(source: GameSource): void {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "ios") return;
  // Collection is also disabled by default in Info.plist. Old local-only
  // analytics preferences cannot grant Firebase consent on upgrade.
  let eligibleThisLaunch = hasFirebaseAnalyticsConsent();
  const initialized = applyFirebaseAnalyticsConsent(eligibleThisLaunch);
  const delivered = sentIds();
  let flushing = false;
  const flush = async () => {
    if (flushing || !eligibleThisLaunch) return;
    flushing = true;
    try {
      await initialized;
      const { FirebaseAnalytics } = await loadNativeAnalytics();
      while (true) {
        const snapshot = source.getState();
        if (!snapshot.ready || !snapshot.game.analytics.enabled || !hasFirebaseAnalyticsConsent()) break;
        const event = pendingFirebaseEvents(
          snapshot.game.analytics.events,
          delivered,
          snapshot.game.seed,
        )[0];
        if (!event) break;
        // Send only the GDD event name. Local IDs, prices, profile and
        // free-form event properties never leave the device.
        await FirebaseAnalytics.logEvent({ name: event.name });
        markSent(snapshot.game.seed, event, delivered);
      }
    } catch {
      // Keep unsent events in the existing bounded local queue for retry.
    } finally {
      flushing = false;
    }
  };
  source.subscribe(() => {
    if (!hasFirebaseAnalyticsConsent()) eligibleThisLaunch = false;
    void flush();
  });
  void flush();
}
