import { expect, test } from "@playwright/test";
import { familyById } from "../src/content/families";
import { initialState, validateState } from "../src/game";

test("first expanded product families use dedicated mobile artwork", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const state = initialState(Date.now(), "SANDBOX");
  const boardGame = familyById("board_game");
  const portableRadio = familyById("portable_radio");
  if (!boardGame || !portableRadio) throw new Error("Asset family is missing");
  state.listings[0] = {
    ...state.listings[0],
    familyId: boardGame.id,
    instance: { ...state.listings[0].instance, family: boardGame },
  };
  state.listings[1] = {
    ...state.listings[1],
    familyId: portableRadio.id,
    instance: { ...state.listings[1].instance, family: portableRadio },
  };
  const saved = validateState(state);

  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Fırsat akışı" }),
  ).toBeVisible();
  await page.evaluate(async (game) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("tradeup", 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction("game", "readwrite");
        transaction.objectStore("game").put(game, "main");
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } finally {
      db.close();
    }
  }, saved);
  await page.reload();

  for (const [name, assetName] of [
    ["Koleksiyon Masa Oyunu", "prd_board_game"],
    ["Kıyı Cep Radyosu", "prd_portable_radio"],
  ] as const) {
    const card = page.locator(".market-card").filter({ hasText: name });
    const visual = card.locator(".product-visual");
    const image = visual.locator("img");
    await expect(card).toHaveCount(1);
    await expect(visual).not.toHaveClass(/product-visual--fallback/);
    await expect(image).toHaveAttribute("src", new RegExp(assetName));
    await expect
      .poll(() =>
        image.evaluate(
          (element: HTMLImageElement) =>
            element.complete && element.naturalWidth > 0,
        ),
      )
      .toBe(true);
  }

  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("expanded-product-assets-390.png"),
    animations: "disabled",
  });
});
