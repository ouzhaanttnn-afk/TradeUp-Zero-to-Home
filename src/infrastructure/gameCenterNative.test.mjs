import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path) =>
  readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
describe("Game Center native wiring (static, not an iOS runtime test)", () => {
  it("registers the same plugin in both iOS launch paths and compiles its source into the target", () => {
    const swift = read("ios/App/App/TradeUpGameCenter.swift");
    expect(swift).toContain('jsName = "TradeUpGameCenter"');
    expect(swift).toContain(
      "registerPluginInstance(TradeUpGameCenterPlugin())",
    );
    expect(read("ios/App/App/SceneDelegate.swift")).toContain(
      "rootViewController = TradeUpBridgeViewController()",
    );
    expect(read("ios/App/App/Base.lproj/Main.storyboard")).toContain(
      'customClass="TradeUpBridgeViewController"',
    );
    expect(read("ios/App/App.xcodeproj/project.pbxproj")).toContain(
      "TradeUpGameCenter.swift in Sources",
    );
    expect(read("ios/App/App/App.entitlements")).toContain(
      "com.apple.developer.game-center",
    );
  });
  it("restricts native scores, checks account binding, fetches only 100 and shares without files", () => {
    const swift = read("ios/App/App/TradeUpGameCenter.swift");
    expect(swift).toContain("boardIDs.contains(id)");
    expect(swift).toContain(
      'call.getString("playerId") == GKLocalPlayer.local.gamePlayerID',
    );
    expect(swift).toContain("NSRange(location: 1, length: 100)");
    expect(swift).toContain("UIActivityViewController(activityItems: [image]");
    expect(swift).not.toContain("ATTrackingManager");
    expect(swift).not.toContain("write(to:");
  });
});
