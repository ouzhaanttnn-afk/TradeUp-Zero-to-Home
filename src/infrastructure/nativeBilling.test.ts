import { describe, expect, it, vi } from "vitest";
import { createIosBillingAdapter } from "./nativeBilling";

const purchased = {
  transactionId: "storekit:1",
  productIdentifier: "tradeup_premium_lifetime",
  purchaseDate: "2026-09-19T00:00:00Z",
};

const port = () => ({
  isBillingSupported: vi.fn().mockResolvedValue({ isBillingSupported: true }),
  getProducts: vi.fn().mockResolvedValue({
    products: [
      {
        identifier: purchased.productIdentifier,
        title: "Premium",
        priceString: "₺249,99",
      },
    ],
  }),
  purchaseProduct: vi.fn().mockResolvedValue(purchased),
  restorePurchases: vi.fn().mockResolvedValue(undefined),
  getPurchases: vi.fn().mockResolvedValue({ purchases: [purchased] }),
});

describe("iOS StoreKit adapter", () => {
  it("uses localized store metadata and current verified entitlements", async () => {
    const native = port();
    const billing = createIosBillingAdapter(native as never, "ios");
    expect(await billing.loadProducts()).toEqual([
      {
        productId: purchased.productIdentifier,
        title: "Premium",
        localizedPrice: "₺249,99",
        available: true,
      },
    ]);
    expect(await billing.purchase("tradeup_premium_lifetime")).toMatchObject({
      status: "VERIFIED",
      event: { transactionId: "storekit:1", status: "OWNED", platform: "ios" },
    });
    expect(native.getPurchases).toHaveBeenCalledWith({
      productType: "inapp",
      onlyCurrentEntitlements: true,
    });
  });

  it("never grants when the current StoreKit snapshot lacks the transaction", async () => {
    const native = port();
    native.getPurchases.mockResolvedValue({ purchases: [] });
    const billing = createIosBillingAdapter(native as never, "ios");
    expect(await billing.purchase("tradeup_premium_lifetime")).toEqual({
      status: "FAILED",
      reason: "ENTITLEMENT_NOT_VERIFIED",
    });
  });

  it("restores only active products and disables billing outside iOS", async () => {
    const native = port();
    native.getPurchases.mockResolvedValue({
      purchases: [{ ...purchased, revocationDate: "2026-09-20" }],
    });
    const billing = createIosBillingAdapter(native as never, "ios");
    expect(await billing.restore()).toEqual([]);
    expect(native.restorePurchases).toHaveBeenCalledOnce();
    const android = createIosBillingAdapter(native as never, "android");
    expect(await android.loadProducts()).toEqual([]);
    expect(native.getProducts).toHaveBeenCalledTimes(0);
  });
});
