import { describe, expect, it } from "vitest";
import appSource from "../App.tsx?raw";
import metaSource from "../domain/meta.ts?raw";
import storeSource from "../stores/gameStore.ts?raw";
import { simplifyLegacyPlayerCopy } from "./playerLanguage";

const playerFacingSource = `${appSource}\n${metaSource}\n${storeSource}`;

describe("player-facing language", () => {
  it.each([
    "Likidite",
    "Net worth",
    "book cost",
    "Family alarmı",
    "Family alarmları",
    "Aynı family",
    "Pazar okuryazarlığı",
    "tahmini premium",
  ])("does not expose the technical term %s", (term) => {
    expect(playerFacingSource).not.toContain(term);
  });

  it("simplifies labels already stored in older career history", () => {
    expect(simplifyLegacyPlayerCopy("Pazar okuryazarlığı Lv3 oldu")).toBe(
      "Pazar deneyimi Seviye 3 oldu",
    );
  });
});
