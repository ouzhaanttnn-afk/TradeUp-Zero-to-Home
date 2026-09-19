import { Capacitor } from "@capacitor/core";
import { NativePurchases, PURCHASE_TYPE } from "@capgo/native-purchases";
import { MONETIZATION_CONFIG } from "../domain/config";
import type { MonetizationProductId } from "../domain/models";
import type {
  BillingAdapter,
  BillingPurchaseResult,
  VerifiedEntitlementEvent,
} from "./monetization";

type PurchasePort = Pick<
  typeof NativePurchases,
  | "isBillingSupported"
  | "getProducts"
  | "purchaseProduct"
  | "restorePurchases"
  | "getPurchases"
>;

const catalog = new Map(
  MONETIZATION_CONFIG.productCatalog.map((product) => [
    product.productId,
    product.entitlementId,
  ]),
);

const isProductId = (id: string): id is MonetizationProductId =>
  catalog.has(id as MonetizationProductId);

const ownedEvents = (
  purchases: Awaited<ReturnType<PurchasePort["getPurchases"]>>["purchases"],
): VerifiedEntitlementEvent[] =>
  purchases.flatMap((transaction) => {
    if (
      !isProductId(transaction.productIdentifier) ||
      !transaction.transactionId ||
      transaction.revocationDate ||
      (transaction.purchaseState && transaction.purchaseState !== "1")
    ) {
      return [];
    }
    return [
      {
        transactionId: transaction.transactionId,
        productId: transaction.productIdentifier,
        entitlementId: catalog.get(transaction.productIdentifier)!,
        platform: "ios" as const,
        status: "OWNED" as const,
      },
    ];
  });

export const createIosBillingAdapter = (
  port: PurchasePort = NativePurchases,
  platform: string = Capacitor.getPlatform(),
): BillingAdapter => {
  const supported = async () =>
    platform === "ios" && (await port.isBillingSupported()).isBillingSupported;
  const current = async () => {
    const { purchases } = await port.getPurchases({
      productType: PURCHASE_TYPE.INAPP,
      onlyCurrentEntitlements: true,
    });
    return ownedEvents(purchases);
  };
  return {
    completeEntitlementSnapshot: true,
    async loadProducts() {
      if (!(await supported())) return [];
      const { products } = await port.getProducts({
        productIdentifiers: [...catalog.keys()],
        productType: PURCHASE_TYPE.INAPP,
      });
      return products
        .filter(
          (product) => isProductId(product.identifier) && !!product.priceString,
        )
        .map((product) => ({
          productId: product.identifier as MonetizationProductId,
          title: product.title,
          localizedPrice: product.priceString,
          available: true,
        }));
    },
    async purchase(productId): Promise<BillingPurchaseResult> {
      if (!(await supported()) || !catalog.has(productId)) {
        return { status: "FAILED", reason: "BILLING_UNAVAILABLE" };
      }
      try {
        const transaction = await port.purchaseProduct({
          productIdentifier: productId,
          productType: PURCHASE_TYPE.INAPP,
          quantity: 1,
        });
        const event = (await current()).find(
          (item) =>
            item.productId === productId &&
            item.transactionId === transaction.transactionId,
        );
        return event
          ? { status: "VERIFIED", event }
          : { status: "FAILED", reason: "ENTITLEMENT_NOT_VERIFIED" };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (/cancel/i.test(message)) return { status: "CANCELLED" };
        if (/pending/i.test(message)) {
          return {
            status: "PENDING",
            event: {
              transactionId: `pending:${productId}`,
              productId,
              entitlementId: catalog.get(productId)!,
              platform: "ios",
              status: "PENDING",
            },
          };
        }
        return { status: "FAILED", reason: "STOREKIT_FAILED" };
      }
    },
    async restore() {
      if (!(await supported())) throw new Error("BILLING_UNAVAILABLE");
      await port.restorePurchases();
      return current();
    },
    async currentEntitlements() {
      if (!(await supported())) throw new Error("BILLING_UNAVAILABLE");
      return current();
    },
  };
};
