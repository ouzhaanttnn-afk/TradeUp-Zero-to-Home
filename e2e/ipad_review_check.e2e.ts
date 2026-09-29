import { expect, test } from "@playwright/test";
import { completeFirstLaunch } from "./helpers";

// This verifies responsive web layout, not native iPad compatibility or store media.
test("tablet browser can reach both main packs and every standalone cosmetic", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.goto("/");
  await completeFirstLaunch(page);
  await expect(page.getByRole("heading", { name: "Fırsat akışı" })).toBeVisible();
  await page.getByRole("button", { name: "Ayarlar", exact: true }).click();
  await page.getByRole("button", { name: /Satın almalar & görünüm/i }).click();
  const store = page.getByRole("dialog", { name: "Satın Almalar & Görünüm" });
  await expect(store.locator(".purchase-list article:visible")).toHaveCount(2);
  await store.locator(".extra-purchases summary").click();
  await expect(store.locator(".purchase-list article:visible")).toHaveCount(6);
  expect(await store.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("tablet-browser-store.png"), animations: "disabled" });
  await store.getByRole("button", { name: "Kapat", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Profil ve Ayarlar" })).toBeVisible();
});
