import { expect, test } from "@playwright/test";
import type { GameState } from "../src/domain/models";
import { netWorthMinor, reconcileJournal } from "../src/domain/economy";

for (const choice of [
  { price: 140, condition: 55, withdraw: false },
  { price: 150, condition: 83, withdraw: false },
  { price: 140, condition: 55, withdraw: true },
]) {
  test(`first session completes with the ${choice.price} TL listing${choice.withdraw ? " after withdrawal and reload" : ""} and reconciled accounting`, async ({
    page,
  }, testInfo) => {
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
    if (choice.withdraw) {
      const listed = await readSave();
      const assetId = listed.ftue.firstAssetId!;
      const asset = listed.ownedAssets.find((item) => item.id === assetId)!;
      const listingId = asset.currentListingId!;
      await page
        .getByRole("button", { name: "İlanı geri çek", exact: true })
        .click();
      await stage("LISTING");
      await expect(
        page.getByText("Aktif ilanın yok", { exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Teklifi kabul et", exact: true }),
      ).toHaveCount(0);
      const withdrawn = await readSave();
      expect(withdrawn.cashMinor).toBe(listed.cashMinor);
      expect(netWorthMinor(withdrawn)).toBe(netWorthMinor(listed));
      expect(withdrawn.ownedAssets.find((item) => item.id === assetId)).toEqual(
        {
          ...asset,
          state: "IN_INVENTORY",
          currentListingId: undefined,
        },
      );
      expect(
        withdrawn.playerListings.find((item) => item.id === listingId)?.state,
      ).toBe("WITHDRAWN");
      expect(
        withdrawn.buyerOffers.some((offer) => offer.listingId === listingId),
      ).toBe(false);
      await page.reload();
      await expect(
        page.getByRole("heading", { name: "Fırsat akışı" }),
      ).toBeVisible();
      await stage("LISTING");
      const loaded = await readSave();
      expect(loaded.transactionJournal).toEqual(withdrawn.transactionJournal);
      expect(loaded.ownedAssets).toEqual(withdrawn.ownedAssets);
      await page.getByRole("button", { name: "Portföy", exact: true }).click();
      await page.getByRole("tab", { name: "Envanter", exact: true }).click();
      await page.getByRole("button", { name: /^İlan oluştur/ }).click();
      await stage("BUYER_SALE");
      const relisted = await readSave();
      const newListingId = relisted.ownedAssets.find(
        (item) => item.id === assetId,
      )!.currentListingId;
      expect(newListingId).not.toBe(listingId);
      expect(relisted.cashMinor).toBe(listed.cashMinor);
      expect(netWorthMinor(relisted)).toBe(netWorthMinor(listed));
      expect(
        relisted.playerListings.filter((item) => item.ownedAssetId === assetId),
      ).toHaveLength(2);
      expect(
        relisted.buyerOffers.filter(
          (offer) => offer.listingId === newListingId,
        ),
      ).toHaveLength(1);
      await page.getByRole("tab", { name: "İlanlarım", exact: true }).click();
      await page.screenshot({
        path: testInfo.outputPath("relisted-offer.png"),
        fullPage: true,
        animations: "disabled",
      });
    }
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
    expect(
      completed.transactionJournal.filter(
        (entry) => entry.kind === "SALE" && entry.assetId === firstAsset.id,
      ),
    ).toHaveLength(1);
    expect(
      completed.buyerOffers.some((offer) =>
        completed.playerListings.some(
          (listing) =>
            listing.id === offer.listingId &&
            listing.ownedAssetId === firstAsset.id,
        ),
      ),
    ).toBe(false);
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
