import { expect, test } from "@playwright/test";
import { completeFirstLaunch } from "./helpers";

for (const width of [320, 390, 430]) {
  test(`scout refill is separate from refresh and capped at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    await completeFirstLaunch(page);
    await page.getByRole("button", { name: "Teklifi kabul et · ₺420" }).click();
    await expect(page.locator(".market-grid")).toBeVisible();
    await page.evaluate(async () => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open("tradeup", 1);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const state = await new Promise<Record<string, unknown>>((resolve, reject) => {
        const request = db.transaction("game").objectStore("game").get("main");
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction("game", "readwrite");
        tx.objectStore("game").put({
          ...state,
          monetization: {
            ...(state.monetization as Record<string, unknown>),
            marketScanCredits: 10,
            marketScanRefillAnchorWallMs: Date.now(),
            entitlements: [{ productId: "tradeup_no_ads_lifetime", entitlementId: "no_ads_lifetime", status: "OWNED", platform: "ios" }],
          },
        }, "main");
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      db.close();
    });
    await page.reload();
    const refill = page.getByRole("button", { name: "+25 yenileme", exact: true });
    await expect(refill).toBeVisible();
    const counter = page.locator(".market-refresh-copy small");
    await expect(counter).toContainText("10/50");
    await refill.click();
    await expect(counter).toContainText("35/50");
    await refill.click();
    await expect(counter).toContainText("50/50");
    await expect(refill).toHaveCount(0);
    await expect(page.locator(".market-refresh")).toBeEnabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
