import type { AppPlugin } from "@capacitor/app";

// Never use WebView history for React-state sheets. Reuse their accessible
// Escape dismissal, then return to the market, then background (not kill) the app.
export function bindAndroidBack(
  port: Pick<AppPlugin, "addListener" | "minimizeApp">,
  dismissOverlay: () => boolean,
  returnToMarket: () => boolean,
) {
  let disposed = false;
  const listener = port.addListener("backButton", () => {
    if (disposed || dismissOverlay() || returnToMarket()) return;
    void port.minimizeApp().catch(() => undefined);
  });
  void listener.catch(() => undefined);
  // React StrictMode may unmount before native registration resolves.
  return () => {
    disposed = true;
    void listener.then((handle) => handle.remove()).catch(() => undefined);
  };
}
