import { expect, test, type Page } from "@playwright/test";
import { completeFirstLaunch } from "./helpers";
import { familyById } from "../src/content/families";
import { initialState, validateState, type GameState } from "../src/game";

const persistGame = async (page: Page, game: GameState) => {
  await page.evaluate(async (savedGame) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("tradeup", 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    try {
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction("game", "readwrite");
        transaction.objectStore("game").put(savedGame, "main");
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } finally {
      db.close();
    }
  }, game);
};

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
  const perfumeSet = familyById("perfume_set");
  const makeupSet = familyById("makeup_set");
  const trenchCoat = familyById("trench_coat");
  const leatherBag = familyById("leather_bag");
  const vrHeadset = familyById("vr_headset");
  const robotVacuum = familyById("robot_vacuum");
  const foldPhone = familyById("fold_phone");
  const racingWheel = familyById("racing_wheel");
  const standMixer = familyById("stand_mixer");
  const studioMonitor = familyById("studio_monitor");
  if (
    !boardGame ||
    !portableRadio ||
    !fountainPen ||
    !floorLamp ||
    !gameCartridge ||
    !perfumeSet ||
    !makeupSet ||
    !trenchCoat ||
    !leatherBag ||
    !vrHeadset ||
    !robotVacuum ||
    !foldPhone ||
    !racingWheel ||
    !standMixer ||
    !studioMonitor
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
  for (const [index, family] of [
    perfumeSet,
    makeupSet,
    trenchCoat,
    leatherBag,
  ].entries()) {
    state.listings[index + 5] = {
      ...state.listings[index + 5],
      familyId: family.id,
      instance: { ...state.listings[index + 5].instance, family },
    };
  }
  state.listings[9] = {
    ...state.listings[9],
    familyId: vrHeadset.id,
    instance: { ...state.listings[9].instance, family: vrHeadset },
  };
  state.listings[10] = {
    ...state.listings[10],
    familyId: robotVacuum.id,
    instance: { ...state.listings[10].instance, family: robotVacuum },
  };
  state.listings[11] = {
    ...state.listings[11],
    familyId: foldPhone.id,
    instance: { ...state.listings[11].instance, family: foldPhone },
  };
  state.listings[12] = {
    ...state.listings[12],
    familyId: racingWheel.id,
    instance: { ...state.listings[12].instance, family: racingWheel },
  };
  state.listings[13] = {
    ...state.listings[13],
    familyId: standMixer.id,
    instance: { ...state.listings[13].instance, family: standMixer },
  };
  state.listings[14] = {
    ...state.listings[14],
    familyId: studioMonitor.id,
    instance: { ...state.listings[14].instance, family: studioMonitor },
  };
  const saved = validateState(state);

  await page.goto("/");
  await completeFirstLaunch(page);
  await expect(
    page.getByRole("heading", { name: "Fırsat akışı" }),
  ).toBeVisible();
  await persistGame(page, saved);
  await page.reload();

  for (const [, assetName] of [
    [boardGame, "prd_board_game"],
    [portableRadio, "prd_portable_radio"],
    [fountainPen, "prd_fountain_pen"],
    [floorLamp, "prd_floor_lamp"],
    [gameCartridge, "prd_game_cartridge"],
    [perfumeSet, "prd_perfume_set"],
    [makeupSet, "prd_makeup_set"],
    [trenchCoat, "prd_trench_coat"],
    [leatherBag, "prd_leather_bag"],
    [vrHeadset, "prd_vr_headset"],
    [robotVacuum, "prd_robot_vacuum"],
    [foldPhone, "prd_fold_phone"],
    [racingWheel, "prd_racing_wheel"],
    [standMixer, "prd_stand_mixer"],
    [studioMonitor, "prd_studio_monitor"],
  ] as const) {
    const cards = page.locator(".market-card").filter({
      has: page.locator(`img[src*="${assetName}"]`),
    });
    await expect(cards).not.toHaveCount(0);
    const card = cards.first();
    const visual = card.locator(".product-visual");
    const image = visual.locator("img");
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
    .filter({
      has: page.locator('img[src*="prd_game_cartridge"]'),
    })
    .first()
    .scrollIntoViewIfNeeded();
  await page.screenshot({
    path: testInfo.outputPath("game-cartridge-asset-390.png"),
    animations: "disabled",
  });
  await page.getByRole("button", { name: "Moda/Bakım", exact: true }).click();
  expect(await page.locator(".market-card").count()).toBeGreaterThanOrEqual(4);
  await page.screenshot({
    path: testInfo.outputPath("fashion-care-assets-390.png"),
    fullPage: true,
    animations: "disabled",
  });
});

test("secondary expansion artwork loads without category fallbacks", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const state = initialState(Date.now(), "SANDBOX");
  const dacAmp = familyById("dac_amp");
  const cassettePlayer = familyById("cassette_player");
  const eReader = familyById("e_reader");
  const mobileProjector = familyById("mobile_projector");
  const monitor = familyById("monitor");
  const miniPc = familyById("mini_pc");
  const mechanicalKeyboard = familyById("mechanical_keyboard");
  const instantCamera = familyById("instant_camera");
  const tripod = familyById("tripod");
  const cameraFlash = familyById("camera_flash");
  const actionCamera = familyById("action_camera");
  const vintageLighter = familyById("vintage_lighter");
  const sideTable = familyById("side_table");
  const ruggedPhone = familyById("rugged_phone");
  const gamingKeyboard = familyById("gaming_keyboard");
  if (
    !dacAmp ||
    !cassettePlayer ||
    !eReader ||
    !mobileProjector ||
    !monitor ||
    !miniPc ||
    !mechanicalKeyboard ||
    !instantCamera ||
    !tripod ||
    !cameraFlash ||
    !actionCamera ||
    !vintageLighter ||
    !sideTable ||
    !ruggedPhone ||
    !gamingKeyboard
  ) {
    throw new Error("Expanded asset family is missing");
  }
  for (const [index, family] of [
    dacAmp,
    cassettePlayer,
    eReader,
    mobileProjector,
    monitor,
    miniPc,
    mechanicalKeyboard,
    instantCamera,
    tripod,
    cameraFlash,
    actionCamera,
    vintageLighter,
    sideTable,
    ruggedPhone,
    gamingKeyboard,
  ].entries()) {
    state.listings[index] = {
      ...state.listings[index],
      familyId: family.id,
      instance: { ...state.listings[index].instance, family },
    };
  }

  await page.goto("/");
  await completeFirstLaunch(page);
  await persistGame(page, validateState(state));
  await page.reload();

  for (const [, assetName] of [
    [dacAmp, "prd_dac_amp"],
    [cassettePlayer, "prd_cassette_player"],
    [eReader, "prd_e_reader"],
    [mobileProjector, "prd_mobile_projector"],
    [monitor, "prd_monitor"],
    [miniPc, "prd_mini_pc"],
    [mechanicalKeyboard, "prd_mechanical_keyboard"],
    [instantCamera, "prd_instant_camera"],
    [tripod, "prd_tripod"],
    [cameraFlash, "prd_camera_flash"],
    [actionCamera, "prd_action_camera"],
    [vintageLighter, "prd_vintage_lighter"],
    [sideTable, "prd_side_table"],
    [ruggedPhone, "prd_rugged_phone"],
    [gamingKeyboard, "prd_gaming_keyboard"],
  ] as const) {
    const cards = page.locator(".market-card").filter({
      has: page.locator(`img[src*="${assetName}"]`),
    });
    await expect(cards).not.toHaveCount(0);
    const card = cards.first();
    const visual = card.locator(".product-visual");
    const image = visual.locator("img");
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
});

test("final expansion artwork loads without category fallbacks", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const state = initialState(Date.now(), "SANDBOX");
  const rows = [
    ["bass_guitar", "prd_bass_guitar"],
    ["audio_interface", "prd_audio_interface"],
    ["drum_machine", "prd_drum_machine"],
    ["violin", "prd_violin"],
    ["graphics_tablet", "prd_graphics_tablet"],
    ["router", "prd_router"],
  ] as const;
  const families = rows.map(([familyId]) => familyById(familyId));
  if (families.some((family) => !family)) {
    throw new Error("Final asset family is missing");
  }
  for (const [index, family] of families.entries()) {
    if (!family) continue;
    state.listings[index] = {
      ...state.listings[index],
      familyId: family.id,
      instance: { ...state.listings[index].instance, family },
    };
  }

  await page.goto("/");
  await completeFirstLaunch(page);
  await persistGame(page, validateState(state));
  await page.reload();

  for (const [, assetName] of rows) {
    const cards = page.locator(".market-card").filter({
      has: page.locator(`img[src*="${assetName}"]`),
    });
    await expect(cards).not.toHaveCount(0);
    const card = cards.first();
    const visual = card.locator(".product-visual");
    const image = visual.locator("img");
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
});
