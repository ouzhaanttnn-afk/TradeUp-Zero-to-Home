import { describe, expect, it } from "vitest";
import type { OwnershipState } from "../domain/models";
import { ownershipPresentation } from "./ownershipPresentation";

const states: OwnershipState[] = [
  "IN_INVENTORY",
  "PREPARING",
  "READY",
  "LISTED",
  "RESERVED",
  "SOLD_PENDING",
  "SOLD_COMPLETE",
];

describe("ownershipPresentation", () => {
  it.each(states)("turns %s into player-facing copy", (state) => {
    const result = ownershipPresentation(state);

    expect(result.label).not.toBe(state);
    expect(result.label).not.toContain("_");
    expect(result.label.length).toBeGreaterThan(4);
  });
});
