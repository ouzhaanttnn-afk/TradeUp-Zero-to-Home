import { expect, test } from "@playwright/test";

test("first launch creates a named avatar profile before the market", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Pazara kendi tarzınla gir." }),
  ).toBeVisible();
  await expect(page.locator(".avatar-picker--onboarding button")).toHaveCount(
    3,
  );
  await expect(page.getByText("Hareketli avatarlar")).toBeVisible();
  await expect(page.getByText("oynanış avantajı yok")).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("profile-onboarding-320.png"),
    animations: "disabled",
  });

  expect(
    await page.locator(".onboarding-card").evaluate((element) => ({
      fits: element.scrollWidth <= element.clientWidth,
      freeChoices: element.querySelectorAll(
        ".avatar-picker--onboarding button:not(:disabled)",
      ).length,
    })),
  ).toEqual({ fits: true, freeChoices: 3 });

  await page.getByLabel("Oyuncu adı").fill("  Gece   Avcısı  ");
  await page.getByRole("button", { name: /Koleksiyon Uzmanı/ }).click();
  await page.getByRole("button", { name: /Kariyere başla/ }).click();
  await expect(page.getByRole("button", { name: "Ayarlar" })).toBeVisible();

  await page.reload();
  await page.getByRole("button", { name: "Ayarlar" }).click();
  await expect(page.getByLabel("Oyuncu adı")).toHaveValue("Gece Avcısı");
  await expect(
    page.getByRole("button", { name: /Koleksiyon Uzmanı/ }),
  ).toHaveAttribute("aria-pressed", "true");
});
