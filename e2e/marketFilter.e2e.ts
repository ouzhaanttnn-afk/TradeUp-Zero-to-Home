import { expect, test } from "@playwright/test";
import { initialState, validateState } from "../src/game";

test("category filter narrows the market without adding vertical controls", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 320, height: 844 });
  const saved = validateState(initialState(Date.now(), "SANDBOX"));
  saved.accessibility.largeText = true;
  saved.accessibility.reducedMotion = true;
  const category = saved.listings[0].instance.family.category;
  const categoryCount = saved.listings.filter(
    (listing) => listing.instance.family.category === category,
  ).length;

  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Fırsat akışı" }),
  ).toBeVisible();
  await page.evaluate(async (state) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("tradeup", 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction("game", "readwrite");
        transaction.objectStore("game").put(state, "main");
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } finally {
      db.close();
    }
  }, saved);
  await page.reload();

  const refresh = page.getByRole("button", { name: "Pazarı yenile" });
  await expect(refresh).toBeVisible();
  await expect(page.locator("header").getByRole("button")).toHaveCount(0);
  await expect(page.locator(".market-title-actions")).toContainText("ilan");
  expect(
    await refresh.evaluate((button) => {
      const rect = button.getBoundingClientRect();
      return rect.width === 44 && rect.height === 44;
    }),
  ).toBe(true);
  const sort = page.getByLabel("Pazar sıralaması");
  await expect(sort).toHaveValue("MARKET");
  const cards = page.locator(".market-grid .market-card");
  const originalOrder = await cards.evaluateAll((items) =>
    items.map((item) => item.getAttribute("data-listing-id")),
  );
  const prices = () =>
    cards.evaluateAll((items) =>
      items.map((item) => Number(item.getAttribute("data-price-minor"))),
    );
  await sort.selectOption("PRICE_ASC");
  expect(await prices()).toEqual(
    [...saved.listings]
      .map((listing) => listing.priceMinor)
      .sort((left, right) => left - right),
  );
  await page.screenshot({
    path: testInfo.outputPath("compact-market-sort-320.png"),
    animations: "disabled",
  });
  await sort.selectOption("PRICE_DESC");
  expect(await prices()).toEqual(
    [...saved.listings]
      .map((listing) => listing.priceMinor)
      .sort((left, right) => right - left),
  );
  await sort.selectOption("MARKET");
  expect(
    await cards.evaluateAll((items) =>
      items.map((item) => item.getAttribute("data-listing-id")),
    ),
  ).toEqual(originalOrder);
  const filters = page.getByRole("group", { name: "Pazar kategorileri" });
  await expect(filters).toBeVisible();
  await expect(filters.getByRole("button", { name: "Tümü" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.evaluate(() => window.scrollTo(0, 900));
  await expect
    .poll(() =>
      filters.evaluate((element) =>
        Math.round(element.getBoundingClientRect().top),
      ),
    )
    .toBe(0);
  await expect(
    filters.getByRole("button", { name: category, exact: true }),
  ).toBeVisible();
  await filters.getByRole("button", { name: category, exact: true }).click();

  await expect(cards).toHaveCount(categoryCount);
  await expect(
    filters.getByRole("button", { name: category, exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".market-listing-count")).toHaveText(
    `${categoryCount} ilan`,
  );
  expect(
    await cards
      .locator(".market-category")
      .evaluateAll(
        (items, expectedCategory) =>
          items.every((item) => item.textContent?.startsWith(expectedCategory)),
        category,
      ),
  ).toBe(true);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);

  await page.screenshot({
    path: testInfo.outputPath("sticky-market-category-filter-320.png"),
    animations: "disabled",
  });

  await filters.getByRole("button", { name: "Tümü" }).click();
  await expect(cards).toHaveCount(saved.listings.length);
});
