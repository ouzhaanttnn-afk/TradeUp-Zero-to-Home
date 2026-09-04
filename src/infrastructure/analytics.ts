import { META_CONFIG } from "../domain/config";
import type {
  AnalyticsEventName,
  AnalyticsState,
  GameState,
} from "../domain/models";

export type AnalyticsProperties = Record<
  string,
  string | number | boolean | undefined
>;

const compactProperties = (properties: AnalyticsProperties) =>
  Object.fromEntries(
    Object.entries(properties).filter((entry) => entry[1] !== undefined),
  ) as Record<string, string | number | boolean>;

export function trackAnalytics(
  state: GameState,
  name: AnalyticsEventName,
  properties: AnalyticsProperties = {},
  uniqueKey?: string,
): GameState {
  if (!state.analytics.enabled) return state;
  const id = uniqueKey
    ? `analytics:${name}:${uniqueKey}`
    : `analytics:${name}:${state.gameTimeMin}:${state.analytics.events.length}`;
  if (state.analytics.events.some((event) => event.id === id)) return state;
  return {
    ...state,
    analytics: {
      ...state.analytics,
      events: [
        ...state.analytics.events,
        {
          id,
          name,
          atGameMin: state.gameTimeMin,
          properties: compactProperties(properties),
        },
      ].slice(-META_CONFIG.analyticsEventLimit),
    },
  };
}

export function setAnalyticsEnabled(
  state: GameState,
  enabled: boolean,
): GameState {
  return {
    ...state,
    analytics: {
      enabled,
      events: enabled ? state.analytics.events : [],
    },
  };
}

export type AnalyticsAdapter = {
  flush: (events: AnalyticsState["events"]) => Promise<void>;
};

export const offlineAnalyticsAdapter: AnalyticsAdapter = {
  // P2 deliberately keeps events local. A provider may be attached only behind
  // the later consent/quality gate without changing the gameplay contract.
  flush: async () => undefined,
};
