import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("iOS release device contract", () => {
  it("ships the portrait 320–430 px experience as iPhone-only", () => {
    const project = readFileSync(
      new URL("../ios/App/App.xcodeproj/project.pbxproj", import.meta.url),
      "utf8",
    );
    const info = readFileSync(
      new URL("../ios/App/App/Info.plist", import.meta.url),
      "utf8",
    );

    expect(project).not.toContain('TARGETED_DEVICE_FAMILY = "1,2";');
    expect(project.match(/TARGETED_DEVICE_FAMILY = 1;/g)).toHaveLength(2);
    expect(info).not.toContain("UISupportedInterfaceOrientations~ipad");
  });
});
