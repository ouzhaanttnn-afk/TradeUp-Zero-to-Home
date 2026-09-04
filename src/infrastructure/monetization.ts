import type {
  EntitlementId,
  MonetizationProductId,
  RewardPlacementId,
} from "../domain/models";

export type StoreProductMetadata = {
  productId: MonetizationProductId;
  title: string;
  localizedPrice: string;
  available: boolean;
};

export type VerifiedEntitlementEvent = {
  transactionId: string;
  productId: MonetizationProductId;
  entitlementId: EntitlementId;
  platform: "ios" | "android";
  status: "PENDING" | "OWNED" | "REVOKED";
  verifiedAtGameMin?: number;
};

export type BillingPurchaseResult =
  | { status: "VERIFIED"; event: VerifiedEntitlementEvent }
  | { status: "PENDING"; event: VerifiedEntitlementEvent }
  | { status: "CANCELLED" }
  | { status: "FAILED"; reason: string };

export interface BillingAdapter {
  loadProducts(): Promise<StoreProductMetadata[]>;
  purchase(productId: MonetizationProductId): Promise<BillingPurchaseResult>;
  restore(): Promise<VerifiedEntitlementEvent[]>;
}

export type ConsentSnapshot = {
  canRequestAds: boolean;
  adPersonalizationAllowed: boolean;
};

export interface ConsentAdapter {
  refresh(): Promise<ConsentSnapshot>;
  openPrivacyOptions(): Promise<void>;
}

export type RewardedAdResult =
  | { status: "USER_EARNED"; providerTransactionId: string }
  | { status: "CANCELLED" }
  | { status: "FAILED"; reason: "NO_FILL" | "NETWORK" | "PROVIDER" };

export interface RewardedAdAdapter {
  show(placementId: RewardPlacementId): Promise<RewardedAdResult>;
}

// Native StoreKit/Play Billing and AdMob implementations plug into these contracts.
// Web/dev builds stay inert so production serving cannot be enabled accidentally.
export const unavailableBillingAdapter: BillingAdapter = {
  async loadProducts() {
    return [];
  },
  async purchase() {
    return { status: "FAILED", reason: "BILLING_UNAVAILABLE" };
  },
  async restore() {
    return [];
  },
};

export const createSandboxBillingAdapter = (fixture: {
  products: StoreProductMetadata[];
  purchases?: Partial<Record<MonetizationProductId, BillingPurchaseResult>>;
  restored?: VerifiedEntitlementEvent[];
}): BillingAdapter => ({
  async loadProducts() {
    return fixture.products;
  },
  async purchase(productId) {
    return (
      fixture.purchases?.[productId] ?? {
        status: "FAILED",
        reason: "SANDBOX_RESULT_NOT_CONFIGURED",
      }
    );
  },
  async restore() {
    return fixture.restored ?? [];
  },
});

export const createSandboxConsentAdapter = (
  snapshot: ConsentSnapshot,
): ConsentAdapter => ({
  async refresh() {
    return snapshot;
  },
  async openPrivacyOptions() {},
});

export const createSandboxRewardedAdAdapter = (
  results: RewardedAdResult[],
): RewardedAdAdapter => {
  let cursor = 0;
  return {
    async show() {
      const result = results[cursor];
      cursor += 1;
      return result ?? { status: "FAILED", reason: "NO_FILL" };
    },
  };
};

export const deniedConsentAdapter: ConsentAdapter = {
  async refresh() {
    return { canRequestAds: false, adPersonalizationAllowed: false };
  },
  async openPrivacyOptions() {},
};

export const unavailableRewardedAdAdapter: RewardedAdAdapter = {
  async show() {
    return { status: "FAILED", reason: "PROVIDER" };
  },
};
