import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Codemagic release safety", () => {
  it("disables Vercel auto-deployment only for the authorized native test branch", () => {
    const config = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));
    expect(config.git.deploymentEnabled).toEqual({ "codex/first-home-polish": false });
  });
  it("provides a manual artifact-only workflow without Apple publication", () => {
    const workflow = readFileSync(
      new URL("../codemagic.yaml", import.meta.url),
      "utf8",
    ).split("  tradeup-ios-testflight:")[0];
    expect(workflow).toContain("tradeup-ios-artifact:");
    expect(workflow).not.toMatch(/^\s+publishing:/m);
    expect(workflow).not.toContain("triggering:");
    for (const command of [
      "--upload-app",
      "app-store-connect publish",
      "submit_to_testflight: true",
      "submit_to_app_store: true",
    ])
      expect(workflow).not.toMatch(new RegExp(`^\\s+[^#\\n]*${command}`, "m"));
    expect(workflow).toContain("TRADEUP_IOS_BUILD_NUMBER > 43");
    expect(workflow).toContain("verify-ios-artifact.py");
    expect(workflow).toContain('VITE_ADMOB_PRODUCTION_ENABLED: "true"');
    expect(workflow).toContain('VITE_ADMOB_TEST_ENABLED: "false"');
  });
  it("uses only the free M2 workflow and cannot silently reuse an Apple build", () => {
    const workflow = readFileSync(
      new URL("../codemagic.yaml", import.meta.url),
      "utf8",
    );
    expect(workflow).toContain("instance_type: mac_mini_m2");
    expect(workflow).not.toContain("triggering:");
    expect(workflow).toContain("TRADEUP_IOS_BUILD_NUMBER > 41");
    expect(workflow).toContain("TRADEUP_IOS_BUILD_NUMBER > latest");
    expect(workflow).toContain("get-latest-testflight-build-number");
    // Explicit profile references replace the old bundle-based auto-selection.
    // The exported IPA verifier, not a YAML comment, must bind the app identity.
    const verifier = readFileSync(new URL("../scripts/verify-ios-artifact.py", import.meta.url), "utf8");
    expect(verifier).toContain('assert info["CFBundleIdentifier"] == "com.tradeup.zerotohome"');
    expect(workflow).toContain("6811362281");
    for (const command of [
      "pnpm test",
      "pnpm lint",
      "pnpm build",
      "pnpm cap:sync:ios",
    ])
      expect(workflow).toContain(command);
    expect(workflow).toContain("CFBundleShortVersionString");
    expect(workflow).toContain("'1.2.0'");
    expect(workflow).toContain("submit_to_app_store: false");
    expect(workflow).not.toContain('VITE_ADMOB_PRODUCTION_ENABLED: "false"');
    expect(workflow).toContain('VITE_ADMOB_PRODUCTION_ENABLED: "true"');
    expect(workflow).toContain('VITE_ADMOB_TEST_ENABLED: "false"');
    expect(workflow).toContain("node scripts/check-review-ad-config.mjs");
  });
  it("requires the matching Game Center profile and signed entitlement checks in both workflows", () => {
    const yaml = readFileSync(new URL("../codemagic.yaml", import.meta.url), "utf8");
    const workflows = yaml.split(/^  tradeup-ios-(?:artifact|testflight):/m).slice(1);
    expect(workflows).toHaveLength(2);
    for (const workflow of workflows) {
      expect(workflow).toContain("provisioning_profiles:\n          - tradeup_game_center_distribution_20261019");
      expect(workflow).toContain("certificates:\n          - tradeup_distribution");
      expect(workflow).toContain("codesign --verify --deep --strict");
      expect(workflow).toContain("--signed-entitlements");
      expect(workflow).toContain("max_build_duration: 20");
    }
  });
});
