import { expect, test } from "@playwright/test";
import type { GameState } from "../src/domain/models";
import {
  buyerCounterMinor,
  counterBuyerOffer,
  createPlayerListing,
  purchaseListing,
  quoteAssetExit,
  reconcileJournal,
} from "../src/domain/economy";
import { initialState, validateState } from "../src/game";

test("a buyer counter becomes one persisted final offer with no message chain", async ({
  page,
}, testInfo) => {
  const now = new Date("2026-09-05T12:00:00Z");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.install({ time: now });
  await page.clock.pauseAt(now);
  const initial = initialState(now.getTime(), "SANDBOX");
  initial.ftue.stage = "COMPLETE";
  const purchase = purchaseListing(initial, initial.listings[0], 100, 0);
  if (!purchase.ok) throw new Error(purchase.reason);
  const asset = purchase.state.ownedAssets[0];
  const listed = createPlayerListing(
    purchase.state,
    asset.id,
    quoteAssetExit(asset).balancedAskingMinor,
    0,
  );
  if (!listed.ok) throw new Error(listed.reason);
  const listing = listed.state.playerListings[0];
  const amountMinor = Math.max(1_000, listing.askingPriceMinor - 20_000);
  const counterMinor = buyerCounterMinor({ amountMinor }, listing)!;
  let offerId = "";
  for (let index = 0; index < 1_000; index++) {
    const candidateId = `offer:e2e-final:${index}`;
    const candidate: GameState = {
      ...listed.state,
      buyerOffers: [
        {
          id: candidateId,
          listingId: listing.id,
          amountMinor,
          buyer: "Selin",
          expiresAtGameMin: 60,
        },
      ],
    };
    const result = counterBuyerOffer(candidate, candidateId, counterMinor, 0);
    if (result.ok && result.outcome === "FINAL") {
      offerId = candidateId;
      break;
    }
  }
  expect(offerId).not.toBe("");
  const saved = validateState({
    ...listed.state,
    buyerOffers: [
      {
        id: offerId,
        listingId: listing.id,
        amountMinor,
        buyer: "Selin",
        expiresAtGameMin: 60,
      },
    ],
  });

  await page.goto("/");
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
  await page.getByRole("button", { name: "Portföy", exact: true }).click();
  await page.getByRole("tab", { name: "İlanlarım", exact: true }).click();
  const counter = page.getByRole("button", { name: /Karşı teklif yap:/ });
  await expect(counter).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("buyer-counter-choice.png"),
    fullPage: true,
    animations: "disabled",
  });
  await counter.click();
  await expect(
    page.getByRole("heading", {
      name: "Selin son fiyatını verdi",
      exact: true,
    }),
  ).toBeVisible();
  await expect(counter).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Teklifi kabul et" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Teklifi reddet" }),
  ).toBeVisible();
  const final = await readSave();
  expect(final.buyerOffers[0]).toMatchObject({
    id: offerId,
    initialAmountMinor: amountMinor,
    counterUsed: true,
  });
  expect(final.cashMinor).toBe(saved.cashMinor);
  expect(final.transactionJournal).toEqual(saved.transactionJournal);
  expect(final.playerListings[0].state).toBe("ACTIVE");
  expect(reconcileJournal(final)).toEqual({
    cash: true,
    activeBookCost: true,
    realizedProfit: true,
  });
  await page.screenshot({
    path: testInfo.outputPath("buyer-final-offer.png"),
    fullPage: true,
    animations: "disabled",
  });

  await page.reload();
  await page.getByRole("button", { name: "Portföy", exact: true }).click();
  await page.getByRole("tab", { name: "İlanlarım", exact: true }).click();
  await expect(counter).toHaveCount(0);
  await page.getByRole("button", { name: "Teklifi kabul et" }).click();
  await expect
    .poll(async () => (await readSave()).ownedAssets[0].state)
    .toBe("SOLD_COMPLETE");
  expect(reconcileJournal(await readSave())).toEqual({
    cash: true,
    activeBookCost: true,
    realizedProfit: true,
  });
});
