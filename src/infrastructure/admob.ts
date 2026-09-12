import {
  AdMob,
  AdmobConsentStatus,
  MaxAdContentRating,
  type AdmobConsentInfo,
} from "@capacitor-community/admob";
import { Capacitor } from "@capacitor/core";
import type { RewardPlacementId } from "../domain/models";
import type {
  ConsentAdapter,
  ConsentSnapshot,
  RewardedAdAdapter,
  RewardedAdResult,
} from "./monetization";

type NativeAdPlatform = "ios" | "android";

const TEST_REWARDED_IDS: Record<NativeAdPlatform, string> = {
  ios: "ca-app-pub-3940256099942544/1712485313",
  android: "ca-app-pub-3940256099942544/5224354917",
};

const IOS_PRODUCTION_REWARDED_IDS: Record<RewardPlacementId, string> = {
  MARKET_SCOUT: "ca-app-pub-4229088811556918/4710266110",
  FAST_INSPECTION: "ca-app-pub-4229088811556918/1694441725",
  FAST_PREPARATION: "ca-app-pub-4229088811556918/6609313327",
  LISTING_REACH: "ca-app-pub-4229088811556918/4992979324",
};

export const isProductionAdServingEnabled = (value: unknown) =>
  value === "true";

export const resolveRewardedAdId = (
  placementId: RewardPlacementId,
  platform: NativeAdPlatform,
  productionEnabled: boolean,
) => {
  if (!productionEnabled) return TEST_REWARDED_IDS[platform];
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

type AdMobPort = Pick<
  typeof AdMob,
  | "initialize"
  | "requestConsentInfo"
  | "showConsentForm"
  | "showPrivacyOptionsForm"
  | "prepareRewardVideoAd"
  | "showRewardVideoAd"
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
  } = {},
): { consent: ConsentAdapter; rewarded: RewardedAdAdapter } => {
  const nativePlatform = options.platform ?? Capacitor.getPlatform();
  const platform =
    nativePlatform === "ios" || nativePlatform === "android"
      ? nativePlatform
      : null;
  const productionEnabled =
    options.productionEnabled ??
    isProductionAdServingEnabled(
      import.meta.env.VITE_ADMOB_PRODUCTION_ENABLED,
    );
  let initialized: Promise<void> | undefined;
  let canRequestAds = false;

  const initialize = () => {
    initialized ??= port.initialize({
      initializeForTesting: false,
      tagForChildDirectedTreatment: false,
      tagForUnderAgeOfConsent: false,
      maxAdContentRating: MaxAdContentRating.Teen,
    });
    return initialized;
  };

  const refreshConsent = async () => {
    if (!platform) {
      return { canRequestAds: false, adPersonalizationAllowed: false };
    }
    await initialize();
    let info = await port.requestConsentInfo({
      tagForUnderAgeOfConsent: false,
    });
    if (
      info.status === AdmobConsentStatus.REQUIRED &&
      info.isConsentFormAvailable
    ) {
      info = await port.showConsentForm();
    }
    canRequestAds = info.canRequestAds;
    return consentSnapshot(info);
  };

  return {
    consent: {
      refresh: refreshConsent,
      async openPrivacyOptions() {
        if (!platform) throw new Error("ADMOB_NATIVE_ONLY");
        await initialize();
        await port.showPrivacyOptionsForm();
      },
    },
    rewarded: {
      async show(placementId) {
        if (!platform || !canRequestAds) {
          return { status: "FAILED", reason: "PROVIDER" };
        }
        const adId = resolveRewardedAdId(
          placementId,
          platform,
          productionEnabled,
        );
        if (!adId) return { status: "FAILED", reason: "PROVIDER" };
        try {
          await port.prepareRewardVideoAd({
            adId,
            isTesting: !productionEnabled,
            npa: true,
          });
          await port.showRewardVideoAd({ adId });
          const suffix = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`;
          return {
            status: "USER_EARNED",
            providerTransactionId: `admob-${placementId}-${suffix}`,
          };
        } catch (error) {
          return {
            status: "FAILED",
            reason: classifyAdMobFailure(error),
          };
        }
      },
    },
  };
};
