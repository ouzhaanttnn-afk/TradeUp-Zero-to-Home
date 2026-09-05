import { describe, expect, it } from "vitest";
import type { EvidenceStatus } from "../domain/models";
import { evidencePresentation } from "./evidencePresentation";

const statuses: EvidenceStatus[] = [
  "UNKNOWN",
  "CLAIMED",
  "VISIBLE",
  "SUSPICIOUS",
  "CHECKED",
  "VERIFIED",
];

describe("evidencePresentation", () => {
  it.each(statuses)("gives %s a player-facing Turkish label", (status) => {
    const result = evidencePresentation(status);

    expect(result.label).not.toBe(status);
    expect(result.label.length).toBeGreaterThan(3);
    expect(["neutral", "info", "warning", "success"]).toContain(result.tone);
  });
});
