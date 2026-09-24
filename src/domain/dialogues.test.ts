import { describe, expect, it } from "vitest";
import { getBuyerBadge, getBuyerQuote, getSellerBadge, getSellerQuote } from "./dialogues";

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

  it("provides visual badges and titles for sellers and buyers", () => {
    const urgentBadge = getSellerBadge("urgent");
    expect(urgentBadge.icon).toBe("⚡");
    expect(urgentBadge.role.tr).toBe("Acilci Satıcı");

    const collectorBadge = getBuyerBadge("COLLECTOR");
    expect(collectorBadge.icon).toBe("🏆");
    expect(collectorBadge.role.en).toBe("Collector");
  });
});
