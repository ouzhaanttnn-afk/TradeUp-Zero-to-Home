import { describe, expect, it } from "vitest";
import { initialState } from "../game";
import { advanceWorldTo } from "../domain/world";
import { applyRewardedResult } from "../domain/monetization";
import { reconcileJournal } from "../domain/economy";
import {
  createSandboxBillingAdapter,
  createSandboxConsentAdapter,
  createSandboxRewardedAdAdapter,
  type StoreProductMetadata,
} from "../infrastructure/monetization";
import {
  purchaseStoreProduct,
  refreshMonetization,
  restoreStoreProducts,
  runRewardedAction,
} from "./monetization";

const product: StoreProductMetadata = {
  productId: "tradeup_premium_lifetime",
  title: "TradeUp Premium",
  localizedPrice: "₺149,99",
  available: true,
};

const unlockedState = () => {
  const state = initialState(0, "SANDBOX");
  state.monetization.firstSaleComplete = true;
  state.monetization.lifetimeActivePlayMinutes = 20;
  state.monetization.consent.canRequestAds = true;
  state.analytics.events = Array.from({ length: 8 }, (_, index) => ({
    id: `impression:${index}`,
    name: "listing_impression" as const,
    atGameMin: index,
    properties: {},
  }));
  return state;
};

describe("monetization application service", () => {
  it("preserves live progress when consent refresh resolves late", async () => {
    const state = initialState(0, "SANDBOX");
    let live = state;
    let finish!: (value: {
      canRequestAds: boolean;
      adPersonalizationAllowed: boolean;
    }) => void;
    const pending = refreshMonetization(
      state,
      {
        consent: {
          refresh: () =>
            new Promise((resolve) => {
              finish = resolve;
            }),
          openPrivacyOptions: async () => {},
        },
        billing: createSandboxBillingAdapter({ products: [product] }),
        rewarded: createSandboxRewardedAdAdapter([]),
      },
      () => live,
    );
    live = advanceWorldTo(state, 3).state;
    finish({ canRequestAds: false, adPersonalizationAllowed: false });
    const result = await pending;
    expect(result.state.gameTimeMin).toBe(3);
    expect(result.state.listings).toEqual(live.listings);
    expect(result.state.transactionJournal).toEqual(live.transactionJournal);
  });

  it.each(["CANCELLED", "FAILED", "THROW", "VERIFIED"] as const)(
    "keeps live progress after delayed purchase %s",
    async (status) => {
      const state = initialState(0, "SANDBOX");
      let live = state;
      let finish!: () => void;
      const gate = new Promise<void>((resolve) => {
        finish = resolve;
      });
      const billing = createSandboxBillingAdapter({ products: [product] });
      billing.purchase = async () => {
        await gate;
        if (status === "THROW") throw new Error("offline");
        if (status === "VERIFIED")
          return {
            status,
            event: {
              transactionId: "late-purchase",
              productId: product.productId,
              entitlementId: "premium_lifetime",
              platform: "android",
              status: "OWNED",
            },
          };
        return status === "FAILED" ? { status, reason: "offline" } : { status };
      };
      const pending = purchaseStoreProduct(
        state,
        product.productId,
        billing,
        () => live,
      );
      live = advanceWorldTo(state, 3).state;
      finish();
      const result = await pending;
      expect(result.state.gameTimeMin).toBe(3);
      expect(result.state.transactionJournal).toEqual(live.transactionJournal);
      expect(
        result.state.monetization.entitlements.some(
          (entry) => entry.status === "OWNED",
        ),
      ).toBe(status === "VERIFIED");
      expect(reconcileJournal(result.state)).toEqual({
        cash: true,
        activeBookCost: true,
        realizedProfit: true,
      });
    },
  );

  it("keeps the original reward identity after time advances and ignores duplicate completion", async () => {
    let live = unlockedState();
    let finish!: () => void;
    const gate = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const pending = runRewardedAction(
      live,
      "MARKET_SCOUT",
      "ad",
      {
        show: async () => {
          await gate;
          return {
            status: "USER_EARNED",
            providerTransactionId: "late-reward",
          };
        },
      },
      {
        read: () => live,
        publish: (next) => {
          live = next;
        },
      },
    );
    const requested = live.monetization.rewardTransactions.at(-1)!;
    expect(requested.status).toBe("REQUESTED");
    live = { ...live, gameTimeMin: live.gameTimeMin + 1 };
    finish();
    const result = await pending;
    expect(result.status).toBe("APPLIED");
    expect(result.state.gameTimeMin).toBe(1);
    expect(
      result.state.monetization.rewardTransactions.find(
        (entry) => entry.id === requested.id,
      ),
    ).toMatchObject({ status: "APPLIED", requestedAt: requested.requestedAt });
    expect(result.state.monetization.usage.sessionRewardCount).toBe(1);
    expect(applyRewardedResult(result.state, requested.id)).toBe(result.state);
  });

  it("does not grant a delayed reward after its request no longer exists", async () => {
    let live = unlockedState();
    let finish!: () => void;
    const gate = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const pending = runRewardedAction(
      live,
      "MARKET_SCOUT",
      "ad",
      {
        show: async () => {
          await gate;
          return { status: "USER_EARNED", providerTransactionId: "old-reward" };
        },
      },
      {
        read: () => live,
        publish: (next) => {
          live = next;
        },
      },
    );
    live = initialState(0, "SANDBOX");
    finish();
    const result = await pending;
    expect(result.status).toBe("INELIGIBLE");
    expect(result.state).toBe(live);
    expect(result.state.monetization.usage.sessionRewardCount).toBe(0);
  });

  it("fails closed on consent and accepts only locked localized metadata", async () => {
    const result = await refreshMonetization(initialState(), {
      consent: createSandboxConsentAdapter({
        canRequestAds: false,
        adPersonalizationAllowed: false,
      }),
      billing: createSandboxBillingAdapter({
        products: [
          product,
          { ...product, localizedPrice: "duplicate" },
          { ...product, localizedPrice: "", available: true },
        ],
      }),
      rewarded: createSandboxRewardedAdAdapter([]),
    });

    expect(result.products).toEqual([product]);
    expect(result.state.monetization.consent.canRequestAds).toBe(false);
  });

  it("grants ownership only from a matching verified provider event", async () => {
    const billing = createSandboxBillingAdapter({
      products: [product],
      purchases: {
        tradeup_premium_lifetime: {
          status: "VERIFIED",
          event: {
            transactionId: "purchase:1",
            productId: "tradeup_premium_lifetime",
            entitlementId: "premium_lifetime",
            platform: "android",
            status: "OWNED",
          },
        },
      },
    });
    const result = await purchaseStoreProduct(
      initialState(),
      "tradeup_premium_lifetime",
      billing,
    );

    expect(result.status).toBe("OWNED");
    expect(result.state.monetization.entitlements[0]).toMatchObject({
      entitlementId: "premium_lifetime",
      status: "OWNED",
      platform: "android",
    });
  });

  it("preserves pending and applies verified revoke during restore", async () => {
    const pending = await purchaseStoreProduct(
      initialState(),
      "tradeup_theme_workshop",
      createSandboxBillingAdapter({
        products: [],
        purchases: {
          tradeup_theme_workshop: {
            status: "PENDING",
            event: {
              transactionId: "pending:1",
              productId: "tradeup_theme_workshop",
              entitlementId: "theme_workshop",
              platform: "android",
              status: "PENDING",
            },
          },
        },
      }),
    );
    expect(pending.state.monetization.entitlements[0].status).toBe("PENDING");

    const restored = await restoreStoreProducts(
      pending.state,
      createSandboxBillingAdapter({
        products: [],
        restored: [
          {
            transactionId: "revoke:1",
            productId: "tradeup_theme_workshop",
            entitlementId: "theme_workshop",
            platform: "android",
            status: "REVOKED",
          },
        ],
      }),
    );
    expect(restored.state.monetization.entitlements[0].status).toBe("REVOKED");
  });

  it("applies reward only after earned callback and does not consume cap on failure", async () => {
    const failed = await runRewardedAction(
      unlockedState(),
      "MARKET_SCOUT",
      "ad",
      createSandboxRewardedAdAdapter([{ status: "FAILED", reason: "NO_FILL" }]),
    );
    expect(failed.status).toBe("FAILED");
    expect(failed.state.monetization.usage.sessionRewardCount).toBe(0);

    const earned = await runRewardedAction(
      unlockedState(),
      "MARKET_SCOUT",
      "ad",
      createSandboxRewardedAdAdapter([
        { status: "USER_EARNED", providerTransactionId: "reward:1" },
      ]),
    );
    expect(earned.status).toBe("APPLIED");
    expect(earned.state.monetization.usage.sessionRewardCount).toBe(1);
  });

  it("routes premium through the same cap and payload without showing an ad", async () => {
    const state = unlockedState();
    state.monetization.entitlements.push({
      productId: "tradeup_premium_lifetime",
      entitlementId: "premium_lifetime",
      status: "OWNED",
      platform: "android",
    });
    let shown = 0;
    const result = await runRewardedAction(state, "MARKET_SCOUT", "premium", {
      async show() {
        shown += 1;
        return { status: "CANCELLED" };
      },
    });

    expect(result.status).toBe("APPLIED");
    expect(shown).toBe(0);
    expect(result.state.monetization.usage.sessionRewardCount).toBe(1);
  });
});
