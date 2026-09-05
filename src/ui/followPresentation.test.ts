import { describe, expect, it } from "vitest";
import { missedOpportunityPresentation } from "./followPresentation";

describe("missedOpportunityPresentation", () => {
  it("explains an NPC purchase in player-facing language", () => {
    expect(missedOpportunityPresentation("NPC_PURCHASE", 22, 17)).toEqual({
      label: "Başka alıcı aldı",
      tone: "buyer",
      ageLabel: "5 dk önce",
    });
  });

  it("never shows a negative age after clock recovery", () => {
    expect(missedOpportunityPresentation("EXPIRED", 10, 12)).toMatchObject({
      label: "Süresi doldu",
      ageLabel: "Az önce",
    });
  });
});
