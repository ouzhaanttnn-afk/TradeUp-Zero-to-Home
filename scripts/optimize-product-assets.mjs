import { readdir } from "node:fs/promises";
import { basename, extname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const productDirectory = new URL("../src/assets/products/", import.meta.url);
const files = (await readdir(productDirectory))
  .filter((file) => extname(file).toLowerCase() === ".png")
  .sort();

if (files.length === 0) {
  throw new Error("No product PNG sources were found.");
}

const results = [];
for (const file of files) {
  const source = new URL(file, productDirectory);
  const outputName = `${basename(file, ".png")}.webp`;
  const output = new URL(outputName, productDirectory);
  const info = await sharp(fileURLToPath(source))
    .webp({
      quality: 88,
      alphaQuality: 100,
      effort: 4,
      smartSubsample: true,
    })
    .toFile(fileURLToPath(output));
  results.push({ file: outputName, bytes: info.size });
}

const totalBytes = results.reduce((total, item) => total + item.bytes, 0);
const largest = results.reduce((current, item) =>
  item.bytes > current.bytes ? item : current,
);

console.log(
  `Optimized ${results.length} product assets: ${(totalBytes / 1024 / 1024).toFixed(2)} MB total; largest ${largest.file} (${(largest.bytes / 1024).toFixed(1)} KB).`,
);
