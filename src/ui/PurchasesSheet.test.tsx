import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  configureMonetizationAdapters,
  unavailableMonetizationAdapters,
} from "../services/monetization";
import { initialState } from "../game";
import type { StoreProductMetadata } from "../infrastructure/monetization";
import PurchasesSheet from "./PurchasesSheet";

vi.mock("../stores/gameStore", () => ({
  useGameStore: () => ({
    appearance: { shellTheme: "classic", homeInteriorStyle: "classic" },
    setShellTheme: vi.fn(),
    setHomeInteriorStyle: vi.fn(),
  }),
}));

const renderShop = (
  game = initialState(),
  storeProducts: StoreProductMetadata[] = [],
) =>
  renderToStaticMarkup(
    <PurchasesSheet
      game={game}
      storeProducts={storeProducts}
      monetizationBusy={false}
      purchaseProduct={async () => {}}
      restorePurchases={async () => {}}
      showPrivacyOptions={async () => {}}
      onClose={() => {}}
    />,
  );

describe("two main store packs", () => {
  afterEach(() =>
    configureMonetizationAdapters(unavailableMonetizationAdapters),
  );

  it("hides unavailable privacy controls but retains them for an active denied-consent provider", () => {
    configureMonetizationAdapters(unavailableMonetizationAdapters);
    expect(renderShop()).not.toContain(">Gizlilik</button>");
    configureMonetizationAdapters({
      ...unavailableMonetizationAdapters,
      consent: {
        available: true,
        async refresh() {
          return { canRequestAds: false, adPersonalizationAllowed: false };
        },
        async openPrivacyOptions() {},
      },
    });
    expect(renderShop()).toContain(">Gizlilik</button>");
  });
  it("offers No Ads then Premium and keeps standalone cosmetics in a closed disclosure", () => {
    const html = renderShop();
    expect(
      html.indexOf('data-product-id="tradeup_no_ads_lifetime"'),
    ).toBeLessThan(html.indexOf('data-product-id="tradeup_premium_lifetime"'));
    expect(html).toContain('<details class="extra-purchases">');
    expect(
      html.indexOf('data-product-id="tradeup_theme_night_market"'),
    ).toBeGreaterThan(html.indexOf('<details class="extra-purchases">'));
    expect(html.match(/data-product-id=/g)).toHaveLength(6);
    expect(html).not.toContain("Mağaza hazır");
    expect(html).not.toContain("Satın al ·");
  });

  it("enables purchase only for an available product with an actual store price", () => {
    const product: StoreProductMetadata = {
      productId: "tradeup_no_ads_lifetime",
      title: "No Ads",
      localizedPrice: "€1,99",
      available: true,
    };
    expect(renderShop(initialState(), [product])).toContain(
      'aria-label="Reklamsız · Satın al · €1,99"',
    );
    expect(
      renderShop(initialState(), [{ ...product, available: false }]),
    ).not.toContain("Satın al ·");
    expect(
      renderShop(initialState(), [{ ...product, localizedPrice: "" }]),
    ).not.toContain("Satın al ·");
  });

  it("keeps Premium available to No Ads owners without granting any cosmetics", () => {
    const game = initialState();
    game.monetization.entitlements.push({
      productId: "tradeup_no_ads_lifetime",
      entitlementId: "no_ads_lifetime",
      platform: "ios",
      status: "OWNED",
    });
    const html = renderShop(game);
    expect(html).toContain("Reklamsız aktif");
    expect(html).not.toContain('data-product-id="tradeup_no_ads_lifetime"');
    expect(html.match(/data-product-id=/g)).toHaveLength(5);
    expect(html).toContain('data-product-id="tradeup_premium_lifetime"');
    expect(html).not.toContain("Premium ile açık");
  });

  it("hides all redundant purchases for Premium owners but retains pending payment feedback", () => {
    const game = initialState();
    game.monetization.entitlements.push({
      productId: "tradeup_premium_lifetime",
      entitlementId: "premium_lifetime",
      platform: "ios",
      status: "OWNED",
    });
    expect(renderShop(game)).not.toContain("data-product-id=");
    expect(renderShop(game)).toContain("Premium ile açık");
    game.monetization.entitlements[0].status = "PENDING";
    const html = renderShop(game, [
      {
        productId: "tradeup_premium_lifetime",
        title: "Premium",
        localizedPrice: "€4,99",
        available: true,
      },
    ]);
    expect(html).toContain("Ödeme beklemede");
    expect(html).not.toContain("Satın al ·");
  });
});
