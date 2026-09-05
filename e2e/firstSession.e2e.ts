import { expect, test } from "@playwright/test";
import type { GameState } from "../src/domain/models";
import { netWorthMinor, reconcileJournal } from "../src/domain/economy";
import { money, signedMoney } from "../src/game";

for (const choice of [
  { price: 140, condition: 55, withdraw: false, width: 320 },
  { price: 150, condition: 83, withdraw: false, width: 430 },
  { price: 140, condition: 55, withdraw: true, width: 390 },
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
    await page.setViewportSize({
      width: choice.width,
      height: choice.width === 320 ? 640 : 844,
    });
    const checkLayout = async () => {
      expect(
        await page.evaluate(() => {
          const problems: string[] = [];
          if (document.documentElement.scrollWidth > innerWidth)
            problems.push("page overflow");
          for (const element of document.querySelectorAll<HTMLElement>(
            ".owned, button, summary",
          )) {
            const rect = element.getBoundingClientRect();
            if (!rect.width || !rect.height) continue;
            if (element.scrollWidth > element.clientWidth + 1)
              problems.push(`overflow: ${element.textContent}`);
            if (
              (element.tagName === "BUTTON" || element.tagName === "SUMMARY") &&
              (rect.height < 44 || rect.width < 44)
            )
              problems.push(`small target: ${element.textContent}`);
          }
          return problems;
        }),
      ).toEqual([]);
    };
    await page.goto("/");
    await page.getByRole("button", { name: "Teklifi kabul et · ₺420" }).click();
    await stage("COMPARE");
    if (choice.withdraw || choice.width === 320) {
      await page.getByRole("button", { name: "Yolculuk", exact: true }).click();
      await page.getByRole("button", { name: "Ayarlar", exact: true }).click();
      await page
        .getByRole("button", { name: "Standart · büyüt", exact: true })
        .click();
      await page.getByRole("button", { name: "Pazar", exact: true }).click();
    }
    await page
      .getByRole("button", {
        name: `Kuzey Defteri, fiyat ₺${choice.price}, kondisyon yüzde ${choice.condition}, Piyasa fiyatı. İlan detaylarını aç`,
      })
      .click();
    const purchaseSteps = page.getByRole("group", {
      name: "Satın alma adımları",
    });
    await expect(
      purchaseSteps.getByRole("button", {
        name: "Benzer ilanlarla karşılaştır",
        exact: true,
      }),
    ).toBeInViewport({ ratio: 1 });
    await expect(page.getByRole("button", { name: /^Hemen al/ })).toHaveCount(
      0,
    );
    await expect(
      page.getByRole("button", { name: /^Pazarlık et/ }),
    ).toHaveCount(0);
    await page.screenshot({
      path: testInfo.outputPath("purchase-compare.png"),
      animations: "disabled",
    });
    await page
      .getByRole("button", {
        name: "Benzer ilanlarla karşılaştır",
        exact: true,
      })
      .click();
    await stage("EVIDENCE");
    await expect(
      page.getByRole("region", { name: "İlan 1", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("region", { name: "İlan 2", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^Pazarlık et/ }),
    ).toHaveCount(0);
    for (const button of await purchaseSteps.getByRole("button").all())
      await expect(button).toBeInViewport({ ratio: 1 });
    await page.screenshot({
      path: testInfo.outputPath("purchase-inspection.png"),
      animations: "disabled",
    });
    await purchaseSteps.getByRole("button", { name: /^Hızlı test/ }).click();
    await stage("NEGOTIATION");
    await expect(purchaseSteps.getByRole("status")).toContainText(
      "Yeni kanıtlar",
    );
    await expect(
      purchaseSteps.getByRole("button", { name: /^Pazarlık et/ }),
    ).toBeInViewport({ ratio: 1 });
    await expect(
      page.getByRole("region", { name: "İlan 1", exact: true }),
    ).toHaveCount(0);
    await checkLayout();
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
      await expect(purchaseSteps.getByRole("status")).toContainText(
        /Satıcı|reddedildi/,
      );
      await expect(purchaseSteps).toContainText(
        "Bu teklif reddedilirse görüşme kapanır.",
      );
      await expect(
        purchaseSteps.getByRole("button", { name: /^Pazarlık et/ }),
      ).toBeInViewport({ ratio: 1 });
      await page.screenshot({
        path: testInfo.outputPath("purchase-last-offer.png"),
        animations: "disabled",
      });
      await page.getByRole("button", { name: /^Pazarlık et/ }).click();
    }
    await stage("PREPARATION");
    await expect(
      page.getByRole("tab", { name: "Hazırlık", exact: true }),
    ).toHaveAttribute("aria-selected", "true");
    await expect(
      page.getByRole("article", { name: "Kuzey Defteri", exact: true }),
    ).toBeFocused();
    const firstAssetCard = page.getByRole("article", {
      name: "Kuzey Defteri",
      exact: true,
    });
    await expect(
      page.getByRole("complementary", { name: "İlk oturum rehberi" }),
    ).toHaveCount(0);
    await expect(
      firstAssetCard.getByRole("button", { name: /^Temizle/ }),
    ).toBeInViewport({ ratio: 1 });
    await expect(
      firstAssetCard.getByRole("button", { name: /^Test et/ }),
    ).toBeInViewport({ ratio: 1 });
    await expect(
      firstAssetCard.getByRole("button", { name: /^Eksikleri tamamla/ }),
    ).toBeInViewport({ ratio: 1 });
    await checkLayout();
    await page.screenshot({
      path: testInfo.outputPath("preparation-choice.png"),
      fullPage: true,
      animations: "disabled",
    });
    await page.getByRole("button", { name: /Temizle/ }).click();
    await stage("LISTING");
    await expect(
      page.getByRole("tab", { name: "Hazırlık", exact: true }),
    ).toHaveAttribute("aria-selected", "true");
    await expect(
      firstAssetCard.getByRole("button", { name: /^İlan oluştur/ }),
    ).toBeInViewport({ ratio: 1 });
    await expect(
      page.getByText("Diğer hazırlıklar", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Ürününe dön", exact: true }),
    ).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^Test et/ })).toHaveCount(0);
    await page.getByText("Diğer hazırlıklar", { exact: true }).click();
    await expect(page.getByRole("button", { name: /^Test et/ })).toBeVisible();
    await page.getByText("Diğer hazırlıklar", { exact: true }).click();
    await checkLayout();
    await page.screenshot({
      path: testInfo.outputPath("ready-to-list.png"),
      fullPage: true,
      animations: "disabled",
    });
    await page.getByRole("button", { name: /^İlan oluştur/ }).click();
    await stage("BUYER_SALE");
    await expect(
      page.getByRole("tab", { name: "İlanlarım", exact: true }),
    ).toHaveAttribute("aria-selected", "true");
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
        page.getByRole("tab", { name: "Envanter", exact: true }),
      ).toHaveAttribute("aria-selected", "true");
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
      await page
        .getByRole("button", { name: "Ürününe dön", exact: true })
        .click();
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
      await expect(
        page.getByRole("tab", { name: "İlanlarım", exact: true }),
      ).toHaveAttribute("aria-selected", "true");
      await page.screenshot({
        path: testInfo.outputPath("relisted-offer.png"),
        fullPage: true,
        animations: "disabled",
      });
    }
    const beforeSale = await readSave();
    const assetBeforeSale = beforeSale.ownedAssets.find(
      (asset) => asset.id === beforeSale.ftue.firstAssetId,
    )!;
    const offerBeforeSale = beforeSale.buyerOffers.find(
      (offer) => offer.listingId === assetBeforeSale.currentListingId,
    )!;
    const productCard = page.getByRole("article", {
      name: assetBeforeSale.instance.family.name,
      exact: true,
    });
    const offerPanel = productCard.getByRole("group", {
      name: `${offerBeforeSale.buyer} alıcı teklifi`,
    });
    await expect(offerPanel).toContainText(
      `Alacağın tutar${money(offerBeforeSale.amountMinor)}`,
    );
    await expect(offerPanel).toContainText(
      `Toplam harcaman${money(assetBeforeSale.bookCostMinor)}`,
    );
    await expect(offerPanel).toContainText(
      `Kârın${signedMoney(offerBeforeSale.amountMinor - assetBeforeSale.bookCostMinor)}`,
    );
    await checkLayout();
    await page.screenshot({
      path: testInfo.outputPath("sale-summary.png"),
      fullPage: true,
      animations: "disabled",
    });
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
    if (choice.width === 320) {
      await page
        .getByRole("button", {
          name: "Kuzey Defteri, fiyat ₺150, kondisyon yüzde 83, Piyasa fiyatı. İlan detaylarını aç",
        })
        .click();
      await page.getByRole("button", { name: /^Hemen al/ }).click();
      await expect(
        page.getByRole("tab", { name: "Envanter", exact: true }),
      ).toHaveAttribute("aria-selected", "true");
      await expect(
        page.getByRole("article", { name: "Kuzey Defteri", exact: true }),
      ).toBeFocused();
      await expect
        .poll(async () => (await readSave()).cashMinor)
        .toBe(loaded.cashMinor - 15_000);
      await stage("COMPLETE");
      const purchased = await readSave();
      await page.getByRole("button", { name: /^Hemen sat/ }).click();
      await expect(
        page.getByRole("group", { name: "Hızlı satış onayı" }),
      ).toContainText("Toplam harcaman ₺150");
      await checkLayout();
      await page.getByRole("button", { name: "Vazgeç", exact: true }).click();
      expect((await readSave()).transactionJournal).toEqual(
        purchased.transactionJournal,
      );
      await page
        .getByRole("button", { name: "Ürünü hazırla", exact: true })
        .click();
      await expect(
        page.getByRole("tab", { name: "Hazırlık", exact: true }),
      ).toHaveAttribute("aria-selected", "true");
      // Preparation stays optional after the first session; navigation must not charge a fee.
      await page.getByRole("button", { name: /^İlan oluştur/ }).click();
      await expect(
        page.getByRole("tab", { name: "İlanlarım", exact: true }),
      ).toHaveAttribute("aria-selected", "true");
      await expect
        .poll(
          async () =>
            (await readSave()).playerListings.filter(
              (listing) => listing.state === "ACTIVE",
            ).length,
        )
        .toBe(1);
      expect((await readSave()).cashMinor).toBe(purchased.cashMinor);
      await stage("COMPLETE");
    }
    expect(errors).toEqual([]);
  });
}
