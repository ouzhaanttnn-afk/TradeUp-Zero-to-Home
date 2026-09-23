import { test } from "@playwright/test";

test("capture iPad Air review screenshots", async ({ page }) => {
  // iPad Air 11-inch viewport (820 x 1180)
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.goto("/");
  
  // Fill onboarding
  const nameInput = page.getByLabel(/Oyuncu adı/i);
  if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await nameInput.fill("Alper");
    const startBtn = page.getByRole("button", { name: /Kariyere başla/i });
    if (await startBtn.isVisible()) {
      await startBtn.click();
    }
  }

  // Wait for main UI
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "test-results/ipad_game_screen.png" });

  // Open settings
  const settingsBtn = page.getByRole("button", { name: /Ayarlar|Settings/i });
  if (await settingsBtn.isVisible()) {
    await settingsBtn.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: "test-results/ipad_settings_screen.png" });

    // Open purchases
    const purchasesBtn = page.getByRole("button", { name: /Satın almalar|Purchases/i });
    if (await purchasesBtn.isVisible()) {
      await purchasesBtn.click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: "test-results/ipad_purchases_sheet.png" });
    }
  }
});
