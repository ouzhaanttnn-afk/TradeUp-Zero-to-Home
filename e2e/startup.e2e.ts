import { expect, test } from "@playwright/test";

test("opening artwork stays visible before the first interactive screen", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const startup = page.locator(".startup-shell");
  await expect(startup).toBeVisible();
  await page.waitForTimeout(1_200);
  await expect(startup).toBeVisible();
  await expect(startup).toBeHidden({ timeout: 5_000 });
  await expect(page.getByLabel("Oyuncu adı")).toBeVisible();
});
