import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("iOS release device contract", () => {
  it("ships the portrait 320–430 px experience as iPhone-only", () => {
    const project = readFileSync(
      new URL("../ios/App/App.xcodeproj/project.pbxproj", import.meta.url),
      "utf8",
    );
    const info = readFileSync(
      new URL("../ios/App/App/Info.plist", import.meta.url),
      "utf8",
    );

    expect(project).not.toContain('TARGETED_DEVICE_FAMILY = "1,2";');
    expect(project.match(/TARGETED_DEVICE_FAMILY = 1;/g)).toHaveLength(2);
    expect(project.match(/MARKETING_VERSION = 1\.1\.2;/g)).toHaveLength(2);
    expect(info).not.toContain("UISupportedInterfaceOrientations~ipad");
  });

  it("never declares App Tracking Transparency (1.1.0 build 42 rejection)", () => {
    const info = readFileSync(
      new URL("../ios/App/App/Info.plist", import.meta.url),
      "utf8",
    );
    const adapter = readFileSync(
      new URL("./infrastructure/admob.ts", import.meta.url),
      "utf8",
    );
    const appDelegate = readFileSync(
      new URL("../ios/App/App/AppDelegate.swift", import.meta.url),
      "utf8",
    );
    const spmPackage = readFileSync(
      new URL("../ios/App/CapApp-SPM/Package.swift", import.meta.url),
      "utf8",
    );

    expect(info).not.toContain("NSUserTrackingUsageDescription");
    for (const symbol of [
      "requestTrackingAuthorization",
      "trackingAuthorizationStatus",
      "ATTrackingManager",
    ])
      for (const source of [adapter, appDelegate]) {
        expect(source).not.toContain(symbol);
      }
    expect(appDelegate).not.toContain("AppTrackingTransparency");
    expect(spmPackage).toContain('traits: ["AnalyticsWithoutAdIdSupport"]');
    // Ads stay possible without tracking: consent-gated, non-personalized.
    expect(info).toContain("<key>GADApplicationIdentifier</key>");
    expect(info).toContain("<key>SKAdNetworkItems</key>");
    expect(info).toMatch(
      /<key>FIREBASE_ANALYTICS_COLLECTION_ENABLED<\/key>\s*<false\/>/,
    );
    expect(adapter.match(/npa: true/g)).toHaveLength(2);
  });
});
