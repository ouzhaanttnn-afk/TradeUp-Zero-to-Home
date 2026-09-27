import { expect, test } from "@playwright/test";
import { completeFirstLaunch } from "./helpers";

test("the founder badge belongs to Premium, not the No Ads purchase", async ({
  page,
}) => {
  await page.goto("/");
  await completeFirstLaunch(page);

  const setOwnedPack = async (productId: string, entitlementId: string) => {
    await page.evaluate(
      async ({ productId, entitlementId }) => {
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
          const request = indexedDB.open("tradeup", 1);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        const state = await new Promise<Record<string, unknown>>(
          (resolve, reject) => {
            const request = db
              .transaction("game")
              .objectStore("game")
              .get("main");
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          },
        );
        const monetization = state.monetization as Record<string, unknown>;
        await new Promise<void>((resolve, reject) => {
          const transaction = db.transaction("game", "readwrite");
          transaction.objectStore("game").put(
            {
              ...state,
              monetization: {
                ...monetization,
                entitlements: [
                  {
                    productId,
                    entitlementId,
                    status: "OWNED",
                    platform: "ios",
                  },
                ],
              },
            },
            "main",
          );
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error);
        });
        db.close();
      },
      { productId, entitlementId },
    );
    await page.reload();
    await expect(page.locator(".app-shell")).toBeVisible();
  };

  await setOwnedPack("tradeup_no_ads_lifetime", "no_ads_lifetime");
  await expect(
    page.locator(".entitlement-state").filter({ hasText: "KURUCU" }),
  ).toHaveCount(0);

  await setOwnedPack("tradeup_premium_lifetime", "premium_lifetime");
  await expect(
    page.locator(".entitlement-state").filter({ hasText: "KURUCU" }),
  ).toBeVisible();
});
