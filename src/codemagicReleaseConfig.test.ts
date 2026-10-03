import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Codemagic release safety", () => {
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
    expect(workflow).toContain("com.tradeup.zerotohome");
    expect(workflow).toContain("6811362281");
    for (const command of [
      "pnpm test",
      "pnpm lint",
      "pnpm build",
      "pnpm cap:sync:ios",
    ])
      expect(workflow).toContain(command);
    expect(workflow).toContain("CFBundleShortVersionString");
    expect(workflow).toContain("'1.1.0'");
    expect(workflow).toContain("submit_to_app_store: false");
    expect(workflow).toContain('VITE_ADMOB_PRODUCTION_ENABLED: "false"');
  });
});
