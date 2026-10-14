import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const text = (path: string) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
describe("confirmed publisher contact and app-ads", () => {
  it("uses the confirmed contact in all current legal/support documents", () => {
    for (const path of [
      "public/privacy.html",
      "public/support.html",
      "docs/PRIVACY_POLICY_TR.md",
      "docs/GOOGLE_PLAY_LISTING_TR.md",
      "docs/IOS_RELEASE_READINESS.md",
    ]) {
      expect(text(path)).toContain("nostoscomp@gmail.com");
      expect(text(path)).not.toContain("studionostos.dev@gmail.com");
    }
    const settings = text("src/ui/SettingsPanel.tsx");
    expect(settings).toContain('href="/support.html"');
    expect(settings).toContain('href="/privacy.html"');
  });
  it("provides the real publisher's authorized seller file, not a demo identity", () => {
    expect(text("public/app-ads.txt").trim()).toBe(
      "google.com, pub-4229088811556918, DIRECT, f08c47fec0942fa0",
    );
  });
});
