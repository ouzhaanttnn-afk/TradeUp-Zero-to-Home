import { stat } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import assetManifest from "./assets/manifest/assetManifest.json";

describe("product asset delivery budget", () => {
  it("ships every dedicated product as a compact WebP", async () => {
    const manifestSources = assetManifest.assets.map((asset) => asset.source);
    expect(manifestSources).toHaveLength(153);
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
});
