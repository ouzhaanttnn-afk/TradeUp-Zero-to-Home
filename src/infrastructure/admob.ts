import {
  AdMob,
  AdmobConsentStatus,
  MaxAdContentRating,
  RewardAdPluginEvents,
  type AdmobConsentInfo,
} from "@capacitor-community/admob";
import { Capacitor, type PluginListenerHandle } from "@capacitor/core";
import type { RewardPlacementId } from "../domain/models";
import type {
  ConsentAdapter,
  ConsentSnapshot,
  RewardedAdAdapter,
  RewardedAdResult,
} from "./monetization";

type NativeAdPlatform = "ios" | "android";

// Vite removes demo identities from release JS unless test serving is explicit.
const TEST_REWARDED_IDS: Record<NativeAdPlatform, string> | null =
  import.meta.env.DEV || import.meta.env.VITE_ADMOB_TEST_ENABLED === "true"
    ? {
        ios: "ca-app-pub-3940256099942544/1712485313",
        android: "ca-app-pub-3940256099942544/5224354917",
      }
    : null;

const IOS_PRODUCTION_REWARDED_IDS: Record<RewardPlacementId, string> = {
  MARKET_SCOUT: "ca-app-pub-4229088811556918/4710266110",
  FAST_INSPECTION: "ca-app-pub-4229088811556918/1694441725",
  FAST_PREPARATION: "ca-app-pub-4229088811556918/6609313327",
  LISTING_REACH: "ca-app-pub-4229088811556918/4992979324",
};

const TEST_IOS_INTERSTITIAL_ID =
  import.meta.env.DEV || import.meta.env.VITE_ADMOB_TEST_ENABLED === "true"
    ? "ca-app-pub-3940256099942544/4411468910"
    : null;
const IOS_PRODUCTION_INTERSTITIAL_ID = "ca-app-pub-4229088811556918/1985851659";

export const resolveTradeInterstitialId = (
  platform: NativeAdPlatform,
  productionEnabled: boolean,
  testEnabled = false,
) =>
  platform !== "ios"
    ? null
    : testEnabled
      ? TEST_IOS_INTERSTITIAL_ID
      : productionEnabled
        ? IOS_PRODUCTION_INTERSTITIAL_ID
        : null;

export const isProductionAdServingEnabled = (value: unknown) =>
  value === "true";

export const resolveRewardedAdId = (
  placementId: RewardPlacementId,
  platform: NativeAdPlatform,
  productionEnabled: boolean,
  testEnabled = false,
) => {
  if (testEnabled) return TEST_REWARDED_IDS?.[platform] ?? null;
  if (!productionEnabled) return null;
  return platform === "ios" ? IOS_PRODUCTION_REWARDED_IDS[placementId] : null;
};

export const classifyAdMobFailure = (
  error: unknown,
): Extract<RewardedAdResult, { status: "FAILED" }>["reason"] => {
  const message = error instanceof Error ? error.message : String(error);
  if (/no.?fill|no ad|inventory/i.test(message)) return "NO_FILL";
  if (/network|offline|internet|timeout/i.test(message)) return "NETWORK";
  return "PROVIDER";
};

// TradeUp does not track: no ATT/IDFA request, and every ad request is npa.
type AdMobPort = Pick<
  typeof AdMob,
  | "initialize"
  | "requestConsentInfo"
  | "showConsentForm"
  | "showPrivacyOptionsForm"
  | "prepareRewardVideoAd"
  | "showRewardVideoAd"
  | "prepareInterstitial"
  | "showInterstitial"
  | "addListener"
>;

const consentSnapshot = (info: AdmobConsentInfo): ConsentSnapshot => ({
  canRequestAds: info.canRequestAds,
  // We deliberately request non-personalized ads in v1.0. UMP's OBTAINED state
  // does not prove that every personalization purpose was accepted.
  adPersonalizationAllowed: false,
});

export const createAdMobAdapters = (
  port: AdMobPort = AdMob,
  options: {
    platform?: NativeAdPlatform;
    productionEnabled?: boolean;
    testEnabled?: boolean;
    rewardTimeoutMs?: number;
  } = {},
): {
  consent: ConsentAdapter;
  rewarded: RewardedAdAdapter;
  showTradeInterstitial: () => Promise<boolean>;
} => {
  const nativePlatform = options.platform ?? Capacitor.getPlatform();
  const platform =
    nativePlatform === "ios" || nativePlatform === "android"
      ? nativePlatform
      : null;
  const testEnabled =
    options.testEnabled ??
    isProductionAdServingEnabled(import.meta.env.VITE_ADMOB_TEST_ENABLED);
  // An explicit test run can never create real impressions, even if both flags exist.
  const productionEnabled =
    !testEnabled &&
    (options.productionEnabled ??
      isProductionAdServingEnabled(
        import.meta.env.VITE_ADMOB_PRODUCTION_ENABLED,
      ));
  const available = Boolean(platform && (productionEnabled || testEnabled));
  let initialized: Promise<void> | undefined;
  let canRequestAds = false;
  let showingInterstitial = false;
  let showingReward = false;
  let consentRefresh: Promise<ConsentSnapshot> | undefined;
  let consentGeneration = 0;
  let prepared:
    | { placementId: RewardPlacementId; at: number; generation: number }
    | undefined;
  let preparing: Promise<void> | undefined;
  const invalidateReward = () => {
    consentGeneration++;
    prepared = undefined;
  };
  const now = () => Date.now();
  const isPrepared = (placementId: RewardPlacementId) =>
    prepared?.placementId === placementId &&
    prepared.generation === consentGeneration &&
    now() >= prepared.at &&
    now() - prepared.at < 3_600_000;

  const prepareReward = async (placementId: RewardPlacementId) => {
    if (!available || !platform || !canRequestAds || showingInterstitial)
      throw new Error("ADS_UNAVAILABLE");
    // The SDK owns one rewarded slot. Do not race two placements, even if a
    // caller timed out while the native load is still finishing.
    while (preparing) await preparing;
    if (!canRequestAds) throw new Error("CONSENT_CHANGED");
    if (isPrepared(placementId)) return;
    const adId = resolveRewardedAdId(
      placementId,
      platform,
      productionEnabled,
      testEnabled,
    );
    if (!adId) throw new Error("ADS_UNAVAILABLE");
    const generation = consentGeneration;
    prepared = undefined;
    const job = (async () => {
      await port.prepareRewardVideoAd({
        adId,
        isTesting: !productionEnabled,
        npa: true,
      });
      if (canRequestAds && consentGeneration === generation)
        prepared = { placementId, at: now(), generation };
    })();
    preparing = job;
    try {
      await job;
    } finally {
      if (preparing === job) preparing = undefined;
    }
  };

  const initialize = () => {
    initialized ??= port
      .initialize({
        initializeForTesting: testEnabled,
        tagForChildDirectedTreatment: false,
        tagForUnderAgeOfConsent: false,
        maxAdContentRating: MaxAdContentRating.Teen,
      })
      .catch((error: unknown) => {
        initialized = undefined;
        throw error;
      });
    return initialized;
  };

  const refreshConsent = async () => {
    if (!available) {
      return { canRequestAds: false, adPersonalizationAllowed: false };
    }
    // The pinned native patch makes UMP usable without starting Mobile Ads.
    canRequestAds = false;
    let info = await port.requestConsentInfo({
      tagForUnderAgeOfConsent: false,
    });
    if (
      info.status === AdmobConsentStatus.REQUIRED &&
      info.isConsentFormAvailable
    ) {
      invalidateReward();
      info = await port.showConsentForm();
    }
    const allowed =
      info.canRequestAds &&
      (info.status === AdmobConsentStatus.NOT_REQUIRED ||
        info.status === AdmobConsentStatus.OBTAINED);
    if (allowed) await initialize();
    canRequestAds = allowed;
    if (!allowed) invalidateReward();
    return consentSnapshot({ ...info, canRequestAds });
  };

  return {
    consent: {
      available,
      refresh() {
        consentRefresh ??= refreshConsent()
          .catch((error: unknown) => {
            canRequestAds = false;
            invalidateReward();
            throw error;
          })
          .finally(() => {
            consentRefresh = undefined;
          });
        return consentRefresh;
      },
      async openPrivacyOptions() {
        if (!available) throw new Error("PRIVACY_OPTIONS_UNAVAILABLE");
        await consentRefresh;
        canRequestAds = false;
        invalidateReward();
        await port.showPrivacyOptionsForm();
        await refreshConsent();
      },
    },
    rewarded: {
      async preload(placementId) {
        if (showingReward || showingInterstitial) return false;
        try {
          await prepareReward(placementId);
          return isPrepared(placementId);
        } catch {
          return false;
        }
      },
      async show(placementId) {
        if (
          !available ||
          !platform ||
          !canRequestAds ||
          showingReward ||
          showingInterstitial
        ) {
          return { status: "FAILED", reason: "PROVIDER" };
        }
        const adId = resolveRewardedAdId(
          placementId,
          platform,
          productionEnabled,
          testEnabled,
        );
        if (!adId) return { status: "FAILED", reason: "PROVIDER" };
        showingReward = true;
        const listeners: PluginListenerHandle[] = [];
        let settle!: (result: RewardedAdResult) => void;
        let settled = false;
        let earned = false;
        const result = new Promise<RewardedAdResult>((resolve) => {
          settle = (value) => {
            if (settled) return;
            settled = true;
            resolve(value);
          };
        });
        const earnedResult = (): RewardedAdResult => ({
          status: "USER_EARNED",
          providerTransactionId: `admob-${placementId}-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`,
        });
        const removeListener = (listener: PluginListenerHandle) => {
          // Native cleanup is best-effort: a stuck remove promise must not keep
          // the game busy. Stale callbacks also check this operation's settled flag.
          try {
            void Promise.resolve(listener.remove()).catch(() => {});
          } catch {
            // Native teardown can fail after an app lifecycle interruption.
          }
        };
        const addListener = async (
          listenerPromise: Promise<PluginListenerHandle>,
        ) => {
          const listener = await listenerPromise;
          if (settled) removeListener(listener);
          else listeners.push(listener);
        };
        // Bound loading and listener setup too, not only presentation.
        const timeout = setTimeout(
          () => settle({ status: "FAILED", reason: "NETWORK" }),
          options.rewardTimeoutMs ?? 180_000,
        );
        try {
          void (async () => {
            await prepareReward(placementId);
            if (settled || !canRequestAds || !isPrepared(placementId)) {
              settle({ status: "FAILED", reason: "PROVIDER" });
              return;
            }
            // iOS leaves the show promise pending when an unearned ad is closed.
            // Native events therefore settle an operation-owned result instead.
            await addListener(
              port.addListener(RewardAdPluginEvents.Rewarded, () => {
                if (!settled) earned = true;
              }),
            );
            if (settled) return;
            await addListener(
              port.addListener(RewardAdPluginEvents.Dismissed, () => {
                settle(earned ? earnedResult() : { status: "CANCELLED" });
              }),
            );
            if (settled) return;
            await addListener(
              port.addListener(RewardAdPluginEvents.FailedToShow, () => {
                settle({ status: "FAILED", reason: "PROVIDER" });
              }),
            );
            if (settled) return;
            if (!canRequestAds || !isPrepared(placementId)) {
              settle({ status: "FAILED", reason: "PROVIDER" });
              return;
            }
            prepared = undefined; // A displayed slot is consumed, even on cancel.
            const reward = await port.showRewardVideoAd({ adId });
            // Resolution is the SDK's userDidEarnReward callback, not merely show.
            settle(
              earned ||
                (reward &&
                  Number.isFinite(reward.amount) &&
                  reward.amount > 0 &&
                  typeof reward.type === "string" &&
                  reward.type.length > 0)
                ? earnedResult()
                : { status: "CANCELLED" },
            );
          })().catch((error: unknown) => {
            settle({ status: "FAILED", reason: classifyAdMobFailure(error) });
          });
          return await result;
        } finally {
          clearTimeout(timeout);
          listeners.forEach(removeListener);
          showingReward = false;
        }
      },
    },
    async showTradeInterstitial() {
      if (
        !available ||
        !platform ||
        !canRequestAds ||
        showingInterstitial ||
        showingReward ||
        preparing
      )
        return false;
      const adId = resolveTradeInterstitialId(
        platform,
        productionEnabled,
        testEnabled,
      );
      if (!adId) return false;
      showingInterstitial = true;
      try {
        await port.prepareInterstitial({
          adId,
          isTesting: !productionEnabled,
          npa: true,
        });
        await port.showInterstitial({ adId });
        return true;
      } catch {
        return false;
      } finally {
        showingInterstitial = false;
      }
    },
  };
};
