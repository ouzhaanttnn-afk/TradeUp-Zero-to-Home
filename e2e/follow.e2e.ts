import { expect, test } from "@playwright/test";
import { initialState, validateState } from "../src/game";
import { completeFirstLaunch } from "./helpers";

test("watched listing remains actionable after the Follow tab loads on demand", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await completeFirstLaunch(page);
  const saved = validateState(initialState(Date.now(), "SANDBOX"));
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

  const firstListing = page.locator(".market-grid .market-card").first();
  const listingName = (await firstListing.locator("h3").textContent())?.trim();
  expect(listingName).toBeTruthy();
  await firstListing.click();

  const detail = page.getByRole("dialog", { name: listingName });
  await expect(detail).toBeVisible();
  await expect(detail.getByRole("button", { name: "Kapat" })).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe(
    "hidden",
  );
  await page.keyboard.press("Shift+Tab");
  expect(
    await page.evaluate(() =>
      Boolean(document.activeElement?.closest(".sheet")),
    ),
  ).toBe(true);
  await detail.getByRole("button", { name: "İlanı takip et" }).click();
  await detail.getByRole("button", { name: "Kapat" }).click();
  await expect(firstListing).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("");

  await page.getByRole("button", { name: "Takip", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Takip" })).toBeVisible();
  await expect(page.locator(".watch-listing")).toHaveCount(1);
  await expect(page.locator(".watch-listing h3")).toHaveText(listingName!);

  await page.locator(".watch-listing").click();
  await expect(page.getByRole("dialog", { name: listingName })).toBeVisible();
});
