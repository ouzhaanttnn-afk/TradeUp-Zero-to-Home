import { readFile, mkdir } from "node:fs/promises";
import { chromium } from "@playwright/test";
import { resolve } from "node:path";

const source = resolve("store-assets/ios/iphone-6.5");
const output = resolve("store-assets/ios/iphone-6.5-story-v101");

const slides = [
  {
    file: "02-canli-pazar.png",
    eyebrow: "01 · CANLI PAZAR",
    title: "Fırsatı herkesten önce gör.",
    detail: "Fiyatı, durumu ve talebi karşılaştır.",
  },
  {
    file: "04-portfoyunu-buyut.png",
    eyebrow: "02 · KENDİ TİCARETİN",
    title: "Portföyünü büyüt.",
    detail: "Ürünlerini hazırla, ilan ver, kâr et.",
  },
  {
    file: "05-evine-ulas.png",
    eyebrow: "03 · UZUN YOLCULUK",
    title: "İlk evine yaklaş.",
    detail: "Sermayeni büyüt, ev fırsatlarını keşfet.",
  },
  {
    file: "01-kariyerini-baslat.png",
    eyebrow: "04 · SENİN HİKÂYEN",
    title: "Kariyerine kendi tarzınla başla.",
    detail: "İsmini ve karakterini seç.",
  },
];

await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 428, height: 926 },
    deviceScaleFactor: 3,
    reducedMotion: "reduce",
  });
  for (const [index, slide] of slides.entries()) {
    const image = (await readFile(resolve(source, slide.file))).toString("base64");
    await page.setContent(`
      <!doctype html><html lang="tr"><meta charset="utf-8">
      <style>
        *{box-sizing:border-box}html,body{margin:0;width:428px;height:926px;overflow:hidden}
        body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#f7f7e8;
          background:radial-gradient(circle at 50% 35%,#206646 0,#0c2d20 46%,#061810 100%)}
        .frame{height:100%;display:flex;flex-direction:column;align-items:center;padding:39px 23px 20px}
        .eyebrow{font-size:11px;letter-spacing:2.3px;color:#96e7b9;font-weight:800}
        h1{font-size:30px;line-height:1.04;letter-spacing:-.7px;text-align:center;margin:10px 0 7px;
          max-width:390px;text-wrap:balance}
        .detail{font-size:14px;line-height:1.25;color:#d4e7da;text-align:center;margin:0 0 16px}
        .screen{height:721px;width:333px;overflow:hidden;border:2px solid #d3af62;border-radius:24px;
          box-shadow:0 18px 36px #0008,0 0 0 6px #071d15}
        .screen img{display:block;width:100%;height:100%;object-fit:fill}
        .footer{display:flex;align-items:center;gap:7px;margin-top:auto;padding-top:10px;
          color:#f0cb77;font-size:12px;letter-spacing:2px;font-weight:900}
        .mark{font-size:17px;line-height:1}
      </style>
      <div class="frame">
        <div class="eyebrow">${slide.eyebrow}</div>
        <h1>${slide.title}</h1><p class="detail">${slide.detail}</p>
        <div class="screen"><img alt="TradeUp oyun ekranı" src="data:image/png;base64,${image}"></div>
        <div class="footer"><span class="mark">↗</span>TRADEUP · ZERO TO HOME</div>
      </div></html>
    `);
    await page.locator(".screen img").evaluate((img) => img.decode());
    const target = resolve(output, `${String(index + 1).padStart(2, "0")}-tradeup.png`);
    await page.screenshot({ path: target });
    console.log(target);
  }
} finally {
  await browser.close();
}
