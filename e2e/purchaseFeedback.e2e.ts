import { expect, test } from "@playwright/test";
import {
  initialState,
  money,
  resolveOffer,
  signal,
  validateState,
} from "../src/game";
import { reconcileJournal } from "../src/domain/economy";
import type { GameState } from "../src/domain/models";

test("seller feedback stays in the sheet and two rejected offers remain closed after reload", async ({
  page,
}, testInfo) => {
  const now = new Date("2026-09-05T12:00:00Z");
  await page.clock.install({ time: now });
  await page.clock.pauseAt(new Date(now.getTime() + 1_000));
  await page.setViewportSize({ width: 320, height: 640 });
  const initial = initialState(now.getTime() + 1_000, "SANDBOX");
  initial.accessibility = {
    ...initial.accessibility,
    largeText: true,
    reducedMotion: true,
    hapticsEnabled: false,
  };
  // Deliberately exercise rejection; the normal starting notebook accepts early.
  const listing = {
    ...initial.listings[0],
    priceMinor: 20_000,
    seller: "expert" as const,
    instance: { ...initial.listings[0].instance, fairValueMinor: 50_000 },
  };
  initial.listings[0] = listing;
  for (const index of [1, 2])
    expect(
      resolveOffer(
        listing,
        Math.round((listing.priceMinor * (index === 1 ? 0.82 : 0.91)) / 1_000) *
          1_000,
        index,
      ).result,
    ).toBe("rejected");
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
  const openListing = async () =>
    page
      .getByRole("button", {
        name: `${listing.instance.family.name}, fiyat ${money(listing.priceMinor)}, kondisyon yüzde ${listing.instance.condition}, ${signal(listing, 0).text}. İlan detaylarını aç`,
        exact: true,
      })
      .click();
  await page.reload();
  await openListing();
  const steps = page.getByRole("group", { name: "Satın alma adımları" });
  const negotiate = steps.getByRole("button", { name: /^Pazarlık et/ });
  await negotiate.click();
  await expect(steps.getByRole("status")).toHaveText(
    "Teklif reddedildi. Son hakkın kaldı.",
  );
  await expect(steps).toContainText("Bu teklif reddedilirse görüşme kapanır.");
  await expect(negotiate).toBeInViewport({ ratio: 1 });
  await page.screenshot({
    path: testInfo.outputPath("last-offer.png"),
    animations: "disabled",
  });
  await negotiate.click();
  await expect(steps.getByRole("status")).toHaveText("Son teklif reddedildi.");
  await expect(negotiate).toBeDisabled();
  await expect(negotiate).toContainText("Görüşme kapandı");
  await expect
    .poll(
      async () => (await readSave()).negotiations[listing.id]?.offersRemaining,
    )
    .toBe(0);
  const closed = await readSave();
  expect(closed.cashMinor).toBe(saved.cashMinor);
  expect(closed.transactionJournal).toEqual(saved.transactionJournal);
  expect(
    closed.analytics.events.filter((event) => event.name === "offer_submitted"),
  ).toHaveLength(2);
  expect(reconcileJournal(closed)).toEqual({
    cash: true,
    activeBookCost: true,
    realizedProfit: true,
  });
  await page.reload();
  await openListing();
  await expect(negotiate).toBeDisabled();
  await expect(steps.getByRole("status")).toHaveCount(0);
  // Closing negotiation does not hide the existing non-tutorial list-price purchase.
  await expect(steps.getByRole("button", { name: /^Hemen al/ })).toBeEnabled();
  expect((await readSave()).negotiations[listing.id]).toEqual(
    closed.negotiations[listing.id],
  );
});
