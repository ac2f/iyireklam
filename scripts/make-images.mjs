#!/usr/bin/env node
// Marka görsellerini (favicon, uygulama ikonları, sosyal paylaşım görseli) üretir.
// Gerekli: playwright (global veya yerel). Çıktılar assets/img/ altına yazılır ve depoya eklenir.
import { createRequire } from 'node:module';
import { writeFile, mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IMG = path.join(ROOT, 'assets/img');
const FONTS = pathToFileURL(path.join(ROOT, 'assets/fonts')).href;
await mkdir(IMG, { recursive: true });

const mark = (size, radius = 11) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="${size}" height="${size}"><rect width="40" height="40" rx="${radius}" fill="#0e1116"/><circle cx="20" cy="9.5" r="6" fill="#e7c878" opacity=".22"/><circle cx="20" cy="9.5" r="3.6" fill="#e7c878"/><path d="M20 17v14" stroke="#fff" stroke-width="4.6" stroke-linecap="round"/></svg>`;

await writeFile(path.join(IMG, 'favicon.svg'), mark(40));

const fontCss = `
@font-face{font-family:Inter;font-weight:400 700;src:url(${FONTS}/inter-lat.woff2);unicode-range:U+0000-00FF,U+0131,U+2013-2014,U+2018-201E,U+2022,U+2026}
@font-face{font-family:Inter;font-weight:400 700;src:url(${FONTS}/inter-tr.woff2);unicode-range:U+011E-011F,U+0130,U+015E-015F,U+0307,U+20BA}
@font-face{font-family:"Cormorant Garamond";font-weight:600;src:url(${FONTS}/cormorant-600-lat.woff2);unicode-range:U+0000-00FF,U+0131,U+2013-2014,U+2018-201E,U+2022,U+2026}
@font-face{font-family:"Cormorant Garamond";font-weight:600;src:url(${FONTS}/cormorant-600-tr.woff2);unicode-range:U+011E-011F,U+0130,U+015E-015F,U+0307,U+20BA}
@font-face{font-family:"Cormorant Garamond";font-style:italic;font-weight:600;src:url(${FONTS}/cormorant-600i-lat.woff2);unicode-range:U+0000-00FF,U+0131,U+2013-2014,U+2018-201E,U+2022,U+2026}
@font-face{font-family:"Cormorant Garamond";font-style:italic;font-weight:600;src:url(${FONTS}/cormorant-600i-tr.woff2);unicode-range:U+011E-011F,U+0130,U+015E-015F,U+0307,U+20BA}
`;

const og = `<!doctype html><meta charset="utf-8"><style>${fontCss}
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;overflow:hidden;font-family:Inter,sans-serif;color:#fff;background:radial-gradient(900px 520px at 80% 20%,rgba(231,200,120,.28),transparent 60%),radial-gradient(700px 400px at 0% 100%,rgba(184,145,58,.2),transparent 60%),#0e1116;position:relative}
.dots{position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.07) 1.2px,transparent 1.2px);background-size:30px 30px;mask-image:linear-gradient(180deg,#000,transparent 80%)}
.brand{position:absolute;left:72px;top:60px;display:flex;align-items:center;gap:16px;font:600 46px "Cormorant Garamond",serif}
.brand b{font-style:italic;color:#e7c878;font-weight:600}
h1{position:absolute;left:72px;top:176px;width:700px;font:600 78px/1 "Cormorant Garamond",serif;letter-spacing:-1.5px}
h1 em{color:#e7c878}
p.sub{position:absolute;left:72px;top:372px;width:640px;font-size:26px;line-height:1.45;color:#c3cad6}
.tags{position:absolute;left:72px;bottom:62px;display:flex;gap:12px}
.tags span{padding:10px 18px;border-radius:999px;border:1.5px solid rgba(231,200,120,.45);color:#e7c878;font-size:21px;font-weight:600}
.phone{position:absolute;right:72px;bottom:58px;font-size:38px;font-weight:700;color:#fff}
.sign{position:absolute;right:56px;top:128px;width:380px;height:290px;border-radius:22px;background:linear-gradient(180deg,#232b39,#171d28);box-shadow:0 30px 70px rgba(0,0,0,.55),inset 0 0 0 1.5px rgba(255,255,255,.08);display:grid;place-items:center;text-align:center}
.sign .t{font:700 66px/1 Inter,sans-serif;letter-spacing:3px;color:#fff6dc;text-shadow:0 0 6px #ffd88a,0 0 22px #ffd88a,0 0 54px rgba(255,216,138,.85)}
.sign .s{margin-top:16px;font:600 16px Inter;letter-spacing:4px;color:#e7c878;text-shadow:0 0 12px rgba(255,216,138,.8)}
</style><div class="dots"></div>
<div class="brand">${mark(58, 14)}<span>İyi <b>Reklam</b></span></div>
<h1>Ankara Tabela İmalatı <em>ve Kutu Harf Atölyesi</em></h1>
<p class="sub">Işıklı kutu harf, krom harf, germe, totem ve kapı tabelaları · CNC router & lazer kesim · Online tabela sihirbazı</p>
<div class="sign"><div><div class="t">İYİ REKLAM</div><div class="s">TABELA · KUTU HARF · CNC</div></div></div>
<div class="tags"><span>İskitler, Altındağ</span><span>20+ yıl deneyim</span></div>
<div class="phone">0531 520 90 01</div>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
const tmp = path.join(os.tmpdir(), 'iyireklam-og.html');
await writeFile(tmp, og);
await page.goto(pathToFileURL(tmp).href);
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(IMG, 'og.png') });

for (const [name, size, radius] of [
  ['favicon-48.png', 48, 11],
  ['apple-touch-icon.png', 180, 0],
  ['icon-192.png', 192, 0],
  ['icon-512.png', 512, 0],
  ['logo-512.png', 512, 90],
]) {
  const p = await browser.newPage({ viewport: { width: size, height: size } });
  await p.setContent(`<body style="margin:0;background:${radius ? 'transparent' : '#0e1116'}">${mark(size, radius * (40 / size) || 0)}</body>`);
  await p.screenshot({ path: path.join(IMG, name), omitBackground: radius > 0 });
  await p.close();
}
await browser.close();
console.log('Görseller üretildi:', IMG);
