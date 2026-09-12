import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { HOME_OPTIONS } from "../src/content/homes";
import { initialState, validateState } from "../src/game";
import type { GameState } from "../src/domain/models";
import { completeFirstLaunch } from "./helpers";

test.skip(
  process.env.STORE_ASSETS !== "1",
  "Store assets are generated only by pnpm assets:store:ios",
);

const outputDirectory = path.resolve("store-assets/ios/iphone-6.5");

async function persistGame(page: Page, state: GameState) {
  await page.evaluate(async (game) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("tradeup", 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction("game", "readwrite");
      transaction.objectStore("game").put(game, "main");
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    db.close();
  }, state);
}

async function capture(page: Page, name: string, temporaryPath: string) {
  await page.screenshot({ path: temporaryPath, animations: "disabled" });
  const targetPath = path.join(outputDirectory, `${name}.png`);
  await sharp(temporaryPath)
    .resize(1284, 2778, { fit: "fill" })
    .png({ compressionLevel: 9 })
    .toFile(targetPath);
  const metadata = await sharp(targetPath).metadata();
  expect([metadata.width, metadata.height]).toEqual([1284, 2778]);
}

test("generate App Store screenshots for TradeUp", async ({
  page,
}, testInfo) => {
  await mkdir(outputDirectory, { recursive: true });
  await page.setViewportSize({ width: 428, height: 926 });
  const now = new Date("2026-09-12T09:30:00Z");
  await page.clock.install({ time: now });

  await page.goto("/");
  await page.getByLabel("Oyuncu adı").fill("Alper");
  await page.getByRole("button", { name: /Pazar Kaşifi/ }).click();
  await capture(
    page,
    "01-kariyerini-baslat",
    testInfo.outputPath("onboarding.png"),
  );
  await page.getByRole("button", { name: "Kariyere başla" }).click();

  const market = validateState(initialState(now.getTime(), "SANDBOX"));
  market.profile = {
    ...market.profile,
    onboardingComplete: true,
    name: "Alper",
    avatarId: "pazar-kasifi",
  };
  market.accessibility.reducedMotion = true;
  market.cashMinor = 2_500_000;
  market.transactionJournal[0] = {
    ...market.transactionJournal[0],
    cashDeltaMinor: market.cashMinor,
  };
  market.monetization.marketScanCredits = 21;
  market.monetization.marketScanRefillAnchorWallMs = now.getTime();
  await persistGame(page, market);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Fırsat akışı" }),
  ).toBeVisible();
  await capture(page, "02-canli-pazar", testInfo.outputPath("market.png"));

  await page.locator(".market-card").first().click();
  await expect(
    page.getByRole("group", { name: "Satın alma adımları" }),
  ).toBeVisible();
  await capture(page, "03-urunu-incele", testInfo.outputPath("detail.png"));
  await page
    .getByRole("group", { name: "Satın alma adımları" })
    .getByRole("button", { name: /^Hemen al/ })
    .click();
  await expect(
    page.getByRole("tab", { name: "Envanter", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await capture(
    page,
    "04-portfoyunu-buyut",
    testInfo.outputPath("portfolio.png"),
  );

  const homeJourney = validateState(initialState(now.getTime(), "SANDBOX"));
  const homePrice = HOME_OPTIONS[0].priceMinor;
  homeJourney.profile = { ...market.profile };
  homeJourney.cashMinor = homePrice;
  homeJourney.gameTimeMin = 180;
  homeJourney.transactionJournal[0] = {
    ...homeJourney.transactionJournal[0],
    cashDeltaMinor: homePrice,
  };
  homeJourney.home = {
    unlocked: true,
    searchStartedAtGameMin: 0,
    purchased: false,
    progressMilestones: [25, 50, 75, 90],
  };
  homeJourney.career = [
    {
      id: "career:first-sale:store",
      type: "FIRST_SALE",
      group: "FIRSTS",
      atGameMin: 10,
      label: "İlk satışını tamamladın",
      amountMinor: 18_000,
    },
    {
      id: "career:best-flip:store",
      type: "BEST_FLIP_UPDATED",
      group: "RECORDS",
      atGameMin: 20,
      label: "Yeni en iyi satışın",
      amountMinor: 72_000,
    },
  ];
  await persistGame(page, validateState(homeJourney));
  await page.reload();
  await completeFirstLaunch(page);
  await page.getByRole("button", { name: "Yolculuk", exact: true }).click();
  await expect(page.getByText("2 ev bulundu")).toBeVisible();
  await capture(page, "05-evine-ulas", testInfo.outputPath("journey.png"));
});
