import { describe, expect, it } from "vitest";
import {
  manualListingPriceMinor,
  manualListingWaitCopy,
} from "./manualListingPrice";

describe("manual listing price", () => {
  it("accepts Turkish decimal input and rejects unsafe or malformed values", () => {
    expect(manualListingPriceMinor("1250")).toBe(125_000);
    expect(manualListingPriceMinor("1250,50")).toBe(125_050);
    expect(manualListingPriceMinor("0")).toBeNull();
    expect(manualListingPriceMinor("12abc")).toBeNull();
    expect(manualListingPriceMinor("999999999")).toBeNull();
  });

  it("describes waiting without revealing an acceptance percentage", () => {
    expect(manualListingWaitCopy(39_000, 42_000, 46_000)).toBe(
      "Daha kısa bekleme",
    );
    expect(manualListingWaitCopy(44_000, 42_000, 46_000)).toBe(
      "Normal bekleme",
    );
    expect(manualListingWaitCopy(50_000, 42_000, 46_000)).toBe(
      "Daha uzun bekleme",
    );
  });
});
