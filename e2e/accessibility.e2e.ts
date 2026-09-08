import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { initialState, validateState } from "../src/game";
import { completeFirstLaunch } from "./helpers";

const seriousViolations = async (page: Page) => {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  return results.violations
    .filter(({ impact }) => impact === "critical" || impact === "serious")
    .map(({ id, nodes }) => ({
      id,
      targets: nodes.map(({ target }) => target.join(" ")),
    }));
};

test("primary mobile surfaces have no serious WCAG violations", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Pazara kendi tarzınla gir." }),
  ).toBeVisible();
  expect(await seriousViolations(page)).toEqual([]);
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

  await expect(page.getByRole("heading", { name: "Fırsat akışı" })).toBeVisible();
  expect(await seriousViolations(page)).toEqual([]);

  await page.locator(".market-grid .market-card").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(await seriousViolations(page)).toEqual([]);
  await page.getByRole("dialog").getByRole("button", { name: "Kapat" }).click();

  await page.getByRole("button", { name: "Ayarlar", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Profil ve Ayarlar" })).toBeVisible();
  expect(await seriousViolations(page)).toEqual([]);
});
