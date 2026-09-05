import { expect, test } from "@playwright/test";
import type { GameState } from "../src/domain/models";
import { reconcileJournal } from "../src/domain/economy";

for (const choice of [
  { price: 140, condition: 55 },
  { price: 150, condition: 83 },
]) {
  test(`first session completes with the ${choice.price} TL listing and reconciled accounting`, async ({
    page,
  }) => {
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
    const stage = async (expected: string) => {
      await expect
        .poll(async () => (await readSave()).ftue.stage)
        .toBe(expected);
      expect(reconcileJournal(await readSave())).toEqual({
        cash: true,
        activeBookCost: true,
        realizedProfit: true,
      });
    };
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/");
    await page.getByRole("button", { name: "Teklifi kabul et · ₺420" }).click();
    await stage("COMPARE");
    await page
      .getByRole("button", {
        name: `Kuzey Defteri, fiyat ₺${choice.price}, kondisyon yüzde ${choice.condition}, Piyasa fiyatı. İlan detaylarını aç`,
      })
      .click();
    await page
      .getByRole("button", {
        name: "Benzer ilanlarla karşılaştır",
        exact: true,
      })
      .click();
    await stage("EVIDENCE");
    await page.getByRole("button", { name: /^Hızlı test/ }).click();
    await stage("NEGOTIATION");
    await page.getByRole("button", { name: /^Pazarlık et/ }).click();
    await expect
      .poll(
        async () =>
          (await readSave()).analytics.events.filter(
            (event) => event.name === "offer_submitted",
          ).length,
      )
      .toBe(1);
    if ((await readSave()).ftue.stage === "NEGOTIATION") {
      await page.getByRole("button", { name: /^Pazarlık et/ }).click();
    }
    await stage("PREPARATION");
    await page.getByRole("button", { name: "Portföy", exact: true }).click();
    await page.getByRole("tab", { name: "Hazırlık", exact: true }).click();
    await page.getByRole("button", { name: /Temizle/ }).click();
    await stage("LISTING");
    await page.getByRole("tab", { name: "Envanter", exact: true }).click();
    await page.getByRole("button", { name: /^İlan oluştur/ }).click();
    await stage("BUYER_SALE");
    await page.getByRole("tab", { name: "İlanlarım", exact: true }).click();
    await page
      .getByRole("button", { name: "Teklifi kabul et", exact: true })
      .click();
    await stage("COMPLETE");
    const completed = await readSave();
    const firstAsset = completed.ownedAssets.find(
      (asset) => asset.id === completed.ftue.firstAssetId,
    )!;
    expect(firstAsset.state).toBe("SOLD_COMPLETE");
    expect(firstAsset.preparationCostMinor).toBeGreaterThan(0);
    const sale = completed.transactionJournal.find(
      (entry) => entry.kind === "SALE" && entry.assetId === firstAsset.id,
    )!;
    expect(sale.realizedProfitDeltaMinor).toBe(
      sale.cashDeltaMinor - firstAsset.bookCostMinor,
    );
    expect(sale.realizedProfitDeltaMinor).toBeGreaterThan(0);
    expect(completed.home.unlocked).toBe(true);
    expect(
      completed.analytics.events.filter(
        (event) => event.name === "offer_submitted",
      ).length,
    ).toBeLessThanOrEqual(2);
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Fırsat akışı" }),
    ).toBeVisible();
    await stage("COMPLETE");
    const loaded = await readSave();
    expect(loaded.transactionJournal).toEqual(completed.transactionJournal);
    expect(loaded.cashMinor).toBe(completed.cashMinor);
    expect(errors).toEqual([]);
  });
}
