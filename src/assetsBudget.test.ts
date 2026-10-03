import { stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import assetManifest from "./assets/manifest/assetManifest.json";
import sharp from "sharp";
import release110Content from "./content/release110.json" with { type: "json" };

describe("product asset delivery budget", () => {
  it("keeps every new object complete inside a transparent512 px canvas", async () => {
    for (const product of release110Content) {
      const { data, info } = await sharp(fileURLToPath(new URL(`./assets/products/prd_${product.id}.webp`, import.meta.url)))
        .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      expect([info.width, info.height, info.channels]).toEqual([512, 512, 4]);
      expect(data[3]).toBe(0);
      let visible = 0;
      for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) {
        if (data[(y * 512 + x) * 4 + 3] > 8) {
          visible++;
          if (x < 30 || x > 481 || y < 30 || y > 481) throw new Error(`Clipped art: ${product.id}`);
        }
      }
      expect(visible).toBeGreaterThan(15_000);
    }
  });
  it("ships every dedicated product as a compact WebP", async () => {
    const manifestSources = assetManifest.assets.map((asset) => asset.source);
    expect(manifestSources).toHaveLength(237);
    expect(manifestSources.every((source) => source.endsWith(".webp"))).toBe(
      true,
    );

    const sizes = await Promise.all(
      manifestSources.map(async (source) =>
        stat(new URL(`./assets/manifest/${source}`, import.meta.url)),
      ),
    );
    const totalBytes = sizes.reduce((total, item) => total + item.size, 0);
    const largestBytes = Math.max(...sizes.map((item) => item.size));

    expect(totalBytes).toBeLessThan(12 * 1024 * 1024);
    expect(largestBytes).toBeLessThan(160 * 1024);
  });

  it("keeps the project-owned atmosphere artwork mobile-sized", async () => {
    const atmosphereFiles = [
      "./assets/brand/ui_market_atmosphere_v1.webp",
      "./assets/brand/ui_market_table_atmosphere_v2.webp",
      "./assets/brand/ui_journey_atmosphere_v1.webp",
    ];
    const sizes = await Promise.all(
      atmosphereFiles.map((source) => stat(new URL(source, import.meta.url))),
    );

    expect(Math.max(...sizes.map((item) => item.size))).toBeLessThan(96 * 1024);
    expect(sizes.reduce((total, item) => total + item.size, 0)).toBeLessThan(
      192 * 1024,
    );
  });

  it("keeps all five home listing scenes mobile-sized", async () => {
    const homeFiles = [
      "./assets/homes/home_garden_edge.webp",
      "./assets/homes/home_city_residence.webp",
      "./assets/homes/home_terrace_duplex.webp",
      "./assets/homes/home_stone_courtyard.webp",
      "./assets/homes/home_coastal_villa.webp",
    ];
    const sizes = await Promise.all(
      homeFiles.map((source) => stat(new URL(source, import.meta.url))),
    );
    expect(Math.max(...sizes.map((item) => item.size))).toBeLessThan(
      140 * 1024,
    );
    expect(sizes.reduce((total, item) => total + item.size, 0)).toBeLessThan(
      600 * 1024,
    );
  });
});
