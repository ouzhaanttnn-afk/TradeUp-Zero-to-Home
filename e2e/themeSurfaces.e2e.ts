import { expect, test } from "@playwright/test";
import { completeFirstLaunch } from "./helpers";
import { initialState, validateState } from "../src/game";

test("paid themes tint market surfaces without changing item visuals or decision signals", async ({ page }, testInfo) => {
  await page.goto("/");
  await completeFirstLaunch(page);
  const saved = validateState(initialState(Date.now(), "SANDBOX"));
  saved.monetization.entitlements.push(
    { productId: "tradeup_theme_night_market", entitlementId: "theme_night_market", status: "OWNED", platform: "ios" },
    { productId: "tradeup_theme_workshop", entitlementId: "theme_workshop", status: "OWNED", platform: "ios" },
    { productId: "tradeup_premium_lifetime", entitlementId: "premium_lifetime", status: "OWNED", platform: "ios" },
  );
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
  }, saved);
  await page.reload();
  const card = page.locator(".market-grid .market-card").first();
  await expect(card).toBeVisible();

  const appearance = async () => page.evaluate(() => {
    const card = document.querySelector<HTMLElement>(".market-grid .market-card")!;
    const art = card.querySelector<HTMLElement>(".product-art")!;
    const signal = card.querySelector<HTMLElement>(".visual-condition-bar")!;
    const image = card.querySelector<HTMLImageElement>("img")!;
    const nav = document.querySelector<HTMLElement>(".app-shell nav")!;
    const selectedChip = document.querySelector<HTMLElement>(".chips button.active")!;
    return {
      card: getComputedStyle(card).backgroundImage,
      art: getComputedStyle(art).backgroundImage,
      nav: getComputedStyle(nav).backgroundImage,
      selectedChip: getComputedStyle(selectedChip).backgroundImage,
      signal: getComputedStyle(signal).backgroundColor,
      image: image.currentSrc,
    };
  });

  const classic = await appearance();
  await page.locator("#boot-splash").waitFor({ state: "hidden" });
  await page.screenshot({ path: testInfo.outputPath("classic.png"), animations: "disabled" });
  const shell = page.locator(".app-shell");
  const themes = [];
  for (const theme of ["night-market", "workshop", "obsidian"]) {
    await page.evaluate((nextTheme) => {
      localStorage.setItem("tradeup_appearance_v1", JSON.stringify({ shellTheme: nextTheme, homeInteriorStyle: "classic" }));
    }, theme);
    await page.reload();
    await expect(shell).toHaveClass(new RegExp(`theme-${theme}`));
    await expect(card).toBeVisible();
    const themed = await appearance();
    expect(themed.card).not.toBe(classic.card);
    expect(themed.art).not.toBe(classic.art);
    expect(themed.nav).not.toBe(classic.nav);
    expect(themed.selectedChip).not.toBe(classic.selectedChip);
    expect(themed.signal).toBe(classic.signal);
    expect(themed.image).toBe(classic.image);
    themes.push(themed.card);
    await page.locator("#boot-splash").waitFor({ state: "hidden" });
    await page.screenshot({ path: testInfo.outputPath(`${theme}.png`), animations: "disabled" });
  }
  expect(new Set(themes).size).toBe(3);
  for (const width of [320, 430]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});
