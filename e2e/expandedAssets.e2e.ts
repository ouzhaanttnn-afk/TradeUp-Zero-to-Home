import { expect, test } from "@playwright/test";
import { familyById } from "../src/content/families";
import { initialState, validateState } from "../src/game";

test("expanded product families use dedicated mobile artwork", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const state = initialState(Date.now(), "SANDBOX");
  const boardGame = familyById("board_game");
  const portableRadio = familyById("portable_radio");
  const fountainPen = familyById("fountain_pen");
  const floorLamp = familyById("floor_lamp");
  const gameCartridge = familyById("game_cartridge");
  if (
    !boardGame ||
    !portableRadio ||
    !fountainPen ||
    !floorLamp ||
    !gameCartridge
  ) {
    throw new Error("Asset family is missing");
  }
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
  state.listings[2] = {
    ...state.listings[2],
    familyId: fountainPen.id,
    instance: { ...state.listings[2].instance, family: fountainPen },
  };
  state.listings[3] = {
    ...state.listings[3],
    familyId: floorLamp.id,
    instance: { ...state.listings[3].instance, family: floorLamp },
  };
  state.listings[4] = {
    ...state.listings[4],
    familyId: gameCartridge.id,
    instance: { ...state.listings[4].instance, family: gameCartridge },
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
    ["Dolma Kalem Seti", "prd_fountain_pen"],
    ["Ark Zemin Lambası", "prd_floor_lamp"],
    ["Nadir Oyun Kartuşu", "prd_game_cartridge"],
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
  await page
    .locator(".market-card")
    .filter({ hasText: "Nadir Oyun Kartuşu" })
    .scrollIntoViewIfNeeded();
  await page.screenshot({
    path: testInfo.outputPath("game-cartridge-asset-390.png"),
    animations: "disabled",
  });
});
