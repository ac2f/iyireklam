// Kayan yazı LED panel önizlemesi: yazıyı panelin GERÇEK piksel çözünürlüğünde rasterleştirir ve
// LED noktaları olarak çizer. Böylece P10 ile P4 arasındaki okunurluk farkı önizlemede doğru görünür.
//
// Çıktı iki PNG katmanıdır (SVG içine <image> olarak gömülür):
//   renderLedGrid  : siyah yüz üzerinde sönük LED noktaları (ışıksız hâl)
//   renderLedLayers: yanan LED noktaları (şeffaf zemin) — yanıp sönme animasyonu ve gece parlaması bu katmana uygulanır
const cache = new Map();
const MAX_CACHE = 10;

export function clearLedCache() { cache.clear(); }

function remember(key, value) {
  cache.set(key, value);
  if (cache.size > MAX_CACHE) cache.delete(cache.keys().next().value);
  return value;
}

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

function mixHex(a, b, t) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s) => Math.round(((pa >> s) & 255) + (((pb >> s) & 255) - ((pa >> s) & 255)) * t);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}

/** Piksel (merkez) noktalarından tek yolda daire/dikdörtgen çizer */
function dotPath(points, cx, cy, r, round) {
  const p = new Path2D();
  for (const [ix, iy] of points) {
    const x = (ix + 0.5) * cx;
    const y = (iy + 0.5) * cy;
    if (round) { p.moveTo(x + r, y); p.arc(x, y, r, 0, Math.PI * 2); } else { p.rect(x - r, y - r, r * 2, r * 2); }
  }
  return p;
}

/**
 * @param o {
 *   pxW, pxH: panelin toplam piksel çözünürlüğü
 *   outW, outH: çıktı görüntüsü boyutu (cihaz pikseli)
 *   lines: [{ text, size, base, cx, ls }] SVG birimlerinde yerleşim
 *   origin: { x, y, cell } SVG birimlerinde panel başlangıcı ve bir LED pikselinin kenarı
 *   font: { weight, stack }
 *   color: (ix, pxW) => css rengi, colorKey: önbellek anahtarı
 * }
 * @returns {{lit:string, count:number} | null} tuval kullanılamıyorsa null
 */
export function renderLedLayers(o) {
  const { pxW, pxH, outW, outH, lines, origin, font, color } = o;
  try {
    // ---- 1) yazıyı LED çözünürlüğünde rasterleştir
    const litKey = JSON.stringify([pxW, pxH, outW, outH, font.stack, font.weight, origin.cell, lines, o.colorKey]);
    if (cache.has('lit|' + litKey)) return cache.get('lit|' + litKey);
    const mask = canvas(pxW, pxH);
    const mctx = mask.getContext('2d', { willReadFrequently: true });
    mctx.fillStyle = '#000';
    mctx.textAlign = 'center';
    mctx.textBaseline = 'alphabetic';
    for (const l of lines) {
      const size = l.size / origin.cell;
      mctx.font = `${font.weight} ${size}px ${font.stack}`;
      if ('letterSpacing' in mctx) mctx.letterSpacing = `${l.ls / origin.cell}px`;
      mctx.fillText(l.text, (l.cx - origin.x) / origin.cell, (l.base - origin.y) / origin.cell);
    }
    const data = mctx.getImageData(0, 0, pxW, pxH).data;
    const byColor = new Map();
    let count = 0;
    for (let iy = 0; iy < pxH; iy++) {
      for (let ix = 0; ix < pxW; ix++) {
        if (data[(iy * pxW + ix) * 4 + 3] < 110) continue; // LED açık/kapalı: yarı saydam kenarlar eşiklenir
        const c = color(ix, pxW);
        let arr = byColor.get(c);
        if (!arr) { arr = []; byColor.set(c, arr); }
        arr.push([ix, iy]);
        count++;
      }
    }

    // ---- 2) yanan LED noktaları (şeffaf katman)
    const lit = canvas(outW, outH);
    const lctx = lit.getContext('2d');
    const cx = outW / pxW;
    const cy = outH / pxH;
    const cell = Math.min(cx, cy);
    const round = cell >= 3.2;
    const r = cell * (round ? 0.43 : 0.5);
    for (const [c, pts] of byColor) {
      lctx.fillStyle = c;
      lctx.fill(dotPath(pts, cx, cy, r, round));
    }
    // parlak LED çekirdeği
    if (cell >= 6) {
      for (const [c, pts] of byColor) {
        lctx.fillStyle = c.startsWith('#') ? mixHex(c, '#ffffff', 0.55) : 'rgba(255,255,255,.45)';
        lctx.globalAlpha = 0.55;
        lctx.fill(dotPath(pts, cx, cy, r * 0.5, true));
      }
      lctx.globalAlpha = 1;
    }
    return remember('lit|' + litKey, { lit: lit.toDataURL('image/png'), count });
  } catch {
    return null;
  }
}

/** Sönük LED ızgarası (siyah yüz). @returns {string|null} PNG veri adresi */
export function renderLedGrid(o) {
  const { pxW, pxH, outW, outH, night } = o;
  const key = `grid|${pxW}|${pxH}|${outW}|${outH}|${night ? 1 : 0}`;
  if (cache.has(key)) return cache.get(key);
  try {
    return remember(key, drawGrid(pxW, pxH, outW, outH, night));
  } catch {
    return null;
  }
}

function drawGrid(pxW, pxH, outW, outH, night) {
  const g = canvas(outW, outH);
  const ctx = g.getContext('2d');
  ctx.fillStyle = night ? '#030407' : '#07080c';
  ctx.fillRect(0, 0, outW, outH);
  const cx = outW / pxW;
  const cy = outH / pxH;
  const cell = Math.min(cx, cy);
  if (cell >= 2) {
    const round = cell >= 3.2;
    const r = cell * (round ? 0.4 : 0.42);
    ctx.fillStyle = night ? '#0d1017' : '#181b23';
    const p = new Path2D();
    for (let iy = 0; iy < pxH; iy++) {
      for (let ix = 0; ix < pxW; ix++) {
        const x = (ix + 0.5) * cx;
        const y = (iy + 0.5) * cy;
        if (round) { p.moveTo(x + r, y); p.arc(x, y, r, 0, Math.PI * 2); } else { p.rect(x - r, y - r, r * 2, r * 2); }
      }
    }
    ctx.fill(p);
  }
  return g.toDataURL('image/png');
}
