import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { initialState } from "../game";
import { MarketListingCard } from "./MarketListingCard";

describe("market card signal hierarchy", () => {
  it("keeps luxury, interest and condition in one non-overlapping signal rail", () => {
    const item = structuredClone(initialState(0, "SANDBOX").listings[0]);
    item.instance.family.tier = 5;
    const html = renderToStaticMarkup(
      <MarketListingCard
        item={item}
        categoryLevel={0}
        itemSignal={{ cls: "neutral", text: "Belirsiz" }}
        risk={{ level: "critical", text: "Başka teklif var" }}
        watched={false}
        gameTimeMin={0}
        priority
        onSelect={() => {}}
      />,
    );
    expect(html.match(/class="market-badges"/g)).toHaveLength(1);
    expect(html.match(/class="market-luxury-badge"/g)).toHaveLength(1);
    expect(html).toMatch(
      /market-heat--critical[^]*market-luxury-badge[^]*Teklif[^]*market-condition-signal/,
    );
    expect(html).toMatch(/aria-label="[^"]*Başka teklif var/);
    expect(html).toContain('loading="eager"');
  });
});
