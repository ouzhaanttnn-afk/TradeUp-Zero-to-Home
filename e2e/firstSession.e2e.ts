import { expect, test } from "@playwright/test";
import { completeFirstLaunch } from "./helpers";
import type { GameState } from "../src/domain/models";
import { FTUE_STARTING_ASSET_ID, reconcileJournal } from "../src/domain/economy";

for (const width of [320, 390, 430]) {
  test(`first sale opens the free market and survives reload at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width === 320 ? 640 : 844 });
    const readSave = () =>
      page.evaluate(async () => {
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
          const request = indexedDB.open("tradeup", 1);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        try {
          return await new Promise<GameState>((resolve, reject) => {
            const request = db.transaction("game").objectStore("game").get("main");
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });
        } finally {
          db.close();
        }
      });

    await page.goto("/");
    await completeFirstLaunch(page);
    await expect(
      page.getByRole("button", { name: "Teklifi kabul et · ₺420" }),
    ).toBeVisible();
    await expect(
      page.getByRole("complementary", { name: "İlk oturum rehberi" }),
    ).toHaveCount(0);
    await page.getByRole("button", { name: "Teklifi kabul et · ₺420" }).click();
    await expect(page.getByRole("heading", { name: "Fırsat akışı" })).toBeVisible();
    await expect(page.locator(".market-grid .market-card").first()).toBeVisible();

    await expect.poll(async () => (await readSave()).ftue.stage).toBe("COMPLETE");
    const sold = await readSave();
    expect(reconcileJournal(sold)).toEqual({
      cash: true,
      activeBookCost: true,
      realizedProfit: true,
    });
    expect(sold.cashMinor).toBe(42_000);
    expect(sold.home.unlocked).toBe(true);
    expect(sold.listings.length).toBeGreaterThan(0);
    expect(
      sold.transactionJournal.filter(
        (entry) => entry.kind === "SALE" && entry.assetId === FTUE_STARTING_ASSET_ID,
      ),
    ).toHaveLength(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);

    await page.reload();
    await expect(page.getByRole("heading", { name: "Fırsat akışı" })).toBeVisible();
    const loaded = await readSave();
    expect(reconcileJournal(loaded)).toEqual({
      cash: true,
      activeBookCost: true,
      realizedProfit: true,
    });
    expect(loaded.transactionJournal).toEqual(sold.transactionJournal);
    expect(loaded.cashMinor).toBe(sold.cashMinor);
  });
}
