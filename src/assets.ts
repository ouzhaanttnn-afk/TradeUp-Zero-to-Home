import notebook from "./assets/products/prd_notebook.png";
import headset from "./assets/products/prd_headset.png";
import watch from "./assets/products/prd_watch.png";
import consoleImg from "./assets/products/prd_console.png";
import guitar from "./assets/products/prd_guitar.png";
import phone from "./assets/products/prd_phone.png";
import laptop from "./assets/products/prd_laptop.png";
import camera from "./assets/products/prd_camera.png";
import scooter from "./assets/products/prd_scooter.png";
const manifest: Record<string, string> = {
  prd_notebook: notebook,
  prd_headset: headset,
  prd_watch: watch,
  prd_console: consoleImg,
  prd_guitar: guitar,
  prd_phone: phone,
  prd_laptop: laptop,
  prd_camera: camera,
  prd_scooter: scooter,
};
export const assetFor = (key: string) => manifest[key] ?? notebook;
