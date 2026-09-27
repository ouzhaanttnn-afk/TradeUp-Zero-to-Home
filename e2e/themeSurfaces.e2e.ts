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
    await expect(page.locator(".purchase-list article")).toHaveCount(0);
    await expect(page.locator(".purchase-status__count")).toHaveText("6/6");
    for (const selector of [".purchase-status", ".appearance-panel", ".cosmetic-picker button[aria-pressed='true']"]) {
      const glow = await page.locator(`.purchases-sheet ${selector}`).first().evaluate((element) => getComputedStyle(element).boxShadow);
      expect(glow, `${selector} should retain its subtle highlight`).not.toBe("none");
    }
    if (capture) await page.screenshot({ path: testInfo.outputPath("workshop-store.png"), animations: "disabled" });
    await page.locator(".owned-purchases summary").click();
    await expect(page.locator(".owned-purchases__item")).toHaveCount(6);
    await expect(page.locator(".owned-purchases__item").filter({ hasText: "Reklamsız" })).toContainText("Premium ile açık");
    await expect(page.locator(".owned-purchases__item").filter({ hasText: "Gece Pazarı" })).toContainText("Premium ile açık");
    const purchases = await page.evaluate(() => {
      const surface = (selector: string) => {
        const style = getComputedStyle(document.querySelector<HTMLElement>(selector)!);
        return `${style.backgroundImage}|${style.backgroundColor}`;
      };
      return {
        panel: surface(".purchase-status"),
        product: surface(".purchase-status__mark"),
        choice: surface(".cosmetic-picker button[aria-pressed='true']"),
      };
    });
    await page.locator(".purchases-sheet .close").click();
    await page.locator(".settings-card > .settings-sheet-heading .icon-button").click();
    return { ...settings, ...purchases };
  };

  const secondaryAppearance = async () => {
    const read = async (selector: string) => page.locator(selector).first().evaluate((element) => getComputedStyle(element).backgroundImage);
    await page.getByRole("navigation").getByRole("button", { name: "Radar" }).click();
    await expect(page.locator(".radar-card")).toBeVisible();
    const radar = await read(".radar-card");
    await page.getByRole("navigation").getByRole("button", { name: "Portföy" }).click();
    await expect(page.locator(".showcase-room")).toBeVisible();
    const showcase = await read(".showcase-room");
    const showcaseSlot = await read(".showcase-slot.empty");
    await page.getByRole("navigation").getByRole("button", { name: "Yolculuk" }).click();
    await expect(page.locator(".journey-score")).toBeVisible();
    const journey = await read(".journey-score");
    await page.getByRole("navigation").getByRole("button", { name: "Pazar" }).click();
    return { radar, showcase, showcaseSlot, journey };
  };

  const classic = await appearance();
  await page.locator("#boot-splash").waitFor({ state: "hidden" });
  await page.screenshot({ path: testInfo.outputPath("classic.png"), animations: "disabled" });
  const classicAccount = await accountAppearance();
  const classicSecondary = await secondaryAppearance();
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
    const themedSecondary = await secondaryAppearance();
    for (const key of Object.keys(classicSecondary) as (keyof typeof classicSecondary)[]) {
      expect(themedSecondary[key], `${theme} ${key}`).not.toBe(classicSecondary[key]);
    }
  }
  expect(new Set(themes).size).toBe(3);
  for (const width of [320, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.locator(".market-grid .market-card").first().click();
    const detail = page.getByRole("dialog", { name: /.+/ });
    await expect(detail.locator(".seller-dialogue-bubble")).toBeVisible();
    await expect(detail.locator(".hero-art")).toHaveCSS("height", "100px");
    const decisionButtons = detail.locator(".sheet-decision button");
    for (const button of await decisionButtons.all()) {
      expect(await button.evaluate((element) => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
    }
    const bounds = await detail.evaluate((element) => {
      const box = (selector: string) => element.querySelector(selector)!.getBoundingClientRect();
      const title = box(".sheet-title");
      const message = box(".seller-dialogue-bubble");
      const price = box(".detail-price");
      return { titleBottom: title.bottom, messageTop: message.top, messageBottom: message.bottom, priceTop: price.top };
    });
    expect(bounds.messageTop).toBeGreaterThanOrEqual(bounds.titleBottom);
    expect(bounds.priceTop).toBeGreaterThanOrEqual(bounds.messageBottom);
    if (width === 390) await page.screenshot({ path: testInfo.outputPath("themed-listing-detail-390.png"), animations: "disabled" });
    await detail.locator(".close").click();
    await page.getByRole("button", { name: "Ayarlar", exact: true }).click();
    await page.getByRole("button", { name: /Satın almalar & görünüm/i }).click();
    const store = page.locator(".purchases-sheet");
    expect(await store.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    await expect(store.locator(".purchase-status__count")).toHaveText("6/6");
    await store.locator(".close").click();
    await page.locator(".settings-card > .settings-sheet-heading .icon-button").click();
  }
});

test("market movement copy stays separated and inherits the selected theme on narrow screens", async ({ page }, testInfo) => {
  await page.goto("/");
  await completeFirstLaunch(page);
  const saved = validateState(initialState(Date.now(), "SANDBOX"));
  saved.seed = 5; // The first event window is Nostalji rüzgarı.
  saved.gameTimeMin = 180;
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
    localStorage.setItem("tradeup_appearance_v1", JSON.stringify({ shellTheme: "obsidian", homeInteriorStyle: "classic" }));
  }, saved);
  await page.reload();
  const event = page.locator(".market-event");
  await expect(event).toContainText("Nostalji rüzgarı");
  await expect(page.locator(".app-shell")).toHaveClass(/theme-obsidian/);
  for (const width of [320, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    const boxes = await event.evaluate((element) => {
      const box = (selector: string) => element.querySelector(selector)!.getBoundingClientRect();
      const badge = box("small");
      const title = box("b");
      const message = box("p");
      const container = element.getBoundingClientRect();
      return {
        badgeBottom: badge.bottom,
        titleTop: title.top,
        titleBottom: title.bottom,
        messageTop: message.top,
        messageBottom: message.bottom,
        containerBottom: container.bottom,
      };
    });
    expect(boxes.titleTop).toBeGreaterThan(boxes.badgeBottom);
    expect(boxes.messageTop).toBeGreaterThan(boxes.titleBottom);
    expect(boxes.containerBottom).toBeGreaterThan(boxes.messageBottom);
    if (width === 390) await event.screenshot({ path: testInfo.outputPath("nostalgia-event-390.png") });
  }
});
