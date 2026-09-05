import { describe, expect, it } from "vitest";
import type { CareerEvent } from "../domain/models";
import { saleHistoryCopy } from "./saleHistory";

const event: CareerEvent = {
  id: "sale-history",
  type: "FIRST_SALE",
  group: "FIRSTS",
  atGameMin: 7,
  label: "İlk satış",
  buyPriceMinor: 11_000,
  sellPriceMinor: 15_000,
  realizedProfitMinor: 3_500,
};

describe("sale history accounting copy", () => {
  it("explains the gap between purchase price and recorded profit including all extra costs", () => {
    expect(saleHistoryCopy(event)).toBe(
      "Alış ₺110 · Satış ₺150 · Ek giderler ₺5 · Toplam harcanan ₺115 · Net kâr +₺35",
    );
  });
  it("identifies a loss even when proceeds exceed the purchase price", () => {
    expect(saleHistoryCopy({ ...event, realizedProfitMinor: -500 })).toBe(
      "Alış ₺110 · Satış ₺150 · Ek giderler ₺45 · Toplam harcanan ₺155 · Net zarar -₺5",
    );
  });
  it("does not invent a zero profit for incomplete legacy records", () => {
    expect(saleHistoryCopy({ ...event, realizedProfitMinor: undefined })).toBe(
      "Alış ₺110 · Satış ₺150 · Kâr/zarar kaydı yok",
    );
    expect(saleHistoryCopy({ ...event, sellPriceMinor: undefined })).toBeNull();
  });
  it("handles free starting items and break-even sales", () => {
    expect(
      saleHistoryCopy({
        ...event,
        buyPriceMinor: 0,
        realizedProfitMinor: 15_000,
      }),
    ).toBe("Alış ₺0 · Satış ₺150 · Net kâr +₺150");
    expect(
      saleHistoryCopy({
        ...event,
        buyPriceMinor: 15_000,
        realizedProfitMinor: 0,
      }),
    ).toBe("Alış ₺150 · Satış ₺150 · Kâr/zarar ±₺0");
  });
});
