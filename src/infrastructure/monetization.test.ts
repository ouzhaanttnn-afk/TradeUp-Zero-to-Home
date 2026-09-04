import { describe, expect, it } from "vitest";
import { MONETIZATION_CONFIG } from "../domain/config";
import {
  createSandboxBillingAdapter,
  createSandboxConsentAdapter,
  createSandboxRewardedAdAdapter,
  type StoreProductMetadata,
} from "./monetization";

const products: StoreProductMetadata[] = MONETIZATION_CONFIG.productCatalog.map(
  ({ productId }) => ({
    productId,
    title: productId,
    localizedPrice: "Sandbox price",
    available: true,
  }),
);

describe("monetization provider contracts", () => {
  it("loads exactly the four locked products from provider metadata", async () => {
    const adapter = createSandboxBillingAdapter({ products });
    const loaded = await adapter.loadProducts();
    expect(loaded).toHaveLength(4);
    expect(loaded.map((product) => product.productId)).toEqual(
      MONETIZATION_CONFIG.productCatalog.map((product) => product.productId),
    );
  });

  it("represents pending, cancel and verified restore without client ownership", async () => {
    const pendingProduct = "tradeup_premium_lifetime" as const;
    const adapter = createSandboxBillingAdapter({
      products,
      purchases: {
        [pendingProduct]: {
          status: "PENDING",
          event: {
            transactionId: "sandbox:pending",
            productId: pendingProduct,
            entitlementId: "premium_lifetime",
            platform: "android",
            status: "PENDING",
          },
        },
        tradeup_theme_workshop: { status: "CANCELLED" },
      },
      restored: [
        {
          transactionId: "sandbox:restore",
          productId: "tradeup_theme_night_market",
          entitlementId: "theme_night_market",
          platform: "ios",
          status: "OWNED",
          verifiedAtGameMin: 30,
        },
      ],
    });
    expect((await adapter.purchase(pendingProduct)).status).toBe("PENDING");
    expect((await adapter.purchase("tradeup_theme_workshop")).status).toBe(
      "CANCELLED",
    );
    expect(await adapter.restore()).toHaveLength(1);
  });

  it("keeps consent denial playable and exposes rewarded failure outcomes", async () => {
    const consent = createSandboxConsentAdapter({
      canRequestAds: false,
      adPersonalizationAllowed: false,
    });
    expect(await consent.refresh()).toEqual({
      canRequestAds: false,
      adPersonalizationAllowed: false,
    });
    const ads = createSandboxRewardedAdAdapter([
      { status: "CANCELLED" },
      { status: "FAILED", reason: "NO_FILL" },
      { status: "USER_EARNED", providerTransactionId: "sandbox:reward:1" },
    ]);
    expect((await ads.show("MARKET_SCOUT")).status).toBe("CANCELLED");
    expect((await ads.show("MARKET_SCOUT")).status).toBe("FAILED");
    expect((await ads.show("MARKET_SCOUT")).status).toBe("USER_EARNED");
  });
});
