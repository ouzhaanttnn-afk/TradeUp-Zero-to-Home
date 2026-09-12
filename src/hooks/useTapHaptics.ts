import { useEffect } from "react";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { useGameStore } from "../stores/gameStore";

// General button taps (navigation, toggles, form submits, ...) get a light
// haptic tick so the whole app feels responsive on-device, independent of
// the stronger success/warning haptics tied to specific economic outcomes.
export function useTapHaptics() {
  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!useGameStore.getState().game.accessibility.hapticsEnabled) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (!target.closest('button, [role="button"], select')) return;
      void Haptics.impact({ style: ImpactStyle.Light }).catch(() => undefined);
    };
    document.addEventListener("pointerdown", handlePointerDown, {
      capture: true,
    });
    return () =>
      document.removeEventListener("pointerdown", handlePointerDown, {
        capture: true,
      });
  }, []);
}
