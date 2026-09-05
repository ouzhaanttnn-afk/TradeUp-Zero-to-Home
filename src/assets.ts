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
  prd_chair: desk,
  prd_coffee: desk,
  prd_lamp: desk,
  prd_handheld: consoleImg,
  prd_controller: consoleImg,
  prd_game_collection: consoleImg,
  prd_keyboard: guitar,
  prd_microphone: guitar,
  prd_pedal: guitar,
  prd_compact_phone: phone,
  prd_tablet: phone,
  prd_smartwatch: watch,
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
