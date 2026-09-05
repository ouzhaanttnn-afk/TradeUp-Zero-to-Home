import { expect, test, type Page } from "@playwright/test";

test.describe("missing product images", () => {
  test.use({ serviceWorkers: "block" });
  test("uses an offline-safe category fallback without blocking trade", async ({
    page,
  }) => {
    await page.route("**/assets/prd_*.png", (route) => route.abort());
    await page.goto("/");
    const startingImage = page.getByRole("img", { name: "Eski defter" });
    await expect(startingImage).toHaveAttribute("src", /^data:image\/svg\+xml/);
    await page.getByRole("button", { name: "Teklifi kabul et · ₺420" }).click();
    await page
      .getByRole("button", {
        name: /Kuzey Defteri, fiyat ₺120, kondisyon yüzde 55,.+İlan detaylarını aç/,
      })
      .click();
    const product = page.locator(".sheet img");
    await expect(product).toHaveAttribute("src", /^data:image\/svg\+xml/);
    await expect
      .poll(() =>
        product.evaluate(
          (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
        ),
      )
      .toBe(true);
    await page
      .getByRole("button", {
        name: "Benzer ilanlarla karşılaştır",
        exact: true,
      })
      .click();
    await expect(page.locator(".compare-card")).toHaveCount(2);
    await expect(
      page.getByRole("region", { name: "Finans özeti" }),
    ).toContainText("₺420");
  });
});

async function checkLayout(page: Page) {
  const issues = await page.evaluate(() => {
    const issues: string[] = [];
    if (document.documentElement.scrollWidth > innerWidth)
      issues.push("page overflow");
    for (const element of document.querySelectorAll<HTMLElement>(
      ".sheet, .compare-card, .settings-card, button",
    )) {
      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height) continue;
      if (element.scrollWidth > element.clientWidth + 1)
        issues.push(
          `overflow: ${element.className} ${element.textContent?.slice(0, 50)}`,
        );
      if (element.tagName === "BUTTON" && (rect.width < 44 || rect.height < 44))
        issues.push(`small target: ${element.textContent}`);
    }
    return issues;
  });
  expect(issues).toEqual([]);
}

async function checkMarketGrid(page: Page) {
  const cards = page.locator(".market-grid .market-card");
  await expect(cards).toHaveCount(3);
  const largeText = await page
    .locator(".app-shell")
    .evaluate((shell) => shell.classList.contains("large-text"));
  const geometry = await cards.evaluateAll((items) =>
    items.slice(0, 3).map((item) => {
      const rect = item.getBoundingClientRect();
      return {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      };
    }),
  );
  expect(Math.abs(geometry[0].top - geometry[1].top)).toBeLessThan(2);
  expect(geometry[1].left).toBeGreaterThan(geometry[0].left);
  if (largeText) {
    expect(geometry[2].top).toBeGreaterThan(geometry[0].top);
    expect(
      geometry.every((card) => card.width >= 135 && card.height <= 310),
    ).toBe(true);
  } else {
    expect(Math.abs(geometry[0].top - geometry[2].top)).toBeLessThan(2);
    expect(geometry[2].left).toBeGreaterThan(geometry[1].left);
    expect(
      geometry.every((card) => card.width >= 90 && card.height <= 180),
    ).toBe(true);
  }
  await expect(cards.first()).toContainText(/₺/);
  await expect(cards.first()).toHaveAttribute("aria-label", /kondisyon/);
}

for (const width of [320, 390, 430]) {
  test(`comparison and accessibility settings at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 844 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/");
    await page.getByRole("button", { name: "Teklifi kabul et · ₺420" }).click();
    await checkMarketGrid(page);
    await checkLayout(page);
    await page.getByRole("button", { name: "Yolculuk", exact: true }).click();
    await page.screenshot({
      path: testInfo.outputPath(`journey-${width}.png`),
      fullPage: true,
      animations: "disabled",
    });
    await page.getByRole("button", { name: "Ayarlar", exact: true }).click();
    await page
      .getByRole("button", { name: "Standart · büyüt", exact: true })
      .click();
    const motion = page
      .locator(".settings-card > div")
      .filter({ hasText: "Azaltılmış hareket" })
      .getByRole("button");
    if ((await motion.getAttribute("aria-pressed")) !== "true")
      await motion.click();
    const haptics = page
      .locator(".settings-card > div")
      .filter({ hasText: "Dokunsal geri bildirim" })
      .getByRole("button");
    if ((await haptics.getAttribute("aria-pressed")) !== "false")
      await haptics.click();
    await expect(page.locator(".app-shell")).toHaveClass(/large-text/);
    await expect(page.locator(".app-shell")).toHaveClass(/reduced-motion/);
    await checkLayout(page);
    await page.reload();
    await expect(page.locator(".app-shell")).toHaveClass(/large-text/);
    await expect(page.locator(".app-shell")).toHaveClass(/reduced-motion/);
    await page.getByRole("button", { name: "Yolculuk", exact: true }).click();
    await page.getByRole("button", { name: "Ayarlar", exact: true }).click();
    await expect(
      page
        .locator(".settings-card > div")
        .filter({ hasText: "Dokunsal geri bildirim" })
        .getByRole("button"),
    ).toHaveAttribute("aria-pressed", "false");
    await page.getByRole("button", { name: "Pazar", exact: true }).click();
    await checkMarketGrid(page);
    await page.screenshot({
      path: testInfo.outputPath(`market-grid-${width}.png`),
      fullPage: true,
      animations: "disabled",
    });
    await page
      .getByRole("button", {
        name: /Kuzey Defteri, fiyat ₺120, kondisyon yüzde 55,.+İlan detaylarını aç/,
      })
      .click();
    await expect(page.locator(".sheet-category")).toHaveText("Küçük Eşya");
    await expect(page.locator(".hero-art img")).toHaveCSS(
      "object-fit",
      "contain",
    );
    await expect(page.locator(".hero-art img")).toHaveAttribute(
      "loading",
      "eager",
    );
    await expect(page.locator(".hero-art img")).toHaveCSS("height", "170px");
    await expect(page.locator(".sheet-decision-heading")).toContainText(
      "KARARIN",
    );
    await expect(page.locator(".sheet-decision-heading")).toContainText(
      "Nakit ₺420",
    );
    await page
      .getByRole("button", {
        name: "Benzer ilanlarla karşılaştır",
        exact: true,
      })
      .click();
    await expect(page.locator(".compare-card")).toHaveCount(2);
    await checkLayout(page);
    await page.getByRole("button", { name: "İlan 2 detaylarını aç" }).click();
    await expect(page.locator(".sheet")).toContainText("₺140");
    await expect(page.locator(".compare-card")).toHaveCount(0);
    await checkLayout(page);
    await page.screenshot({
      path: testInfo.outputPath(`comparison-${width}.png`),
    });
    expect(errors).toEqual([]);
  });
}
