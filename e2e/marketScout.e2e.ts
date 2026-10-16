import { expect, test } from "@playwright/test";
import { completeFirstLaunch } from "./helpers";

for (const width of [320, 390, 430]) {
  test(`one compact refresh switches to refill only at zero at ${width}px`, async ({ page }) => {
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
            marketScanCredits: 0,
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
    const refill = page.locator(".market-refresh");
    await expect(refill).toBeVisible();
    await expect(refill).toHaveAccessibleName("+25 yenileme");
    await expect(refill).toHaveClass(/market-refresh--reward/);
    await expect(page.locator(".market-scout-refill")).toHaveCount(0);
    const counter = page.locator(".market-refresh-copy small");
    await expect(counter).toContainText("0/50");
    await refill.click();
    await expect(counter).toContainText("25/50");
    await expect(refill).toHaveAccessibleName("Pazarı yenile · 25 hak kaldı");
    await expect(refill).not.toHaveClass(/market-refresh--reward/);
    await refill.click();
    await expect(counter).toContainText("24/50");
    for (let credit = 24; credit > 0; credit -= 1) await refill.click();
    await expect(counter).toContainText("0/50");
    await expect(refill).toHaveAccessibleName("+25 yenileme");
    await expect(refill).toBeEnabled();
    await refill.click();
    await expect(counter).toContainText("25/50");
    await expect(refill).not.toHaveClass(/market-refresh--reward/);
    expect((await refill.boundingBox())?.height).toBeGreaterThanOrEqual(44);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test("zero-credit video entry stays in the refresh button on web with an explicit native-only reason", async ({ page }) => {
  await page.goto("/");
  await completeFirstLaunch(page);
  await page.getByRole("button", { name: "Teklifi kabul et · ₺420" }).click();
  const refresh = page.locator(".market-refresh");
  for (let credit = 50; credit > 0; credit -= 1) await refresh.click();
  await expect(refresh).toHaveAccessibleName("Reklam izle +25");
  await expect(refresh).toContainText("Reklam izle");
  await expect(refresh).toContainText("+25");
  await expect(refresh).toBeDisabled();
  await expect(refresh).toHaveAttribute("title", "Video reklamlar mobil uygulamada kullanılabilir.");
  await expect(page.locator(".market-scout-refill")).toHaveCount(0);
  await page.getByRole("button", { name: "Ayarlar", exact: true }).click();
  const settings = page.getByRole("dialog", { name: "Profil ve Ayarlar" });
  await settings.getByRole("button", { name: "Standart", exact: true }).click();
  await settings.getByRole("button", { name: "Ayarları kapat", exact: true }).click();
  for (const width of [320, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await page.screenshot({ path: `release-artifacts/compact-scout-large-${width}.png` });
    expect(await refresh.evaluate((button) => {
      const bounds = button.getBoundingClientRect();
      const copy = button.querySelector(".market-refresh-copy")!.getBoundingClientRect();
      return copy.right <= bounds.right && copy.bottom <= bounds.bottom;
    })).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
