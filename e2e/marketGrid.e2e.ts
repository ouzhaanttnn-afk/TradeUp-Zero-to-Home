import { expect, test } from "@playwright/test";
import { initialState, validateState } from "../src/game";

for (const width of [320, 430]) {
  test(`nine market visuals fit in a 3 by 3 viewport at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 844 });
    const saved = validateState(initialState(Date.now(), "SANDBOX"));
    saved.accessibility.reducedMotion = true;

    await page.goto("/");
    await page.evaluate(async (state) => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open("tradeup", 1);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction("game", "readwrite");
        transaction.objectStore("game").put(state, "main");
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
      db.close();
    }, saved);
    await page.reload();

    const cards = page.locator(".market-grid .market-card");
    await expect(cards).toHaveCount(saved.listings.length);
    await expect(
      cards.first().locator(".market-condition-signal"),
    ).toBeVisible();
    await expect(
      cards.first().locator(".market-evidence-signal"),
    ).toBeVisible();
    await expect(cards.first().locator(".market-condition-signal")).toHaveText(
      `%${saved.listings[0].instance.condition}`,
    );
    await expect(cards.first().locator("img")).toHaveAttribute(
      "loading",
      "eager",
    );
    await expect(cards.nth(6).locator("img")).toHaveAttribute(
      "loading",
      "lazy",
    );
    await expect(
      cards.first().locator(".market-evidence-signal"),
    ).toContainText("Bilgi");
    await expect(
      cards.first().locator(".market-evidence-signal"),
    ).toContainText("Yeni");
    const boxes = await cards.evaluateAll((items) =>
      items.slice(0, 9).map((item) => {
        const box = item.getBoundingClientRect();
        return {
          left: Math.round(box.left),
          top: Math.round(box.top),
          bottom: box.bottom,
        };
      }),
    );
    expect(new Set(boxes.map((box) => box.left)).size).toBe(3);
    expect(new Set(boxes.map((box) => box.top)).size).toBe(3);
    const navTop = await page
      .locator("nav")
      .evaluate((nav) => nav.getBoundingClientRect().top);
    expect(Math.max(...boxes.map((box) => box.bottom))).toBeLessThanOrEqual(
      navTop,
    );
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width);
    const firstVisual = await cards
      .first()
      .locator(".product-art")
      .boundingBox();
    const firstSignals = await cards
      .first()
      .locator(".market-condition-signal, .market-evidence-signal")
      .evaluateAll((items) =>
        items.map((item) => item.getBoundingClientRect()),
      );
    expect(firstVisual).not.toBeNull();
    for (const signalBox of firstSignals) {
      expect(signalBox.left).toBeGreaterThanOrEqual(firstVisual!.x);
      expect(signalBox.right).toBeLessThanOrEqual(
        firstVisual!.x + firstVisual!.width,
      );
      expect(signalBox.top).toBeGreaterThanOrEqual(firstVisual!.y);
      expect(signalBox.bottom).toBeLessThanOrEqual(
        firstVisual!.y + firstVisual!.height,
      );
    }

    await page.screenshot({
      path: testInfo.outputPath(`market-grid-${width}.png`),
      animations: "disabled",
    });
  });
}
