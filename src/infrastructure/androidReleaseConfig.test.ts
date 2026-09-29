import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("Android closed-test release safety", () => {
  it("uses TradeUp's identity and explicit versioning without embedded signing secrets", () => {
    const gradle = read("android/app/build.gradle");
    expect(gradle).toContain('applicationId "com.tradeup.zerotohome"');
    expect(gradle).toContain('versionName "1.0.2"');
    expect(gradle).toContain("versionCode androidVersionCode.toInteger()");
    expect(gradle).toContain("System.getenv('TRADEUP_ANDROID_UPLOAD_STORE_PASSWORD')");
  });

  it("prevents analytics initialization and unsafe device transfer by default", () => {
    const manifest = read("android/app/src/main/AndroidManifest.xml");
    expect(manifest).toContain('android:allowBackup="false"');
    expect(manifest).toContain('android:usesCleartextTraffic="false"');
    expect(manifest).toContain('android:dataExtractionRules="@xml/data_extraction_rules"');
    expect(manifest).toMatch(/name="firebase_analytics_collection_deactivated"\s+android:value="true"/);
    const rules = read("android/app/src/main/res/xml/data_extraction_rules.xml");
    for (const mode of ["cloud-backup", "device-transfer"]) {
      const section = rules.split(`<${mode}>`)[1].split(`</${mode}>`)[0];
      for (const domain of ["root", "file", "database", "sharedpref", "external"]) {
        expect(section).toContain(`<exclude domain="${domain}" path="."`);
      }
    }
  });

  it("launches the existing TradeUp art instead of the Capacitor template", () => {
    const theme = read("android/app/src/main/res/values/styles.xml");
    expect(theme).not.toContain("@drawable/splash");
    expect(theme).toContain("@mipmap/ic_launcher_foreground");
    expect(theme).toContain('name="windowSplashScreenBackground">@color/tradeup_background');
    expect(read("android/app/src/main/java/com/tradeup/zerotohome/MainActivity.java"))
      .toContain("SplashScreen.installSplashScreen(this)");
  });

  it("keeps closed-test advertising isolated from production and Apple uploads", () => {
    const workflow = read(".github/workflows/android-aab.yml");
    expect(workflow).toContain("VITE_ADMOB_PRODUCTION_ENABLED: 'false'");
    expect(workflow).toContain("ca-app-pub-3940256099942544~3347511713");
    expect(workflow).not.toContain("cap:sync:ios");
    expect(workflow).toContain(":app:lintRelease");
    expect(workflow).toContain(":app:connectedDebugAndroidTest");
  });
});
