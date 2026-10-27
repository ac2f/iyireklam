// Paylaşım: PNG kartı, panoya kopyalama, WhatsApp, yazdırma.
import { FONTS } from '../data/catalog.mjs';
import { find, summarize, refNo, costLabel } from './model.js';

const WA_NUMBER = '905315209001';

export function waLink(text) {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
}

export async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* geri dönüş aşağıda */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:-9999px;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Yazı tiplerini SVG içine göm (SVG -> PNG dönüşümünde dış kaynaklar yüklenmez)
// ---------------------------------------------------------------------------
const fontCache = new Map();

async function fontB64(url) {
  if (fontCache.has(url)) return fontCache.get(url);
  const res = await fetch(url);
  if (!res.ok) throw new Error('font');
  const buf = new Uint8Array(await res.arrayBuffer());
  let bin = '';
  for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
  const b64 = btoa(bin);
  fontCache.set(url, b64);
  return b64;
}

const LAT = 'U+0000-00FF,U+0131,U+2013-2014,U+2018-201E,U+2022,U+2026,U+2122';
const TR = 'U+011E-011F,U+0130,U+015E-015F,U+0307,U+20BA';

export async function fontCss(fontId, base) {
  const f = find(FONTS, fontId);
  const faces = [
    { fam: f.family, file: f.file, w: String(f.weight) },
    { fam: 'Inter', file: 'inter', w: '400 700' },
  ];
  let css = '';
  for (const face of faces) {
    for (const [suffix, range] of [['lat', LAT], ['tr', TR]]) {
      try {
        const b64 = await fontB64(`${base}fonts/${face.file}-${suffix}.woff2`);
        css += `@font-face{font-family:'${face.fam}';font-weight:${face.w};src:url(data:font/woff2;base64,${b64}) format('woff2');unicode-range:${range}}`;
      } catch { /* font yoksa sistem yazı tipi kullanılır */ }
    }
  }
  return css;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('img'));
    img.src = src;
  });
}

export async function svgToImage(svg, width, height, css) {
  let s = svg.replace('<defs>', `<defs><style>${css}</style>`);
  s = s.replace('<svg ', `<svg width="${width}" height="${height}" `);
  return loadImage('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s));
}

// ---------------------------------------------------------------------------
// PNG kartı: önizleme + şartname özeti
// ---------------------------------------------------------------------------
function wrap(ctx, text, maxW) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w;
    if (ctx.measureText(t).width <= maxW || !cur) cur = t;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export async function buildCard(app, scenes, base) {
  const st = app.st;
  const { rows, level } = summarize(st, app.meta);
  const css = await fontCss(st.f, base);
  try { await document.fonts.load('600 20px Inter', 'İığşĞŞ'); } catch { /* yoksa varsayılan */ }
  const W = 1200;
  const pad = 56;
  const innerW = W - pad * 2;
  const imgs = [];
  const targetW = scenes.length > 1 ? (innerW - 24) / 2 : innerW;
  for (const sc of scenes) {
    const h = Math.round((targetW * sc.height) / sc.width);
    imgs.push({ img: await svgToImage(sc.svg, Math.round(targetW * 2), Math.round(h * 2), css), w: targetW, h, label: sc.label });
  }
  const imgH = Math.max(...imgs.map((i) => i.h));

  const meas = document.createElement('canvas').getContext('2d');
  const FONT = (w, s) => `${w} ${s}px Inter, "Segoe UI", Arial, sans-serif`;
  const colL = 330;
  const colV = innerW - colL - 150;

  // yükseklik hesabı
  let y = 120 + 36 + imgH + 34;
  const layout = [];
  let group = '';
  for (const r of rows) {
    if (r.g !== group) { group = r.g; layout.push({ kind: 'g', text: group, y }); y += 46; }
    meas.font = FONT(600, 23);
    const vl = wrap(meas, r.value, colV);
    meas.font = FONT(400, 20);
    const note = st.n[r.k] ? wrap(meas, `Not: ${st.n[r.k]}`, colV) : [];
    const h = Math.max(1, vl.length) * 31 + note.length * 27 + 16;
    layout.push({ kind: 'r', r, vl, note, y, h });
    y += h;
  }
  if (st.n.genel) {
    meas.font = FONT(400, 21);
    const gl = wrap(meas, `Genel not: ${st.n.genel}`, innerW);
    layout.push({ kind: 'n', lines: gl, y: y + 10 });
    y += 20 + gl.length * 28;
  }
  y += 30;
  const levelY = y;
  y += 96;
  const H = y + 120;

  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#f7f4ee';
  ctx.fillRect(0, 0, W, H);

  // üst bant
  ctx.fillStyle = '#0e1116';
  ctx.fillRect(0, 0, W, 120);
  ctx.fillStyle = '#e7c878';
  ctx.font = FONT(700, 40);
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('İyi Reklam', pad, 62);
  ctx.fillStyle = '#c4cad4';
  ctx.font = FONT(500, 22);
  ctx.fillText('Tabela Şartnamesi', pad, 96);
  const now = new Date();
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffffff';
  ctx.font = FONT(700, 26);
  ctx.fillText(`No: ${refNo(st, now)}`, W - pad, 62);
  ctx.fillStyle = '#c4cad4';
  ctx.font = FONT(500, 22);
  ctx.fillText(now.toLocaleDateString('tr-TR'), W - pad, 96);
  ctx.textAlign = 'left';

  // önizlemeler
  let ix = pad;
  for (const it of imgs) {
    ctx.save();
    rr(ctx, ix, 156, it.w, it.h, 18);
    ctx.clip();
    ctx.drawImage(it.img, ix, 156, it.w, it.h);
    ctx.restore();
    if (imgs.length > 1) {
      ctx.fillStyle = 'rgba(14,17,22,.72)';
      rr(ctx, ix + 14, 170, 112, 30, 15);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = FONT(600, 15);
      ctx.fillText(it.label, ix + 28, 191);
    }
    ix += it.w + 24;
  }

  // satırlar
  for (const l of layout) {
    if (l.kind === 'g') {
      ctx.fillStyle = '#9a7a2e';
      ctx.font = FONT(700, 17);
      ctx.fillText(l.text.toUpperCase().split('').join(' '), pad, l.y + 24);
      ctx.fillStyle = '#e4dccb';
      ctx.fillRect(pad, l.y + 34, innerW, 1.5);
    } else if (l.kind === 'r') {
      let yy = l.y + 26;
      ctx.fillStyle = '#6b7280';
      ctx.font = FONT(500, 20);
      ctx.fillText(l.r.label, pad, yy);
      ctx.fillStyle = '#14161a';
      ctx.font = FONT(600, 23);
      l.vl.forEach((t, i) => ctx.fillText(t, pad + colL, yy + i * 31));
      yy += (l.vl.length - 1) * 31;
      if (l.note.length) {
        ctx.fillStyle = '#8a5a00';
        ctx.font = FONT(400, 20);
        l.note.forEach((t, i) => ctx.fillText(t, pad + colL, yy + 27 * (i + 1)));
      }
      if (typeof l.r.cost === 'number') {
        const lbl = costLabel(l.r.cost);
        const col = ['#0f7a3d', '#8a6a00', '#b4540a', '#b4231f'][l.r.cost];
        ctx.font = FONT(700, 16);
        const tw = ctx.measureText(lbl).width + 24;
        ctx.fillStyle = col + '22';
        rr(ctx, W - pad - tw, l.y + 8, tw, 28, 14);
        ctx.fill();
        ctx.fillStyle = col;
        ctx.fillText(lbl, W - pad - tw + 12, l.y + 28);
      }
    } else if (l.kind === 'n') {
      ctx.fillStyle = '#3a3f47';
      ctx.font = FONT(400, 21);
      l.lines.forEach((t, i) => ctx.fillText(t, pad, l.y + 24 + i * 28));
    }
  }

  // fiyat seviyesi
  ctx.fillStyle = '#ffffff';
  rr(ctx, pad, levelY, innerW, 80, 16);
  ctx.fill();
  ctx.strokeStyle = '#e4dccb';
  ctx.stroke();
  const cols = ['#2e9d5b', '#c9a227', '#e0701a', '#d6352e'];
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = i <= level.id ? cols[level.id] : '#e8e3d6';
    rr(ctx, pad + 24 + i * 34, levelY + 28, 28, 24, 6);
    ctx.fill();
  }
  ctx.fillStyle = '#14161a';
  ctx.font = FONT(700, 22);
  ctx.fillText(`Fiyat seviyesi: ${level.label}`, pad + 180, levelY + 38);
  ctx.fillStyle = '#6b7280';
  ctx.font = FONT(400, 17);
  meas.font = FONT(400, 17);
  ctx.fillText(wrap(meas, level.desc, innerW - 200)[0], pad + 180, levelY + 62);

  // alt bant
  ctx.fillStyle = '#0e1116';
  ctx.fillRect(0, H - 100, W, 100);
  ctx.fillStyle = '#fff';
  ctx.font = FONT(700, 24);
  ctx.fillText('0531 520 90 01', pad, H - 54);
  ctx.fillStyle = '#c4cad4';
  ctx.font = FONT(400, 18);
  ctx.fillText('Sebze Bahçeleri Cad. No: 107/22 İskitler, Altındağ / Ankara', pad, H - 24);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#e7c878';
  ctx.font = FONT(600, 18);
  ctx.fillText('Kesin fiyat ölçü/keşif sonrası netleşir', W - pad, H - 24);
  ctx.textAlign = 'left';

  return cv;
}

export function canvasToBlob(cv) {
  return new Promise((resolve) => cv.toBlob((b) => resolve(b), 'image/png'));
}

export function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
