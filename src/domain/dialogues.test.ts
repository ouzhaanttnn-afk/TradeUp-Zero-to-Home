import { describe, expect, it } from "vitest";
import { getBuyerQuote, getSellerQuote } from "./dialogues";

describe("living dialogue system", () => {
  it("provides distinct character quotes for all seller archetypes", () => {
    const urgent = getSellerQuote("urgent", "greeting", "tr");
    const merchant = getSellerQuote("merchant", "greeting", "tr");
    const emotional = getSellerQuote("emotional", "greeting", "tr");

    expect(urgent).toContain("acil nakit");
    expect(merchant).toContain("Piyasanın en temiz");
    expect(emotional).toContain("Gözüm gibi baktım");
  });

  it("translates quotes into EN, DE, and ES", () => {
    expect(getSellerQuote("urgent", "greeting", "en")).toContain("fast cash");
    expect(getSellerQuote("urgent", "greeting", "de")).toContain("Bargeld");
    expect(getSellerQuote("urgent", "greeting", "es")).toContain("dinero rápido");
  });

  it("provides distinct buyer dialogue responses based on persona", () => {
    const quick = getBuyerQuote("QUICK", "initial", "tr");
    const collector = getBuyerQuote("COLLECTOR", "initial", "tr");

    expect(quick).toContain("elden nakit");
    expect(collector).toContain("Koleksiyonumun eksik");
  });
});
