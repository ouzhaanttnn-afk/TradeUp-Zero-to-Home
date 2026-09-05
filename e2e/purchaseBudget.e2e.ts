import { expect, test } from "@playwright/test";
import { initialState, money, validateState } from "../src/game";
import type { GameState } from "../src/domain/models";
import { reconcileJournal } from "../src/domain/economy";

for (const scenario of ["offer", "counter", "shortfall"] as const) {
  test(`purchase budget: ${scenario} uses the actual price and preserves accounting`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 320, height: 640 });
    const now = new Date("2026-09-05T12:00:00Z");
    await page.clock.install({ time: now });
    await page.clock.pauseAt(new Date(now.getTime() + 1_000));
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const initial = initialState(now.getTime() + 1_000, "SANDBOX");
    initial.accessibility = {
      ...initial.accessibility,
      largeText: true,
      reducedMotion: true,
      hapticsEnabled: false,
    };
    const listing = {
      ...initial.listings[0],
      priceMinor: 50_000,
      instance: { ...initial.listings[0].instance, fairValueMinor: 20_000 },
    };
    initial.listings[0] = listing;
    if (scenario !== "offer") {
      initial.negotiations[listing.id] = {
        listingId: listing.id,
        offersRemaining: 0,
        closed: true,
        sellerFloorMinor: 48_000,
        counterMinor: scenario === "counter" ? 42_000 : 43_000,
      };
    }
    const saved = validateState(initial);
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
          const tx = db.transaction("game", "readwrite");
          tx.objectStore("game").put(state, "main");
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      } finally {
        db.close();
      }
    }, saved);
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
    await page.reload();
    await page.locator(`[data-listing-id="${listing.id}"]`).click();
    const steps = page.getByRole("group", { name: "Satın alma adımları" });
    const offer = steps.getByRole("button", { name: /^Pazarlık et/ });
    const direct = steps.getByRole("button", { name: /^Hemen al/ });
    await expect(direct).toBeDisabled();
    await expect(direct).toContainText("₺80 nakit eksik");
    const action =
      scenario === "offer"
        ? offer
        : steps.getByRole("button", { name: /^Karşı teklifi kabul et/ });
    await expect(action).toBeInViewport({ ratio: 1 });
    await page.screenshot({
      path: testInfo.outputPath(`budget-${scenario}.png`),
      animations: "disabled",
    });
    if (scenario === "shortfall") {
      await expect(action).toBeDisabled();
      await expect(action).toContainText("₺10 nakit eksik");
      await expect(offer).toBeDisabled();
      const exit = steps.getByRole("button", {
        name: "Satabileceğin ürünleri gör",
      });
      await expect(exit).toBeInViewport({ ratio: 1 });
      await exit.click();
      await expect(
        page.getByRole("tab", { name: "Envanter", exact: true }),
      ).toHaveAttribute("aria-selected", "true");
      const after = await readSave();
      expect(after.cashMinor).toBe(saved.cashMinor);
      expect(after.transactionJournal).toEqual(saved.transactionJournal);
      expect(after.negotiations).toEqual(saved.negotiations);
      expect(reconcileJournal(after)).toEqual({
        cash: true,
        activeBookCost: true,
        realizedProfit: true,
      });
    } else {
      const paid = scenario === "offer" ? 41_000 : 42_000;
      await expect(action).toBeEnabled();
      await expect(action).toContainText(
        `Alırsan kalan: ${money(saved.cashMinor - paid)}`,
      );
      await action.click();
      await expect(
        page.getByRole("tab", { name: "Envanter", exact: true }),
      ).toHaveAttribute("aria-selected", "true");
      await expect
        .poll(async () => (await readSave()).ownedAssets.length)
        .toBe(1);
      const purchased = await readSave();
      expect(purchased.cashMinor).toBe(saved.cashMinor - paid);
      expect(purchased.ownedAssets[0].bookCostMinor).toBe(paid);
      expect(purchased.transactionJournal).toHaveLength(
        saved.transactionJournal.length + 1,
      );
      expect(
        purchased.analytics.events.filter(
          (event) => event.name === "offer_submitted",
        ),
      ).toHaveLength(scenario === "offer" ? 1 : 0);
      await page.reload();
      await expect(
        page.getByRole("heading", { name: "Fırsat akışı" }),
      ).toBeVisible();
      const loaded = await readSave();
      expect(loaded.cashMinor).toBe(purchased.cashMinor);
      expect(loaded.transactionJournal).toEqual(purchased.transactionJournal);
      expect(reconcileJournal(loaded)).toEqual({
        cash: true,
        activeBookCost: true,
        realizedProfit: true,
      });
    }
    expect(errors).toEqual([]);
  });
}
