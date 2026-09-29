import { expect, test, type Page } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { HOME_OPTIONS } from "../src/content/homes";
import { initialState, market as createMarket, validateState } from "../src/game";
import type { GameState } from "../src/domain/models";
import { completeFirstLaunch } from "./helpers";

test.skip(
  process.env.STORE_ASSETS !== "1",
  "Store assets are generated only by pnpm assets:store:ios",
);

const outputDirectory = path.resolve("store-assets/ios/iphone-6.5");

async function writeGeneratedAsset(targetPath: string, image: Buffer) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await writeFile(targetPath, image);
      return;
    } catch (error) {
      if (attempt === 4) throw error;
      // Windows scanners occasionally hold an existing screenshot briefly.
      await new Promise((resolve) => setTimeout(resolve, 150 * (attempt + 1)));
    }
  }
}

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
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    document.querySelector("main")?.scrollTo(0, 0);
  });
  await page.screenshot({ path: temporaryPath, animations: "disabled" });
  const targetPath = path.join(outputDirectory, `${name}.png`);
  const image = await sharp(temporaryPath)
    .resize(1284, 2778, { fit: "fill" })
    .png({ compressionLevel: 9 })
    .toBuffer();
  const metadata = await sharp(image).metadata();
  expect([metadata.width, metadata.height]).toEqual([1284, 2778]);
  await writeGeneratedAsset(targetPath, image);
}

test("generate App Store screenshots for TradeUp", async ({
  page,
}, testInfo) => {
  await mkdir(outputDirectory, { recursive: true });
  await page.setViewportSize({ width: 428, height: 926 });
  const now = new Date("2026-09-12T09:30:00Z");
  await page.clock.install({ time: now });

  await page.goto("/");
  await page.getByLabel("Oyuncu adı").fill("Oyuncu");
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
    name: "Oyuncu",
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
  // Capture a reachable later-session market with varied arrivals, not the
  // same initial cohort repeated across most of the product page.
  const seenFamilies = new Set<string>();
  market.listings = Array.from({ length: 48 }, (_, index) =>
    createMarket(market.seed + index * 37, market.cashMinor, index, 0, 4),
  )
    .flat()
    .filter((listing) => {
      if (seenFamilies.has(listing.familyId)) return false;
      seenFamilies.add(listing.familyId);
      return true;
    })
    .slice(0, 16);
  await persistGame(page, market);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Fırsat akışı" }),
  ).toBeVisible();
  const marketArtwork = await page.locator(".market-grid img").evaluateAll(
    async (images) =>
      Promise.all(
        images.map(async (image) => {
          const artwork = image as HTMLImageElement;
          artwork.loading = "eager";
          await artwork.decode();
          return artwork.naturalWidth > 0;
        }),
      ),
  );
  expect(marketArtwork.length).toBeGreaterThanOrEqual(9);
  expect(marketArtwork.every(Boolean)).toBe(true);
  await capture(page, "02-canli-pazar", testInfo.outputPath("market.png"));

  // Browser renders are useful previews, but an iPad-sized browser viewport
  // does not represent the iPhone binary running in iPad compatibility mode.
  // Capture actual native iPad rendering before supplying iPad store media.
  await page.getByRole("button", { name: "Satın almalar & görünüm" }).click();
  await expect(page.getByText("TradeUp Premium", { exact: false })).toBeVisible();
  await expect(page.locator(".purchase-list article:visible")).toHaveCount(2);
  await capture(page, "06-premium-inceleme", testInfo.outputPath("premium.png"));
  await page.locator(".extra-purchases summary").click();
  await expect(page.locator(".purchase-list article:visible")).toHaveCount(6);
  await capture(page, "07-kozmetik-inceleme", testInfo.outputPath("cosmetics.png"));
  await page.getByRole("button", { name: "Kapat", exact: true }).click();

  await page.locator(".market-card").first().click();
  await expect(
    page.getByRole("group", { name: "Satın alma adımları" }),
  ).toBeVisible();
  await capture(page, "03-urunu-incele", testInfo.outputPath("detail.png"));
  await page
    .getByRole("group", { name: "Satın alma adımları" })
    .getByRole("button", { name: /^Hemen Satın Al/ })
    .click();
  await expect(
    page.getByRole("tab", { name: "Envanter", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await page.getByRole("button", { name: "Vitrine Ekle", exact: true }).click();
  await expect(page.getByText("1 / 3")).toBeVisible();
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
