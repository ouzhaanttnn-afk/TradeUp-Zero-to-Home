import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export function assertNativeAdPrivacy(root = process.cwd()) {
  const text = (path) => readFileSync(resolve(root, path), "utf8");
  const plugin = text(
    "node_modules/@capacitor-community/admob/ios/Sources/AdMobPlugin/AdMobPlugin.swift",
  );
  const info = text("ios/App/App/Info.plist");
  const spm = text("ios/App/CapApp-SPM/Package.swift");
  const adPackage = text(
    "node_modules/@capacitor-community/admob/Package.swift",
  );
  if (
    !plugin.includes("import AppTrackingTransparency") ||
    !plugin.includes("ATTrackingManager.requestTrackingAuthorization") ||
    !adPackage.includes('.linkedFramework("AppTrackingTransparency")')
  )
    throw new Error(
      "Native ATT support is missing from the installed AdMob package.",
    );
  if (
    !/<key>NSUserTrackingUsageDescription<\/key>\s*<string>[^<]+<\/string>/.test(
      info,
    )
  )
    throw new Error("The ATT purpose string is missing.");
  for (const language of ["tr", "en"])
    if (
      !text(`ios/App/App/${language}.lproj/InfoPlist.strings`).includes(
        '"NSUserTrackingUsageDescription"',
      )
    )
      throw new Error(`Missing ${language} ATT localization.`);
  for (const setting of [
    "setPublisherFirstPartyIDEnabled(false)",
    "publisherPrivacyPersonalizationState = .disabled",
  ])
    if (!plugin.includes(setting))
      throw new Error(`Missing native privacy setting: ${setting}`);
  if (
    !/@objc func requestConsentInfo[^]*?self\.consentExecutor\.plugin = self/.test(
      plugin,
    )
  )
    throw new Error("UMP cannot operate before Mobile Ads initialization.");
  if (!spm.includes('traits: ["AnalyticsWithoutAdIdSupport"]'))
    throw new Error("Firebase ad-ID-free package trait is missing.");
  for (const key of [
    "FIREBASE_ANALYTICS_COLLECTION_ENABLED",
    "GOOGLE_ANALYTICS_IDFV_COLLECTION_ENABLED",
    "GOOGLE_ANALYTICS_DEFAULT_ALLOW_AD_STORAGE",
    "GOOGLE_ANALYTICS_DEFAULT_ALLOW_AD_USER_DATA",
    "GOOGLE_ANALYTICS_DEFAULT_ALLOW_AD_PERSONALIZATION_SIGNALS",
  ])
    if (!info.match(new RegExp(`<key>${key}</key>\\s*<false/>`)))
      throw new Error(`Unsafe native analytics default: ${key}`);
}
if (process.argv[1]?.endsWith("check-native-ad-privacy.mjs")) {
  assertNativeAdPrivacy();
  console.log(
    "Native UMP/ATT support, non-personalized ads and analytics privacy checks passed.",
  );
}
