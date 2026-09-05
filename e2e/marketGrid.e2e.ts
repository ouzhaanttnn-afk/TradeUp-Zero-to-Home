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

    await page.screenshot({
      path: testInfo.outputPath(`market-grid-${width}.png`),
      animations: "disabled",
    });
  });
}
