import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
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
          ...Object.keys(bundle)
            .filter((path) => !path.endsWith(".map"))
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
