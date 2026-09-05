import { describe, expect, it } from "vitest";
import { listingAgeLabel } from "./marketCard";

describe("market card age", () => {
  it("uses short labels that fit a compact tile", () => {
    expect(listingAgeLabel(0, 0)).toBe("Yeni");
    expect(listingAgeLabel(4, 3)).toBe("Yeni");
    expect(listingAgeLabel(0, 1)).toBe("1 dk");
    expect(listingAgeLabel(0, 59)).toBe("59 dk");
    expect(listingAgeLabel(0, 60)).toBe("1 sa");
    expect(listingAgeLabel(10, 131)).toBe("2 sa");
  });
});
