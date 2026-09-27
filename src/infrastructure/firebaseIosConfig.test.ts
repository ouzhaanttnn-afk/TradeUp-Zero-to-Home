import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const nativeFile = (path: string) =>
  readFileSync(resolve(process.cwd(), "ios", "App", path), "utf8");

describe("TradeUp iOS Firebase wiring", () => {
  it("uses the registered TradeUp app, not another game's Firebase project", () => {
    const config = nativeFile("App/GoogleService-Info.plist");
    expect(config).toMatch(/<key>BUNDLE_ID<\/key>\s*<string>com\.tradeup\.zerotohome<\/string>/);
    expect(config).toMatch(/<key>PROJECT_ID<\/key>\s*<string>tradeap-e16e4<\/string>/);
  });

  it("bundles the config and keeps analytics collection off by default", () => {
    const project = nativeFile("App.xcodeproj/project.pbxproj");
    const info = nativeFile("App/Info.plist");
    const packageSwift = nativeFile("CapApp-SPM/Package.swift");
    expect(project).toContain("GoogleService-Info.plist in Resources");
    expect(packageSwift).toContain("CapacitorFirebaseAnalytics");
    expect(info).toMatch(/<key>FIREBASE_ANALYTICS_COLLECTION_ENABLED<\/key>\s*<false\/>/);
  });
});
