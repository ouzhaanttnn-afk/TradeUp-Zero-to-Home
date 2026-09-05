import { describe, expect, it } from "vitest";
import {
  careerEventPresentation,
  completedSalesPresentation,
  timelineFilterLabel,
} from "./journeyPresentation";

describe("journey presentation", () => {
  it("replaces internal career group names with player-facing Turkish", () => {
    expect(timelineFilterLabel("MILESTONES")).toBe("Gelişim");
    expect(careerEventPresentation("RECORDS", 18, 11)).toEqual({
      label: "Rekor",
      tone: "record",
      ageLabel: "7 dk önce",
    });
  });

  it("keeps recovered clocks from showing a negative event age", () => {
    expect(careerEventPresentation("HOME", 4, 8).ageLabel).toBe("Az önce");
  });

  it("describes completed sale outcomes without hiding a loss", () => {
    expect(completedSalesPresentation(-1).label).toContain("zarar");
    expect(completedSalesPresentation(1).label).toContain("kâr");
    expect(completedSalesPresentation(0).tone).toBe("neutral");
  });
});
