import { expect, test } from "@playwright/test";
import { HOME_GOAL_MINOR, initialState, validateState } from "../src/game";

test("wealth atmosphere culminates in an accessible home purchase finale", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const saved = initialState(Date.now(), "SANDBOX");
  saved.cashMinor = HOME_GOAL_MINOR;
  saved.transactionJournal[0] = {
    ...saved.transactionJournal[0],
    cashDeltaMinor: HOME_GOAL_MINOR,
  };
  saved.home = {
    unlocked: true,
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
  await expect(
    page.getByRole("button", { name: `Evi satın al · ₺3.500.000` }),
  ).toBeVisible();
  await page.getByRole("button", { name: `Evi satın al · ₺3.500.000` }).click();

  const finale = page.getByRole("dialog", { name: "Anahtar artık sende." });
  await expect(finale).toBeVisible();
  await expect(finale).toContainText("İlk satışını tamamladın");
  await expect(finale).toContainText("Yeni en iyi satışın");
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
  await page.screenshot({
    path: testInfo.outputPath("home-finale-390.png"),
    animations: "disabled",
  });
  await finale.getByRole("button", { name: "Yolculuğa devam et" }).click();
  await expect(finale).toBeHidden();
  await expect(
    page.getByRole("heading", { name: "Evin artık senin" }),
  ).toBeVisible();
});
