import { expect, test } from "@playwright/test";

test("profile and settings stay accessible from the mobile game header", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/");
  await page.screenshot({
    path: testInfo.outputPath("game-header-320.png"),
    animations: "disabled",
  });

  await page.getByRole("button", { name: "Ayarlar", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Profil ve Ayarlar" });
  await expect(dialog).toBeVisible();
  await expect(page.getByLabel("Oyuncu adı")).toHaveValue("Yeni Tüccar");

  await page.getByLabel("Oyuncu adı").fill("  Pazar   Ustası  ");
  await dialog.getByRole("button", { name: "Kaydet", exact: true }).click();
  await expect(page.getByLabel("Oyuncu adı")).toHaveValue("Pazar Ustası");
  await expect(
    dialog.getByRole("group", { name: "Profil özeti" }),
  ).toContainText("Pazar seviyesi");
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
  await expect(
    page.getByRole("heading", { name: "Fırsat akışı" }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Ayarlar", exact: true }).click();
  await expect(page.getByLabel("Oyuncu adı")).toHaveValue("Pazar Ustası");
});
