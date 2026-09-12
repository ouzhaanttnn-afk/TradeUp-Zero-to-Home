import { stat } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import assetManifest from "./assets/manifest/assetManifest.json";

describe("product asset delivery budget", () => {
  it("ships every dedicated product as a compact WebP", async () => {
    const manifestSources = assetManifest.assets.map((asset) => asset.source);
    expect(manifestSources).toHaveLength(185);
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
});
