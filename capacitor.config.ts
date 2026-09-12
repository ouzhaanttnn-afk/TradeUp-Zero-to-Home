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
};
export default config;
