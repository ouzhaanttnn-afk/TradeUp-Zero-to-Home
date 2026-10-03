import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

// This checks TradeUp's generated web configuration, not vendor SDK internals.
export function assertReviewAdConfig(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) assertReviewAdConfig(path);
    else if (
      /\.(js|html|json)$/.test(entry.name) &&
      readFileSync(path, "utf8").includes("ca-app-pub-3940256099942544")
    ) {
      throw new Error(
        `Official demo ad identity in review web payload: ${entry.name}`,
      );
    }
  }
}

if (process.argv[1]?.endsWith("check-review-ad-config.mjs")) {
  assertReviewAdConfig(resolve("dist"));
  console.log("Review web payload contains no demo ad configuration.");
}
