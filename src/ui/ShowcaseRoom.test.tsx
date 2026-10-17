import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { initialState, money } from "../game";
import { purchaseListing } from "../domain/economy";
import { instanceEstimateBand } from "../domain/decision";
import { categoryExpertiseLevel } from "../domain/meta";
import { formatEstimate } from "./wealthPresentation";
import ShowcaseRoom from "./ShowcaseRoom";

describe("compact showcase", () => {
  it("starts collapsed and presents an evidence-based range, not exact fair value", () => {
    const before = initialState(0, "SANDBOX");
    before.cashMinor = 100_000;
    before.transactionJournal[0].cashDeltaMinor = 100_000;
    const bought = purchaseListing(before, before.listings[0], 20_000, 10);
    if (!bought.ok) throw new Error(bought.reason);
    const game = bought.state;
    const asset = game.ownedAssets[0];
    const band = instanceEstimateBand(
      asset.instance,
      categoryExpertiseLevel(game, asset.instance.family.category),
    );
    const html = renderToStaticMarkup(
      <ShowcaseRoom
        game={game}
        showcaseAssetIds={[asset.id]}
        onSelectAsset={() => {}}
        onToggleShowcase={() => {}}
      />,
    );
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain("showcase-grid");
    expect(html).toContain(formatEstimate(band, false, "tr"));
    expect(html).not.toContain(
      `⭐ ${money(asset.instance.fairValueMinor, "tr")}`,
    );
    expect(band.highMinor).toBeGreaterThan(band.lowMinor);
  });
});
