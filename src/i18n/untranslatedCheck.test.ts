import { describe, expect, it } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { translations } from "./translations";
import { extendedTranslations } from "./extendedTranslations";

describe("i18n completeness audit", () => {
  it("has translations for every key used across the application", () => {
    const allTranslations: Record<string, Record<string, string>> = {
      tr: { ...translations.tr, ...extendedTranslations.tr },
      en: { ...translations.en, ...extendedTranslations.en },
      de: { ...translations.de, ...extendedTranslations.de },
      es: { ...translations.es, ...extendedTranslations.es },
    };

    function getFiles(dir: string): string[] {
      let results: string[] = [];
      const list = fs.readdirSync(dir);
      list.forEach((file) => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
          results = results.concat(getFiles(fullPath));
        } else if (fullPath.endsWith(".ts") || fullPath.endsWith(".tsx")) {
          results.push(fullPath);
        }
      });
      return results;
    }

    const files = getFiles("src");
    const missingKeys = new Map<string, string[]>();

    const literalRegex = /\bt\(\s*["']([^"']+)["']/g;
    const dotKeyRegex = /["']([a-zA-Z0-9_-]+\.[a-zA-Z0-9_.-]+)["']/g;

    files.forEach((f) => {
      if (f.includes("i18n") || f.includes(".test.")) return;
      const content = fs.readFileSync(f, "utf8");

      let match;
      while ((match = literalRegex.exec(content)) !== null) {
        const k = match[1];
        if (!allTranslations.tr[k]) {
          if (!missingKeys.has(k)) missingKeys.set(k, []);
          missingKeys.get(k)!.push(f);
        }
      }

      while ((match = dotKeyRegex.exec(content)) !== null) {
        const k = match[1];
        if (
          k.endsWith(".ts") ||
          k.endsWith(".tsx") ||
          k.endsWith(".css") ||
          k.endsWith(".js") ||
          k.endsWith(".webp") ||
          k.endsWith(".png") ||
          k.endsWith(".json") ||
          k.startsWith("0.") ||
          k.startsWith("1.") ||
          k.startsWith("v1.")
        ) {
          continue;
        }
        if (
          k.includes("evidence.") ||
          k.includes("ownership.") ||
          k.includes("clock.") ||
          k.includes("journey.") ||
          k.includes("portfolio.") ||
          k.includes("market.") ||
          k.includes("notice.") ||
          k.includes("sheet.") ||
          k.includes("sellerType.") ||
          k.includes("buyer.") ||
          k.includes("common.") ||
          k.includes("showcase.") ||
          k.includes("specialization.") ||
          k.includes("missions.")
        ) {
          if (!allTranslations.tr[k]) {
            if (!missingKeys.has(k)) missingKeys.set(k, []);
            missingKeys.get(k)!.push(f);
          }
        }
      }
    });

    const report: string[] = [];
    for (const [k, flist] of missingKeys.entries()) {
      report.push(`Missing key: "${k}" in ${[...new Set(flist)].join(", ")}`);
    }

    console.log("Missing keys report:\n" + report.join("\n"));
    expect(report).toEqual([]);
  });
});
