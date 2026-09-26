import { expect, test } from "@playwright/test";
import { completeFirstLaunch } from "./helpers";
import { initialState, validateState } from "../src/game";

test("paid themes tint market surfaces without changing item visuals or decision signals", async ({ page }, testInfo) => {
  await page.goto("/");
  await completeFirstLaunch(page);
  const saved = validateState(initialState(Date.now(), "SANDBOX"));
  saved.monetization.entitlements.push(
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

  const accountAppearance = async (capture = false) => {
    await page.getByRole("button", { name: "Ayarlar", exact: true }).click();
    await expect(page.locator(".profile-card")).toBeVisible();
    const settings = await page.evaluate(() => {
      const surface = (selector: string) => {
        const style = getComputedStyle(document.querySelector<HTMLElement>(selector)!);
        return `${style.backgroundImage}|${style.backgroundColor}`;
      };
      return {
        screen: surface(".settings-card"),
        profile: surface(".profile-card"),
        avatar: surface(".avatar-picker--settings .avatar-options button"),
        controls: surface(".settings-section"),
      };
    });
    if (capture) await page.screenshot({ path: testInfo.outputPath("workshop-settings.png"), animations: "disabled" });
    await page.getByRole("button", { name: /Satın almalar & görünüm/i }).click();
    await expect(page.locator(".purchases-sheet")).toBeVisible();
    await expect(page.locator(".purchase-list article")).toHaveCount(6);
    await expect(page.locator(".purchase-list article").filter({ has: page.getByText("Reklamsız", { exact: true }) })).toContainText("Premium ile açık");
    await expect(page.locator(".purchase-list article").filter({ hasText: "Gece Pazarı" })).toContainText("Premium ile açık");
    const purchases = await page.evaluate(() => {
      const surface = (selector: string) => {
        const style = getComputedStyle(document.querySelector<HTMLElement>(selector)!);
        return `${style.backgroundImage}|${style.backgroundColor}`;
      };
      return {
        panel: surface(".purchase-panel"),
        product: surface(".purchase-list article"),
        choice: surface(".cosmetic-picker button[aria-pressed='true']"),
      };
    });
    if (capture) await page.screenshot({ path: testInfo.outputPath("workshop-store.png"), animations: "disabled" });
    await page.locator(".purchases-sheet .close").click();
    await page.locator(".settings-card > .settings-sheet-heading .icon-button").click();
    return { ...settings, ...purchases };
  };

  const classic = await appearance();
  await page.locator("#boot-splash").waitFor({ state: "hidden" });
  await page.screenshot({ path: testInfo.outputPath("classic.png"), animations: "disabled" });
  const classicAccount = await accountAppearance();
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
    const themedAccount = await accountAppearance(theme === "workshop");
    for (const key of Object.keys(classicAccount) as (keyof typeof classicAccount)[]) {
      expect(themedAccount[key], `${theme} ${key}`).not.toBe(classicAccount[key]);
    }
  }
  expect(new Set(themes).size).toBe(3);
  for (const width of [320, 430]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});
