import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

// Mechanical format/framing normalization of approved built-in imagegen originals.
// Supply the two original directories; no credentials or absolute host paths stored.
const [middleDirectory, advancedDirectory] = process.argv.slice(2);
if (!middleDirectory || !advancedDirectory)
  throw new Error("Supply both generated-image directories.");
const groups = [
  [
    middleDirectory,
    [
      ["smart_lock", "ffbfcb55-2277-4208-aea7-66bfe804b29a"],
      ["rotary_hammer", "ba1fe103-3e2b-49de-8659-76f666fb707b"],
      ["spot_cleaner", "9f841421-f396-41f4-9dbf-9bd607daa1cf"],
      ["document_scanner", "19d8c60a-a2ff-48cf-99f3-bb6843aaedf3"],
      ["guitar_amplifier", "af2b1748-536d-4adc-ae51-8d9ac976b302"],
      ["sewing_overlocker", "60dae71f-24ad-4347-842b-c9b639a3a1fe"],
      ["bench_drill", "63cb84da-393d-4b55-a21e-4942e3cd01f9"],
      ["resin_printer", "cce1bbd8-bfd5-470f-990b-0de7369e3e90"],
      ["studio_subwoofer", "2fd2cb80-77ec-4ace-a761-5efd37f4382c"],
      ["digital_oscilloscope", "e2e39080-269e-4eba-b635-e17b1b0ff4e8"],
      ["short_throw_projector", "c2159bf0-a2a9-4868-834a-4250049f791c"],
      ["magnetic_exercise_bike", "de4287b5-0207-44c4-aef2-8426d116f70a"],
    ],
  ],
  [
    advancedDirectory,
    [
      ["commercial_coffee_grinder", "a39fc667-8a47-467e-9e40-6076e768762d"],
      ["commercial_deck_oven", "d0102920-4f8c-4308-ae3e-f5ee8045f9ab"],
      ["dough_sheeter", "8768f1fe-af13-4692-941c-26c84cdab7b6"],
      ["industrial_dust_extractor", "e19af959-4ab8-49e8-aa03-b133b56cf536"],
      ["rack_audio_power_amp", "d4ea83c3-5ed5-490f-8354-0891a4b6ffcd"],
      ["cine_follow_focus_kit", "47c9025d-01a3-43b5-b436-2ddfa9d3323e"],
      ["professional_band_saw", "412a2b0b-de38-4435-9b90-92446884f485"],
      ["large_format_printer", "07043833-8902-4d5e-8449-763a0a81d73e"],
      ["enterprise_network_switch", "24453d18-bb8f-42f8-9bb0-a11e29d63607"],
      ["industrial_uv_printer", "07c22302-e3a2-4cc2-a5ed-680ff713e3b9"],
      ["modular_synth_rack", "9bf903aa-6e79-4690-8813-81b9f2750b70"],
      ["professional_laminator", "fc7e0bc8-087e-4cad-815f-851a50fd8fa2"],
    ],
  ],
];
const products = JSON.parse(
  await readFile(
    new URL("../src/content/release110.json", import.meta.url),
    "utf8",
  ),
);
if (groups.flatMap(([, entries]) => entries).length !== products.length)
  throw new Error("Incomplete release asset mapping.");
for (const [directory, entries] of groups) {
  for (const [id, sourceId] of entries) {
    if (!products.some((product) => product.id === id))
      throw new Error(`Unknown product ${id}`);
    const source = resolve(directory, `exec-${sourceId}.png`);
    const { data, info } = await sharp(source)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    let left = info.width,
      top = info.height,
      right = -1,
      bottom = -1;
    for (let y = 0; y < info.height; y++)
      for (let x = 0; x < info.width; x++) {
        if (data[(y * info.width + x) * 4 + 3] > 8) {
          left = Math.min(left, x);
          right = Math.max(right, x);
          top = Math.min(top, y);
          bottom = Math.max(bottom, y);
        }
      }
    if (
      right < left ||
      left === 0 ||
      top === 0 ||
      right === info.width - 1 ||
      bottom === info.height - 1
    ) {
      throw new Error(`Empty or clipped source: ${id}`);
    }
    const output = new URL(
      `../src/assets/products/prd_${id}.webp`,
      import.meta.url,
    );
    const result = await sharp(source)
      .extract({ left, top, width: right - left + 1, height: bottom - top + 1 })
      .resize(448, 448, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .extend({
        top: 32,
        bottom: 32,
        left: 32,
        right: 32,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .webp({ quality: 88, alphaQuality: 100, effort: 4, smartSubsample: true })
      .toFile(fileURLToPath(output));
    console.log(
      `${id}: ${result.width}x${result.height}, ${result.size} bytes`,
    );
  }
}
