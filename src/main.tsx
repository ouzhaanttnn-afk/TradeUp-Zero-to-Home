import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Capacitor, SystemBars, SystemBarsStyle } from "@capacitor/core";
import "./index.css";
import App from "./App.tsx";
import themeSurfacesUrl from "./theme-surfaces.css?url";
import { createAdMobAdapters } from "./infrastructure/admob";
import { unavailableBillingAdapter } from "./infrastructure/monetization";
import { createIosBillingAdapter } from "./infrastructure/nativeBilling";
import { NativePurchases } from "@capgo/native-purchases";
import { useGameStore } from "./stores/gameStore";
import { startFirebaseAnalytics } from "./infrastructure/firebaseAnalytics";
import { configureMonetizationAdapters } from "./services/monetization";

// Keep cosmetic themes separate from the core stylesheet's delivery budget.
// The URL is a built asset, so the offline service worker precaches it too.
const themeSurfaces = document.createElement("link");
themeSurfaces.rel = "stylesheet";
themeSurfaces.href = themeSurfacesUrl;
document.head.append(themeSurfaces);

if (Capacitor.isNativePlatform()) {
  if (Capacitor.getPlatform() === "android") {
    // TradeUp always has dark surfaces, even when the device uses a light theme.
    void SystemBars.setStyle({ style: SystemBarsStyle.Dark }).catch(() => undefined);
  }
  startFirebaseAnalytics(useGameStore);
  const admob = createAdMobAdapters();
  configureMonetizationAdapters({
    billing:
      Capacitor.getPlatform() === "ios"
        ? createIosBillingAdapter()
        : unavailableBillingAdapter,
    consent: admob.consent,
    rewarded: admob.rewarded,
    showTradeInterstitial: admob.showTradeInterstitial,
  });
  if (Capacitor.getPlatform() === "ios") {
    void NativePurchases.addListener("transactionUpdated", () => {
      void useGameStore.getState().syncStoreEntitlements();
    }).catch(() => undefined);
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if ("serviceWorker" in navigator && import.meta.env.PROD)
  void navigator.serviceWorker.register("/sw.js").catch(() => {
    // Restricted storage must not prevent online gameplay.
  });
