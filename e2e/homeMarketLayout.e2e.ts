import { expect, test } from "@playwright/test";
import { initialState, validateState } from "../src/game";
import { completeFirstLaunch } from "./helpers";

for (const [theme, width, large] of [
  ["classic", 320, false], ["night-market", 375, true],
  ["workshop", 390, false], ["obsidian", 430, true],
] as const) {
  test(`home market ${theme} ${width}px large=${large} keeps modal above navigation`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/"); await completeFirstLaunch(page);
    const saved = initialState(Date.now(), "SANDBOX");
    saved.home = { ...saved.home, unlocked: true, searchStartedAtGameMin: 0 };
    saved.gameTimeMin = 500;
    saved.accessibility.largeText = large;
    saved.accessibility.reducedMotion = true;
    saved.monetization.entitlements.push({ productId: "tradeup_premium_lifetime", entitlementId: "premium_lifetime", platform: "ios", status: "OWNED" });
    await page.evaluate(async ({ state, theme }) => {
      localStorage.setItem("tradeup_appearance_v1", JSON.stringify({ shellTheme: theme, homeInteriorStyle: "classic" }));
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open("tradeup", 1);
        request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
      });
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction("game", "readwrite");
        transaction.objectStore("game").put(state, "main");
        transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error);
      }); db.close();
    }, { state: validateState(saved), theme });
    await page.reload();
    await expect(page.locator(".app-shell")).toHaveClass(new RegExp(`theme-${theme}`));
    await expect(page.locator(".home-market-tile")).toHaveCount(1);
    await page.getByRole("button", { name: "Emlak", exact: true }).click();
    await expect(page.locator(".home-market-tile")).toHaveCount(5);
    await page.locator(".home-market-tile button").first().click();
    const dialog = page.getByRole("dialog", { name: "Bahçeli Başlangıç Evi" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: /Onayla ve evi satın al/ })).toBeDisabled();
    await expect(dialog).toContainText("Nakit eksiği");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    expect(await dialog.evaluate((element) => {
      const close = element.querySelector(".close")!;
      const rect = close.getBoundingClientRect();
      return element.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2));
    })).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`home-${theme}-${width}.png`), animations: "disabled" });
    await page.keyboard.press("Escape"); await expect(dialog).toBeHidden();
    await expect(page.locator(".home-market-tile button").first()).toBeFocused();
  });
}
