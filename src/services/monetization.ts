import { MONETIZATION_CONFIG } from "../domain/config";
import {
  applyRewardedResult,
  closeRewardedAction,
  requestMonetizedAction,
  syncConsentState,
  syncVerifiedEntitlement,
} from "../domain/monetization";
import type {
  GameState,
  MonetizationProductId,
  RewardPlacementId,
} from "../domain/models";
import {
  unavailableConsentAdapter,
  unavailableBillingAdapter,
  unavailableRewardedAdAdapter,
  type BillingAdapter,
  type ConsentAdapter,
  type RewardedAdAdapter,
  type StoreProductMetadata,
  type VerifiedEntitlementEvent,
} from "../infrastructure/monetization";

export type MonetizationAdapters = {
  billing: BillingAdapter;
  consent: ConsentAdapter;
  rewarded: RewardedAdAdapter;
};

export const unavailableMonetizationAdapters: MonetizationAdapters = {
  billing: unavailableBillingAdapter,
  consent: unavailableConsentAdapter,
  rewarded: unavailableRewardedAdAdapter,
};

let activeAdapters = unavailableMonetizationAdapters;

export const getMonetizationAdapters = () => activeAdapters;

export const configureMonetizationAdapters = (
  adapters: MonetizationAdapters,
) => {
  activeAdapters = adapters;
};

const lockedProductIds = new Set<MonetizationProductId>(
  MONETIZATION_CONFIG.productCatalog.map((product) => product.productId),
);

const isLockedProduct = (
  productId: string,
): productId is MonetizationProductId =>
  lockedProductIds.has(productId as MonetizationProductId);

const validMetadata = (products: StoreProductMetadata[]) => {
  const seen = new Set<MonetizationProductId>();
  return products.filter((product) => {
    if (
      !isLockedProduct(product.productId) ||
      seen.has(product.productId) ||
      !product.available ||
      !product.localizedPrice.trim()
    ) {
      return false;
    }
    seen.add(product.productId);
    return true;
  });
};

const isMatchingEvent = (
  event: VerifiedEntitlementEvent,
  requestedProductId?: MonetizationProductId,
) => {
  if (!isLockedProduct(event.productId)) return false;
  if (requestedProductId && event.productId !== requestedProductId)
    return false;
  const catalog = MONETIZATION_CONFIG.productCatalog.find(
    (product) => product.productId === event.productId,
  );
  return catalog?.entitlementId === event.entitlementId;
};

export type MonetizationRefreshResult = {
  state: GameState;
  products: StoreProductMetadata[];
  storeAvailable: boolean;
};

export const refreshMonetization = async (
  state: GameState,
  adapters: MonetizationAdapters,
): Promise<MonetizationRefreshResult> => {
  const [consent, products] = await Promise.allSettled([
    adapters.consent.refresh(),
    adapters.billing.loadProducts(),
  ]);
  const next =
    consent.status === "fulfilled"
      ? syncConsentState(
          state,
          consent.value.canRequestAds,
          consent.value.adPersonalizationAllowed,
        )
      : syncConsentState(state, false, false);
  const metadata =
    products.status === "fulfilled" ? validMetadata(products.value) : [];
  return {
    state: next,
    products: metadata,
    storeAvailable: metadata.length > 0,
  };
};

export type PurchaseFlowStatus = "OWNED" | "PENDING" | "CANCELLED" | "FAILED";

export const purchaseStoreProduct = async (
  state: GameState,
  productId: MonetizationProductId,
  billing: BillingAdapter,
): Promise<{ state: GameState; status: PurchaseFlowStatus }> => {
  if (!isLockedProduct(productId)) return { state, status: "FAILED" };
  try {
    const result = await billing.purchase(productId);
    if (result.status === "CANCELLED") return { state, status: "CANCELLED" };
    if (result.status === "FAILED") return { state, status: "FAILED" };
    if (!isMatchingEvent(result.event, productId)) {
      return { state, status: "FAILED" };
    }
    if (result.status === "PENDING") {
      return {
        state: syncVerifiedEntitlement(
          state,
          productId,
          "PENDING",
          result.event.platform,
        ),
        status: "PENDING",
      };
    }
    if (result.event.status !== "OWNED") return { state, status: "FAILED" };
    return {
      state: syncVerifiedEntitlement(
        state,
        productId,
        "OWNED",
        result.event.platform,
      ),
      status: "OWNED",
    };
  } catch {
    return { state, status: "FAILED" };
  }
};

export const restoreStoreProducts = async (
  state: GameState,
  billing: BillingAdapter,
): Promise<{ state: GameState; synced: number; failed: boolean }> => {
  try {
    const events = await billing.restore();
    let next = state;
    let synced = 0;
    for (const event of events) {
      if (!isMatchingEvent(event)) continue;
      next = syncVerifiedEntitlement(
        next,
        event.productId,
        event.status,
        event.platform,
      );
      synced += 1;
    }
    return { state: next, synced, failed: false };
  } catch {
    return { state, synced: 0, failed: true };
  }
};

export type RewardFlowStatus =
  "APPLIED" | "CANCELLED" | "FAILED" | "INELIGIBLE";

export const runRewardedAction = async (
  state: GameState,
  placementId: RewardPlacementId,
  source: "ad" | "premium",
  rewarded: RewardedAdAdapter,
): Promise<{ state: GameState; status: RewardFlowStatus }> => {
  const requested = requestMonetizedAction(state, placementId, source);
  if (!requested.ok) {
    return { state: requested.state, status: "INELIGIBLE" };
  }
  if (source === "premium") {
    return { state: requested.state, status: "APPLIED" };
  }
  try {
    const result = await rewarded.show(placementId);
    if (result.status === "USER_EARNED") {
      return {
        state: applyRewardedResult(requested.state, requested.rewardId),
        status: "APPLIED",
      };
    }
    const status = result.status === "CANCELLED" ? "CANCELLED" : "FAILED";
    return {
      state: closeRewardedAction(requested.state, requested.rewardId, status),
      status,
    };
  } catch {
    return {
      state: closeRewardedAction(requested.state, requested.rewardId, "FAILED"),
      status: "FAILED",
    };
  }
};

export const openPrivacyOptions = async (consent: ConsentAdapter) => {
  try {
    await consent.openPrivacyOptions();
    return true;
  } catch {
    return false;
  }
};
