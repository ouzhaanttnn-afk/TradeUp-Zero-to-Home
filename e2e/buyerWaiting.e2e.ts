import { expect, test } from "@playwright/test";
import { initialState, validateState } from "../src/game";
import type { GameState } from "../src/domain/models";
import {
  createPlayerListing,
  purchaseListing,
  quoteAssetExit,
  reconcileJournal,
} from "../src/domain/economy";

for (const width of [320, 430]) {
  test(`waiting leads back to the market and a real buyer offer at ${width}px`, async ({
    page,
  }, testInfo) => {
    const now = new Date("2026-09-05T12:00:01Z");
    await page.setViewportSize({ width, height: 844 });
    await page.clock.install({ time: new Date("2026-09-05T12:00:00Z") });
    await page.clock.pauseAt(now);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const initial = initialState(now.getTime(), "SANDBOX");
    initial.accessibility = {
      ...initial.accessibility,
      largeText: width === 320,
      reducedMotion: true,
      haptics: false,
    };
    const purchase = purchaseListing(initial, initial.listings[0], 100, 0);
    if (!purchase.ok) throw new Error(purchase.reason);
    const asset = purchase.state.ownedAssets[0];
    const listing = createPlayerListing(
      purchase.state,
      asset.id,
      quoteAssetExit(asset).balancedAskingMinor,
      0,
    );
    if (!listing.ok) throw new Error(listing.reason);
    const saved = validateState(listing.state);
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
    const readSave = () =>
      page.evaluate(async () => {
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
          const request = indexedDB.open("tradeup", 1);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        try {
          return await new Promise<GameState>((resolve, reject) => {
            const request = db
              .transaction("game")
              .objectStore("game")
              .get("main");
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });
        } finally {
          db.close();
        }
      });
    await page.getByRole("button", { name: "Portföy", exact: true }).click();
    await page.getByRole("tab", { name: "İlanlarım", exact: true }).click();
    const waiting = page.getByRole("group", {
      name: "İlan durumu",
      exact: true,
    });
    await expect(waiting).toContainText("Az önce yayınlandı");
    await expect(page.locator(".nav-offer-count")).toHaveCount(0);
    const layout = async () => {
      expect(
        await page.evaluate(() => {
          const issues: string[] = [];
          if (document.documentElement.scrollWidth > innerWidth)
            issues.push("page overflow");
          for (const element of document.querySelectorAll<HTMLElement>(
            ".owned, .listing-wait, nav button, .sell-actions button",
          )) {
            const rect = element.getBoundingClientRect();
            if (!rect.width || !rect.height) continue;
            if (element.scrollWidth > element.clientWidth + 1)
              issues.push(`overflow: ${element.className}`);
            if (
              element.tagName === "BUTTON" &&
              (rect.width < 44 || rect.height < 44)
            )
              issues.push(`small target: ${element.textContent}`);
          }
          return issues;
        }),
      ).toEqual([]);
    };
    await layout();
    await page.screenshot({
      path: testInfo.outputPath("waiting.png"),
      fullPage: true,
      animations: "disabled",
    });
    await waiting.getByRole("button", { name: "Pazara göz at" }).click();
    await expect(
      page.getByRole("heading", { name: "Fırsat akışı" }),
    ).toBeVisible();
    expect((await readSave()).cashMinor).toBe(saved.cashMinor);
    expect((await readSave()).gameTimeMin).toBe(saved.gameTimeMin);
    // Advance the browser clock, not the engine state: exercise the real interval path.
    for (
      let minute = 0;
      minute < 60 && (await page.locator(".nav-offer-count").count()) === 0;
      minute++
    ) {
      await page.clock.runFor(60_000);
    }
    const portfolio = page.getByRole("button", {
      name: "Portföy",
      exact: true,
    });
    await expect(portfolio).toHaveAccessibleDescription(
      "1 alıcı teklifi bekliyor",
    );
    await expect(page.locator(".nav-offer-count")).toHaveText("1");
    await portfolio.click();
    await expect(
      page.getByRole("tab", { name: "İlanlarım", exact: true }),
    ).toHaveAttribute("aria-selected", "true");
    await expect(waiting).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Teklifi kabul et", exact: true }),
    ).toBeVisible();
    await layout();
    await page.screenshot({
      path: testInfo.outputPath("offer-arrived.png"),
      fullPage: true,
      animations: "disabled",
    });
    await expect
      .poll(async () => (await readSave()).buyerOffers.length)
      .toBe(1);
    const offered = await readSave();
    expect(offered.cashMinor).toBe(saved.cashMinor);
    expect(offered.transactionJournal).toEqual(saved.transactionJournal);
    await page
      .getByRole("button", { name: "Teklifi reddet", exact: true })
      .click();
    await expect(page.locator(".nav-offer-count")).toHaveCount(0);
    await expect(page.getByText("İlanın yayında kalıyor.")).toBeVisible();
    await expect(waiting).toBeVisible();
    const rejected = await readSave();
    expect(rejected.buyerOffers).toEqual([]);
    expect(rejected.playerListings[0].state).toBe("ACTIVE");
    expect(rejected.ownedAssets[0].state).toBe("LISTED");
    expect(rejected.cashMinor).toBe(offered.cashMinor);
    expect(rejected.transactionJournal).toEqual(offered.transactionJournal);
    expect(reconcileJournal(rejected)).toEqual({
      cash: true,
      activeBookCost: true,
      realizedProfit: true,
    });
    await page.reload();
    await page.getByRole("button", { name: "Portföy", exact: true }).click();
    await page.getByRole("tab", { name: "İlanlarım", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Teklifi reddet", exact: true }),
    ).toHaveCount(0);
    await expect(waiting).toBeVisible();
    expect((await readSave()).buyerOffers).toEqual([]);
    for (
      let minute = 0;
      minute < 60 && (await page.locator(".nav-offer-count").count()) === 0;
      minute++
    ) {
      await page.clock.runFor(60_000);
    }
    await expect(page.locator(".nav-offer-count")).toHaveText("1");
    await expect(waiting).toHaveCount(0);
    await page
      .getByRole("button", { name: "Teklifi kabul et", exact: true })
      .click();
    await expect(page.locator(".nav-offer-count")).toHaveCount(0);
    await expect
      .poll(async () => (await readSave()).ownedAssets[0].state)
      .toBe("SOLD_COMPLETE");
    expect(reconcileJournal(await readSave())).toEqual({
      cash: true,
      activeBookCost: true,
      realizedProfit: true,
    });
    expect(errors).toEqual([]);
  });
}
