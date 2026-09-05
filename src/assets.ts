import notebook from "./assets/products/prd_notebook.png";
import headset from "./assets/products/prd_headset.png";
import watch from "./assets/products/prd_watch.png";
import consoleImg from "./assets/products/prd_console.png";
import guitar from "./assets/products/prd_guitar.png";
import phone from "./assets/products/prd_phone.png";
import assetManifest from "./assets/manifest/assetManifest.json";
import type { ItemInstance } from "./domain/models";
import vinyl from "./assets/products/prd_vinyl.png";
import book from "./assets/products/prd_book.png";
import sneaker from "./assets/products/prd_sneaker.png";
import speaker from "./assets/products/prd_speaker.png";
import turntable from "./assets/products/prd_turntable.png";
import recordPlayer from "./assets/products/prd_record_player.png";
import desk from "./assets/products/prd_desk.png";
import chair from "./assets/products/prd_chair.png";
import coffee from "./assets/products/prd_coffee.png";
import lamp from "./assets/products/prd_lamp.png";
import handheld from "./assets/products/prd_handheld.png";
import controller from "./assets/products/prd_controller.png";
import gameCollection from "./assets/products/prd_game_collection.png";
import keyboard from "./assets/products/prd_keyboard.png";
import microphone from "./assets/products/prd_microphone.png";
import pedal from "./assets/products/prd_pedal.png";
import compactPhone from "./assets/products/prd_compact_phone.png";
import tablet from "./assets/products/prd_tablet.png";
import smartwatch from "./assets/products/prd_smartwatch.png";
const manifest: Record<string, string> = {
  prd_notebook: notebook,
  prd_headset: headset,
  prd_watch: watch,
  prd_console: consoleImg,
  prd_guitar: guitar,
  prd_phone: phone,
  prd_vinyl: vinyl,
  prd_book: book,
  prd_sneaker: sneaker,
  prd_speaker: speaker,
  prd_turntable: turntable,
  prd_record_player: recordPlayer,
  prd_desk: desk,
  prd_chair: chair,
  prd_coffee: coffee,
  prd_lamp: lamp,
  prd_handheld: handheld,
  prd_controller: controller,
  prd_game_collection: gameCollection,
  prd_keyboard: keyboard,
  prd_microphone: microphone,
  prd_pedal: pedal,
  prd_compact_phone: compactPhone,
  prd_tablet: tablet,
  prd_smartwatch: smartwatch,
};
export const assetFor = (key: string) => manifest[key] ?? notebook;

const dedicatedAssetKeys = new Set(
  assetManifest.assets
    .filter((entry) => entry.dedicated)
    .map((entry) => entry.assetKey),
);

export const hasDedicatedAsset = (key: string) => dedicatedAssetKeys.has(key);
export const registeredAssetKeys = assetManifest.assets.map(
  (entry) => entry.assetKey,
);

export const visualTreatmentFor = (instance: ItemInstance) => ({
  conditionBand:
    instance.condition < 55
      ? ("worn" as const)
      : instance.condition < 80
        ? ("used" as const)
        : ("clean" as const),
  revealedDefect: instance.defects.some(
    (defect) => defect.present && defect.revealed,
  ),
  missingAccessory: !instance.accessoryComplete,
  verifiedEvidence: instance.evidence.some(
    (evidence) =>
      evidence.status === "VERIFIED" || evidence.status === "CHECKED",
  ),
  fallback: !hasDedicatedAsset(instance.family.assetKey),
});
