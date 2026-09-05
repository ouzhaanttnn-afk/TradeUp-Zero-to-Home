import { expect, test } from "@playwright/test";

test("first install caches game resources and preserves a sale across offline reload", async ({
  page,
  context,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Teklifi kabul et · ₺420" }),
  ).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  const cacheReport = await page.evaluate(async () => {
    const names = await caches.keys();
    return Promise.all(
      names.map(async (name) => ({
        name,
        urls: (await (await caches.open(name)).keys()).map(
          (request) => request.url,
        ),
      })),
    );
  });
  await testInfo.attach("cache-report", {
    body: JSON.stringify(cacheReport, null, 2),
    contentType: "application/json",
  });
  expect(
    cacheReport
      .flatMap((entry) => entry.urls)
      .some((url) => url.endsWith(".js")),
  ).toBe(true);
  await page.getByRole("button", { name: "Teklifi kabul et · ₺420" }).click();
  await expect(
    page.getByRole("region", { name: "Finans özeti" }),
  ).toContainText("₺420");
  const readSave = () =>
    page.evaluate(async () => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open("tradeup", 1);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      try {
        return await new Promise<{
          cashMinor: number;
          transactionJournal: unknown[];
        }>((resolve, reject) => {
          const request = db
            .transaction("game")
            .objectStore("game")
            .get("main");
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      } finally {
        db.close();
      }
    });
  await expect.poll(async () => (await readSave()).cashMinor).toBe(42_000);
  const before = await readSave();
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Fırsat akışı" }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Finans özeti" }),
  ).toContainText("₺420");
  expect((await readSave()).transactionJournal).toEqual(
    before.transactionJournal,
  );
  await page
    .getByRole("button", {
      name: /Kuzey Defteri, fiyat ₺120, kondisyon yüzde 55,.+İlan detaylarını aç/,
    })
    .click();
  await expect(
    page.getByRole("button", { name: "Benzer ilanlarla karşılaştır" }),
  ).toBeVisible();
  expect(
    await page
      .locator("img")
      .evaluateAll((images) =>
        images.every((image) => image.complete && image.naturalWidth > 0),
      ),
  ).toBe(true);
  expect(errors).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath("offline-mobile.png") });
});
