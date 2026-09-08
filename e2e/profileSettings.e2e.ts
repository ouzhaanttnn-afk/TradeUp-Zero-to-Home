import { expect, test } from "@playwright/test";

test("profile and settings stay accessible from the mobile game header", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/");
  await page.getByLabel("Oyuncu adı").fill("Yeni Tüccar");
  await page.getByRole("button", { name: /Pazar Kaşifi/ }).click();
  await page.getByRole("button", { name: "Kariyere başla" }).click();
  await page.screenshot({
    path: testInfo.outputPath("game-header-320.png"),
    animations: "disabled",
  });

  const settingsButton = page.getByRole("button", {
    name: "Ayarlar",
    exact: true,
  });
  await settingsButton.click();
  const dialog = page.getByRole("dialog", { name: "Profil ve Ayarlar" });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Ayarları kapat" }),
  ).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe(
    "hidden",
  );
  await page.keyboard.press("Shift+Tab");
  expect(
    await page.evaluate(() =>
      Boolean(document.activeElement?.closest(".settings-card")),
    ),
  ).toBe(true);
  await expect(page.getByLabel("Oyuncu adı")).toHaveValue("Yeni Tüccar");

  await page.getByLabel("Oyuncu adı").fill("  Pazar   Ustası  ");
  await dialog.getByRole("button", { name: "Kaydet", exact: true }).click();
  await expect(page.getByLabel("Oyuncu adı")).toHaveValue("Pazar Ustası");
  await expect(
    dialog.getByRole("group", { name: "Profil özeti" }),
  ).toContainText("Pazar seviyesi");
  await dialog
    .getByRole("button", { name: "Satın Almalar ve Görünüm" })
    .click();
  await expect(dialog.locator(".purchase-list article")).toHaveCount(5);
  await expect(dialog).toContainText("Yakında");
  await expect(dialog).not.toContainText("Fiyat yüklenemedi");
  expect(
    await dialog
      .locator(".purchase-list article")
      .evaluateAll((cards) =>
        cards.every((card) => card.getBoundingClientRect().height <= 76),
      ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("profile-settings-320.png"),
    animations: "disabled",
  });

  expect(
    await dialog.evaluate((element) => ({
      fits: element.scrollWidth <= element.clientWidth,
      smallTargets: [...element.querySelectorAll("button")].filter((button) => {
        const rect = button.getBoundingClientRect();
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          (rect.width < 44 || rect.height < 44)
        );
      }).length,
    })),
  ).toEqual({ fits: true, smallTargets: 0 });

  await dialog.getByRole("button", { name: "Ayarları kapat" }).click();
  await expect(settingsButton).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
  await expect(
    page.getByRole("heading", { name: "Fırsat akışı" }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Ayarlar", exact: true }).click();
  await expect(page.getByLabel("Oyuncu adı")).toHaveValue("Pazar Ustası");
});
