import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

export const shouldPrecacheBuildAsset = (path: string) =>
  !path.endsWith(".map") && !/\.(?:avif|jpe?g|png|webp)$/i.test(path);

export const avatarPrecachePaths = [
  "/assets/avatars/pazar-kasifi.webp",
  "/assets/avatars/atolye-ustasi.webp",
  "/assets/avatars/koleksiyon-uzmani.webp",
  "/assets/avatars/neon-araci.webp",
  "/assets/avatars/altin-vizyoner.webp",
  "/assets/avatars/gece-analisti.webp",
] as const;

export const deliveryBudgets = {
  entryJavaScriptBytes: 400 * 1024,
  chunkJavaScriptBytes: 180 * 1024,
  stylesheetBytes: 100 * 1024,
} as const;

export const deliveryBudgetViolation = (
  fileName: string,
  bytes: number,
  entry = false,
) => {
  const limit = fileName.endsWith(".css")
    ? deliveryBudgets.stylesheetBytes
    : fileName.endsWith(".js")
      ? entry
        ? deliveryBudgets.entryJavaScriptBytes
        : deliveryBudgets.chunkJavaScriptBytes
      : undefined;
  if (limit === undefined || bytes <= limit) return undefined;
  return `${fileName} is ${bytes} bytes; delivery budget is ${limit} bytes`;
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: "tradeup-delivery-budget",
      apply: "build",
      generateBundle(_options, bundle) {
        for (const output of Object.values(bundle)) {
          const bytes =
            output.type === "chunk"
              ? Buffer.byteLength(output.code)
              : typeof output.source === "string"
                ? Buffer.byteLength(output.source)
                : output.source.byteLength;
          const violation = deliveryBudgetViolation(
            output.fileName,
            bytes,
            output.type === "chunk" && output.isEntry,
          );
          if (violation) this.error(violation);
        }
      },
    },
    {
      name: "tradeup-offline-precache",
      apply: "build",
      generateBundle(_options, bundle) {
        const template = readFileSync(
          new URL("./src/infrastructure/serviceWorker.js", import.meta.url),
          "utf8",
        );
        const paths = [
          "/",
          "/manifest.webmanifest",
          "/icon-192.png",
          "/icon-512.png",
          "/favicon.svg",
          ...avatarPrecachePaths,
          ...Object.keys(bundle)
            .filter(shouldPrecacheBuildAsset)
            .map((path) => `/${path}`),
        ].sort();
        const revision = createHash("sha256")
          .update(template + JSON.stringify(paths))
          .digest("hex")
          .slice(0, 16);
        const source = template
          .replace('"tradeup-v3"', JSON.stringify(`tradeup-${revision}`))
          .replace('["/", "/manifest.webmanifest"]', JSON.stringify(paths));
        this.emitFile({ type: "asset", fileName: "sw.js", source });
      },
    },
  ],
});
