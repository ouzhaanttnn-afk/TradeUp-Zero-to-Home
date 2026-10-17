import { describe, expect, it } from "vitest";
import { normalizeProfileName } from "./profile";

describe("local player names", () => {
  it("preserves the existing whitespace and length contract", () => {
    expect(normalizeProfileName("  Pazar   Ustası  ")).toBe("Pazar Ustası");
    expect(normalizeProfileName("a".repeat(30))).toBe("a".repeat(20));
    expect(normalizeProfileName("   ")).toBeUndefined();
  });
  it.each([
    "Alper\nTüccar",
    "Alper\tTüccar",
    "Alper\u0000",
    "Alper\u0085",
    "Alper\u2028Tüccar",
    "Alper\u2029Tüccar",
  ])("rejects control characters: %j", (value) => {
    expect(normalizeProfileName(value)).toBeUndefined();
  });
});
