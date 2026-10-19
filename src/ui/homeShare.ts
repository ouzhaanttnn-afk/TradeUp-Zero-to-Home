import { Capacitor, registerPlugin } from "@capacitor/core";
import type { FirstHomeSummary } from "../domain/models";
import { homeOptionById } from "../content/homes";
import { homeAssets } from "./homeAssets";
import { money } from "../game";
import { assetFor } from "../assets";
import { avatarById } from "../content/avatars";
import type { AvatarId } from "../domain/models";
import { localizeHome, type Language } from "../i18n";

const nativeShare = registerPlugin<{
  shareImage(options: { png: string }): Promise<{ completed: boolean }>;
}>("TradeUpGameCenter");
const loadImage = (source?: string): Promise<HTMLImageElement | null> =>
  new Promise((resolve) => {
    if (!source) {
      resolve(null);
      return;
    }
    const image = new Image();
    const timeout = setTimeout(() => {
      image.onload = image.onerror = null;
      resolve(null);
    }, 5000);
    image.onload = () => {
      clearTimeout(timeout);
      resolve(image);
    };
    image.onerror = () => {
      clearTimeout(timeout);
      resolve(null);
    };
    image.src = source;
  });

export async function createHomeCard(
  summary: FirstHomeSummary,
  lang: Language,
  avatarId: AvatarId,
  name?: string,
): Promise<Blob> {
  const tr = lang === "tr";
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("CANVAS_UNAVAILABLE");
  const home = homeOptionById(summary.homeId);
  const memories = [summary.firstProfitableSale, summary.bestSale].filter(
    (sale, index, all) =>
      sale &&
      all.findIndex((entry) => entry?.transactionId === sale.transactionId) ===
        index,
  );
  const [house, avatar, ...products] = await Promise.all([
    loadImage(home ? homeAssets[home.assetKey] : undefined),
    loadImage(avatarById(avatarId).image),
    ...memories.map((sale) =>
      loadImage(sale ? assetFor(sale.assetKey, sale.categoryId) : undefined),
    ),
  ]);
  const gradient = ctx.createLinearGradient(0, 0, 1080, 1350);
  gradient.addColorStop(0, "#153126");
  gradient.addColorStop(1, "#07130e");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1080, 1350);
  const text = (
    value: string,
    x: number,
    y: number,
    size: number,
    color = "#f2f7f4",
    width = 960,
  ) => {
    ctx.fillStyle = color;
    ctx.font = `600 ${size}px system-ui, sans-serif`;
    ctx.fillText(value, x, y, width);
  };
  const draw = (
    image: HTMLImageElement | null,
    x: number,
    y: number,
    width: number,
    height: number,
  ) => {
    if (!image || !image.naturalWidth) return;
    const ratio = Math.min(
      width / image.naturalWidth,
      height / image.naturalHeight,
    );
    const w = image.naturalWidth * ratio,
      h = image.naturalHeight * ratio;
    ctx.drawImage(image, x + (width - w) / 2, y + (height - h) / 2, w, h);
  };
  text("TRADEUP · ZERO TO HOME", 60, 80, 26, "#80e8b5");
  text(tr ? "İlk evim." : "My first home.", 60, 160, 70);
  if (house) draw(house, 60, 200, 960, 470);
  else text("⌂", 430, 490, 220, "#80e8b5");
  text(
    home
      ? localizeHome(home.id, home.name, "", "", lang).name
      : tr
        ? "İlk ev anım"
        : "First-home memory",
    60,
    730,
    42,
  );
  text(
    `${tr ? "Ticaret" : "Trades"}: ${summary.marketTradeCount ?? "—"}`,
    60,
    810,
    34,
  );
  text(
    `${tr ? "Net piyasa kârı" : "Net market profit"}: ${summary.marketProfitMinor === undefined ? "—" : money(summary.marketProfitMinor, lang)}`,
    60,
    875,
    34,
    "#80e8b5",
  );
  memories.forEach((sale, index) => {
    if (!sale) return;
    const x = 60 + index * 490;
    draw(products[index], x, 920, 150, 150);
    text(
      sale.transactionId === summary.firstProfitableSale?.transactionId
        ? tr
          ? "İlk kârlı satış"
          : "First profitable sale"
        : tr
          ? "En iyi satış"
          : "Best sale",
      x + 160,
      960,
      22,
      "#f2f7f4",
      290,
    );
    text(money(sale.profitMinor, lang), x + 160, 1010, 28, "#80e8b5", 290);
  });
  draw(avatar, 60, 1110, 110, 110);
  text(name?.trim().slice(0, 20) || "TradeUp", 195, 1178, 32);
  text(
    summary.completeness === "PARTIAL"
      ? tr
        ? "Yerel kariyer özeti · Bazı eski kayıtlar eksik"
        : "Local career summary · Some older records missing"
      : tr
        ? "Yerel kariyer özeti"
        : "Local career summary",
    60,
    1280,
    24,
    "#a5bdb0",
  );
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => {
      if (!blob || blob.size > 2 * 1024 * 1024)
        reject(new Error("IMAGE_ENCODING_FAILED"));
      else resolve(blob);
    }, "image/png"),
  );
}

export async function shareHomeCard(
  blob: Blob,
): Promise<"SHARED" | "CANCELLED" | "DOWNLOAD"> {
  if (
    Capacitor.getPlatform() === "ios" &&
    Capacitor.isPluginAvailable("TradeUpGameCenter")
  ) {
    const png = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1]);
      reader.onerror = () => reject(new Error("IMAGE_READ_FAILED"));
      reader.readAsDataURL(blob);
    });
    const result = await nativeShare.shareImage({ png });
    return result.completed ? "SHARED" : "CANCELLED";
  }
  const file = new File([blob], "tradeup-ilk-evim.png", { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return "SHARED";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError")
        return "CANCELLED";
      throw error;
    }
  }
  return "DOWNLOAD";
}
