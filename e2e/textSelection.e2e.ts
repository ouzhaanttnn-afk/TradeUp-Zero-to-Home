import { expect, test } from "@playwright/test";
import { completeFirstLaunch } from "./helpers";

test("game text cannot be selected but profile input remains editable", async ({ page }) => {
  await page.goto("/");
  await completeFirstLaunch(page);
  await page.getByRole("button", { name: "Teklifi kabul et · ₺420" }).click();

  const card = page.locator(".market-grid .market-card").first();
  await expect(card.locator("h3")).toHaveCSS("user-select", "none");
  await card.click();
  const title = page.locator(".sheet h2").first();
  await expect(title).toBeVisible();
  await expect(title).toHaveCSS("user-select", "none");
  // The iOS-only callout declaration is kept in the delivered stylesheet.
  expect(await page.locator("#root").evaluate((root) =>
    getComputedStyle(root).getPropertyValue("-webkit-user-select"),
  )).toBe("none");

  const box = await title.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width - 2, box!.y + box!.height / 2, { steps: 12 });
  await page.mouse.up();
  expect(await page.evaluate(() => window.getSelection()?.toString())).toBe("");
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "Ayarlar", exact: true }).click();
  const name = page.getByLabel("Oyuncu adı");
  await expect(name).toHaveCSS("user-select", "text");
  await name.fill("Seçilebilir İsim");
  await name.press("ControlOrMeta+A");
  expect(await name.evaluate((input: HTMLInputElement) =>
    input.value.slice(input.selectionStart ?? 0, input.selectionEnd ?? 0),
  )).toBe("Seçilebilir İsim");
  await page.getByRole("button", { name: "Kaydet", exact: true }).click();
  await expect(name).toHaveValue("Seçilebilir İsim");
  await page.getByRole("button", { name: "Ayarları kapat", exact: true }).click();
  await expect(card).toBeVisible();
});
