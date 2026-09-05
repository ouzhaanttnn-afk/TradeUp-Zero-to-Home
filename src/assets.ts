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
import camera from "./assets/products/prd_camera.png";
import laptop from "./assets/products/prd_laptop.png";
import vrHeadset from "./assets/products/prd_vr_headset.png";
import boardGame from "./assets/products/prd_board_game.png";
import portableRadio from "./assets/products/prd_portable_radio.png";
import fountainPen from "./assets/products/prd_fountain_pen.png";
import floorLamp from "./assets/products/prd_floor_lamp.png";
import gameCartridge from "./assets/products/prd_game_cartridge.png";
import perfumeSet from "./assets/products/prd_perfume_set.png";
import makeupSet from "./assets/products/prd_makeup_set.png";
import trenchCoat from "./assets/products/prd_trench_coat.png";
import leatherBag from "./assets/products/prd_leather_bag.png";

const dedicatedAssets: Record<string, string> = {
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
  prd_camera: camera,
  prd_laptop: laptop,
  prd_vr_headset: vrHeadset,
  prd_board_game: boardGame,
  prd_portable_radio: portableRadio,
  prd_fountain_pen: fountainPen,
  prd_floor_lamp: floorLamp,
  prd_game_cartridge: gameCartridge,
  prd_perfume_set: perfumeSet,
  prd_makeup_set: makeupSet,
  prd_trench_coat: trenchCoat,
  prd_leather_bag: leatherBag,
};

const fallbackSvg = (category: string, symbol: string, color: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 384"><rect width="512" height="384" rx="48" fill="#10231b"/><circle cx="256" cy="192" r="128" fill="${color}" opacity=".16"/><text x="256" y="215" text-anchor="middle" font-family="system-ui,sans-serif" font-size="112" font-weight="800" fill="${color}">${symbol}</text><text x="256" y="330" text-anchor="middle" font-family="system-ui,sans-serif" font-size="24" font-weight="700" fill="#8fa69b">${category}</text></svg>`)}`;

const categoryFallbacks: Record<string, string> = {
  "Küçük Eşya": fallbackSvg("Küçük Eşya", "◇", "#f2c66d"),
  Ses: fallbackSvg("Ses", "◉", "#6ddba0"),
  "Ev/Yaşam": fallbackSvg("Ev/Yaşam", "⌂", "#e7b879"),
  Oyun: fallbackSvg("Oyun", "✣", "#80b8ff"),
  Müzik: fallbackSvg("Müzik", "♪", "#d59cff"),
  Telefon: fallbackSvg("Telefon", "▯", "#75d5d0"),
  Bilgisayar: fallbackSvg("Bilgisayar", "▣", "#8db8ff"),
  Fotoğraf: fallbackSvg("Fotoğraf", "◫", "#ff9c83"),
  "Moda/Bakım": fallbackSvg("Moda/Bakım", "✦", "#d8b27c"),
};

export const assetFor = (key: string, category?: string) =>
  dedicatedAssets[key] ??
  (category ? categoryFallbacks[category] : undefined) ??
  notebook;

export const fallbackAssetFor = (category: string) =>
  categoryFallbacks[category] ?? categoryFallbacks["Küçük Eşya"];

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
