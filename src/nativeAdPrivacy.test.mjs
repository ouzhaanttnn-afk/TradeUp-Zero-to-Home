import { describe, expect, it } from "vitest";
import { assertNativeAdPrivacy } from "../scripts/check-native-ad-privacy.mjs";
describe("installed native privacy patch", () => {
  it("keeps native ATT supported, UMP before Mobile Ads and analytics ad-ID-free", () => {
    expect(() => assertNativeAdPrivacy()).not.toThrow();
  });
});
