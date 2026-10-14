import { describe, expect, it } from "vitest";
import { assertNativeAdPrivacy } from "../scripts/check-native-ad-privacy.mjs";
describe("installed native privacy patch", () => {
  it("keeps tracking requests removed and UMP independent of Mobile Ads", () => {
    expect(() => assertNativeAdPrivacy()).not.toThrow();
  });
});
