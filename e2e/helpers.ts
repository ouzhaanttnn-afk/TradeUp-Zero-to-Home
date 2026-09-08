import type { Page } from "@playwright/test";

export async function completeFirstLaunch(page: Page) {
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
