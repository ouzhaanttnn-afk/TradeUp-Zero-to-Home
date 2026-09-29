import { expect, type Page } from "@playwright/test";

export async function enableOptionalAnalytics(page: Page, frozenClock = false) {
  // Exercise explicit consent through the real UI; an old save preference
  // alone must not enable telemetry after the Firebase migration.
  await page.getByRole("button", { name: "Ayarlar", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Profil ve Ayarlar" });
  if (frozenClock) {
    await expect.poll(async () => {
      await page.clock.runFor(200);
      return dialog.count();
    }).toBe(1);
  }
  const toggle = dialog.getByRole("button", { name: /analitik: Kapalı/i });
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await toggle.click();
  await expect(dialog.getByRole("button", { name: /analitik: Açık/i })).toHaveAttribute("aria-pressed", "true");
  await dialog.getByRole("button", { name: "Ayarları kapat" }).click();
}

export async function advanceFrozenStartup(page: Page) {
  await page.locator(".startup-shell").waitFor({ state: "visible" });
  await page.clock.runFor(2_500);
  await page.locator(".app-shell").waitFor({ state: "visible" });
}

export async function completeFirstLaunch(page: Page, frozenClock = false) {
  if (frozenClock) {
    await page.locator(".startup-shell").waitFor({ state: "visible" });
    await page.clock.runFor(2_500);
  }
  const name = page.getByLabel("Oyuncu adı");
  const onboardingVisible = await name
    .waitFor({ state: "visible", timeout: 5_000 })
    .then(() => true)
    .catch(() => false);
  if (onboardingVisible) {
    await name.fill("Yeni Tüccar");
    await page.getByRole("button", { name: /Pazar Kaşifi/ }).click();
    await page.getByRole("button", { name: /Kariyere başla/ }).click();
  }
  await page.locator(".app-shell").waitFor({ state: "visible" });
}
