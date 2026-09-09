import { expect, test } from "@playwright/test";
import { completeFirstLaunch } from "./helpers";
import { initialState, validateState } from "../src/game";

for (const width of [320, 430]) {
  test(`nine market visuals fit in a 3 by 3 viewport at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 844 });
    const saved = validateState(initialState(Date.now(), "SANDBOX"));
    saved.accessibility.reducedMotion = true;
    saved.monetization.marketScanCredits = 21;
    saved.monetization.marketScanRefillAnchorWallMs = Date.now();

    await page.goto("/");
    await completeFirstLaunch(page);
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
    await expect(cards.first().locator(".market-evidence-signal")).toHaveCount(
      0,
    );
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
    await expect(cards.first()).toHaveAttribute("aria-label", /bilgi güveni/);
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
    const refresh = page.getByRole("button", { name: /Pazarı yenile/ });
    await expect(refresh.locator("small")).toContainText("21/25 · +1");
    await expect(page.getByText("Yenileme 21/25", { exact: true })).toHaveCount(
      0,
    );
    const noticeHeightBefore = await page
      .locator(".notice")
      .evaluate((notice) => notice.getBoundingClientRect().height);
    await refresh.click();
    await expect(page.locator(".notice")).toContainText(
      "yeni ilan pazara eklendi",
    );
    const noticeHeightAfter = await page
      .locator(".notice")
      .evaluate((notice) => notice.getBoundingClientRect().height);
    expect(noticeHeightAfter).toBe(noticeHeightBefore);
    const firstVisual = await cards
      .first()
      .locator(".product-art")
      .boundingBox();
    const firstSignals = await cards
      .first()
      .locator(".market-condition-signal")
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
