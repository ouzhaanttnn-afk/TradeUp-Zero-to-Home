import type { CapacitorConfig } from "@capacitor/cli";
const config: CapacitorConfig = {
  appId: "com.tradeup.zerotohome",
  appName: "TradeUp: Zero to Home",
  webDir: "dist",
  backgroundColor: "#07100d",
  server: { androidScheme: "https" },
  ios: {
    backgroundColor: "#050a08",
    contentInset: "never",
    scrollEnabled: true,
    preferredContentMode: "mobile",
    allowsLinkPreview: false,
  },
  experimental: {
    ios: {
      spm: {
        swiftToolsVersion: "6.1",
        packageOptions: {
          "@capacitor-firebase/analytics": { symlink: process.platform !== "win32" },
        },
        packageTraits: {
          "@capacitor-firebase/analytics": ["AnalyticsWithoutAdIdSupport"],
        },
      },
    },
  },
};
export default config;
