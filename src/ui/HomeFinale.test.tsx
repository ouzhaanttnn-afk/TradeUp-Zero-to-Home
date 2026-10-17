import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import HomeFinale from "./HomeFinale";
import type { FirstHomeSummary, MarketSaleMemory } from "../domain/models";
import { families } from "../content/families";

describe("personal first home finale", () => {
  it("deduplicates a first sale that is also the best sale and never reveals fair value", () => {
    const family = families[0];
    const sale: MarketSaleMemory = {
      transactionId: "sale:1",
      assetId: "asset:1",
      familyId: family.id,
      assetKey: family.assetKey,
      categoryId: family.category,
      purchasePriceMinor: 20_000,
      salePriceMinor: 30_000,
      bookCostMinor: 22_000,
      profitMinor: 8_000,
      atGameMin: 10,
    };
    const summary: FirstHomeSummary = {
      summaryVersion: 1,
      careerId: "career:1",
      homeId: "garden_edge",
      sourceTransactionId: "home:1",
      homePriceMinor: 375_000_000,
      atGameMin: 500,
      marketTradeCount: 20,
      marketProfitMinor: 15_000,
      firstProfitableSale: sale,
      bestSale: sale,
      completeness: "COMPLETE",
      origin: "LIVE",
    };
    const html = renderToStaticMarkup(
      <HomeFinale
        summary={summary}
        interiorStyle="classic"
        buttonRef={{ current: null }}
        onClose={() => {}}
      />,
    );
    expect(html).toContain("İlk evin senin.");
    expect(html.match(/<article/g)).toHaveLength(1);
    expect(html).toContain("İlk kârlı satış · En iyi satış");
    expect(html).toContain("₺80");
    expect(html).not.toContain("fairValue");
    expect(html).not.toContain("COMPLETE");
  });
  it("does not invent missing figures or the original house in an incomplete legacy save", () => {
    const html = renderToStaticMarkup(
      <HomeFinale
        summary={{
          summaryVersion: 1,
          careerId: "old",
          completeness: "PARTIAL",
          origin: "RECONSTRUCTED",
        }}
        interiorStyle="classic"
        buttonRef={{ current: null }}
        onClose={() => {}}
      />,
    );
    expect(html).toContain("bazı ayrıntıları eksik");
    expect(html).not.toContain("Bahçeli Başlangıç");
    expect(html).not.toContain("₺0");
  });
});
