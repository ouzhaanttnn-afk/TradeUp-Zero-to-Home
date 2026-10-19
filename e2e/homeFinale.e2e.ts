import { expect, test } from "@playwright/test";
import { completeFirstLaunch } from "./helpers";
import { initialState, validateState } from "../src/game";
import { HOME_OPTIONS } from "../src/content/homes";
import { purchaseListing, settleAssetSale } from "../src/domain/economy";

test("wealth atmosphere culminates in an accessible home purchase finale", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let saved = initialState(Date.now(), "SANDBOX");
  const selectedHomePriceMinor = HOME_OPTIONS[0].priceMinor;
  saved.cashMinor = selectedHomePriceMinor - 18_000;
  saved.gameTimeMin = 180;
  saved.transactionJournal[0] = {
    ...saved.transactionJournal[0],
    cashDeltaMinor: saved.cashMinor,
  };
  const bought = purchaseListing(saved, saved.listings[0], 20_000, 10);
  if (!bought.ok) throw new Error(bought.reason);
  const sold = settleAssetSale(
    bought.state,
    bought.state.ownedAssets.at(-1)!.id,
    38_000,
    "finale:sale:1",
    20,
  );
  if (!sold.ok) throw new Error(sold.reason);
  saved = sold.state;
  saved.home = {
    unlocked: true,
    searchStartedAtGameMin: 0,
    purchased: false,
    progressMilestones: [25, 50, 75, 90],
  };
  saved.career = [
    {
      id: "career:first-sale:test",
      type: "FIRST_SALE",
      group: "FIRSTS",
      atGameMin: 10,
      label: "İlk satışını tamamladın",
      amountMinor: 18_000,
    },
    {
      id: "career:best-flip:test",
      type: "BEST_FLIP_UPDATED",
      group: "RECORDS",
      atGameMin: 20,
      label: "Yeni en iyi satışın",
      amountMinor: 72_000,
    },
  ];
  const valid = validateState(saved);

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
  }, valid);
  await page.reload();

  await expect(page.locator(".app-shell")).toHaveCSS(
    "--home-gold-progress",
    "0.92",
  );
  await page.getByRole("button", { name: "Yolculuk", exact: true }).click();
  await expect(page.getByText("2 ev bulundu")).toBeVisible();
  await expect(page.getByRole("button", { name: "Bu evi seç" })).toHaveCount(0);
  await page.getByRole("button", { name: "Pazar'da evleri incele" }).click();
  await expect(page.getByRole("button", { name: "Emlak", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".home-market-tile")).toHaveCount(2);
  await page.locator(".home-market-tile").first().getByRole("button").click();
  const detail = page.getByRole("dialog", { name: "Bahçeli Başlangıç Evi" });
  await expect(detail).toBeVisible();
  await expect(detail.getByRole("heading", { name: "Bahçeli Başlangıç Evi" })).toBeInViewport();
  expect(await detail.evaluate((dialog) => {
    const heading = dialog.querySelector("h2")!;
    const box = heading.getBoundingClientRect();
    return dialog.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
  })).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("home-market-390.png"),
    animations: "disabled",
  });
  await detail.getByRole("button", { name: /Onayla ve evi satın al/ }).click();

  const finale = page.getByRole("dialog", { name: "İlk evin senin." });
  await expect(finale).toBeVisible();
  await expect(page.locator(".app-shell")).toHaveClass(/home-atmosphere-pulse/);
  expect(
    await page.locator(".app-shell").evaluate((shell) => ({
      frame: getComputedStyle(shell).animationName,
      gold: getComputedStyle(shell, "::before").animationName,
    })),
  ).toEqual({
    frame: "home-milestone-frame",
    gold: "home-atmosphere-arrival",
  });
  // Legacy career labels are not economic evidence; only the journal is used.
  await expect(finale).not.toContainText("Yeni en iyi satışın");
  await expect(finale).toContainText("Ticaret");
  await expect(finale).toContainText("Piyasa kârı");
  await expect(finale.locator(".home-sale-memories article")).toHaveCount(1);
  await expect(finale.locator(".home-sale-memories article")).toContainText(
    "İlk kârlı satış · En iyi satış",
  );
  await expect(finale.locator(".home-sale-memories article")).toContainText(
    "₺180",
  );
  await expect(page.locator(".app-shell")).toHaveClass(/home-complete/);
  await expect(page.locator(".app-shell")).toHaveCSS(
    "--home-gold-progress",
    "1",
  );
  await expect(page.getByText("₺0", { exact: true }).first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  await page.waitForTimeout(3_300);
  await expect(finale.getByRole("checkbox", { name: "İsmimi göster" })).not.toBeChecked();
  await finale.getByRole("button", { name: "Başarı kartımı hazırla" }).click();
  await expect(finale.getByAltText("Paylaşılacak ilk ev başarı kartı")).toBeVisible();
  expect(await finale.getByAltText("Paylaşılacak ilk ev başarı kartı").evaluate((image: HTMLImageElement) => ({ width: image.naturalWidth, height: image.naturalHeight }))).toEqual({ width: 1080, height: 1350 });
  const download = page.waitForEvent("download");
  await finale.getByRole("link", { name: "Görseli indir" }).click();
  expect((await download).suggestedFilename()).toBe("tradeup-ilk-evim.png");
  await page.screenshot({
    path: testInfo.outputPath("home-finale-390.png"),
    animations: "disabled",
  });
  await finale.getByRole("button", { name: "Yolculuğa devam et" }).click();
  await page.reload();
  await page.getByRole("button", { name: "Yolculuk", exact: true }).click();
  await expect(page.locator(".home-market-tile--owned")).toContainText("Bahçeli Başlangıç Evi");
  await page.locator(".home-market-tile--owned button").click();
  const ownedDetail = page.getByRole("dialog", { name: "Bahçeli Başlangıç Evi" });
  await expect(ownedDetail).toContainText("Bu ev senin.");
  await expect(ownedDetail.getByRole("button", { name: /Onayla/ })).toHaveCount(0);
  await ownedDetail.getByRole("button", { name: "Kapat", exact: true }).click();
  await page.locator(".career-records-disclosure summary").click();
  await expect(page.locator(".career-records-disclosure")).toContainText(
    "1 ticaret",
  );
  await expect(finale).toBeHidden();
  await page.getByRole("button", { name: "İlk ev anını gör" }).click();
  await expect(finale).toBeVisible();
  await finale.getByRole("button", { name: "Yolculuğa devam et" }).click();
  // The home ladder continues: garden_edge was the cheapest option, so the
  // next-priciest already-revealed home becomes the new goal instead of a
  // dead "coming soon" placeholder.
  await expect(
    page.getByRole("heading", {
      name: "Bahçeli Başlangıç Evi → Şehir Rezidans Dairesi",
    }),
  ).toBeVisible();
  await expect(page.getByText("1 ev bulundu")).toBeVisible();
  await expect(page.getByText("YAKINDA", { exact: true })).toHaveCount(0);
});
