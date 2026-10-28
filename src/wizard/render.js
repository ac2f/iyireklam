// Tabela önizleme motoru: seçimlerden SVG sahne üretir (gündüz / gece).
import {
  FONTS, SIDE_COLORS, LED_COLORS, FRAME_COLORS, GERME_COLORS, GERME_INK, LASER_FINISH, FOIL_COLORS, SMALL_TEXT_CM,
} from '../data/catalog.mjs';
import { getProduct } from './state.js';
import {
  find, activeLines, hasZemin, plexiOf, zeminColor, kabartmaColor, visible, smallPlan,
} from './model.js';

// ---------------------------------------------------------------------------
// Renk yardımcıları
// ---------------------------------------------------------------------------
export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const toHex = (r, g, b) =>
  '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
export function mix(a, b, t) {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return toHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
}
export const shade = (hex, t) => (t < 0 ? mix(hex, '#000000', -t) : mix(hex, '#ffffff', t));
export function lum(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const r1 = (n) => Math.round(n * 10) / 10;
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

// ---------------------------------------------------------------------------
// Metin ölçümü (canvas) — yazı tipi yüklenince yeniden çağrılır
// ---------------------------------------------------------------------------
let mctx = null;
const mcache = new Map();
export function measure(text, font) {
  const key = font.id + '|' + text;
  if (mcache.has(key)) return mcache.get(key);
  if (!mctx) mctx = document.createElement('canvas').getContext('2d');
  mctx.font = `${font.weight} 100px ${font.stack}`;
  const m = mctx.measureText(text);
  const out = { w: m.width };
  mcache.set(key, out);
  return out;
}
const capCache = new Map();
export function capRatio(font) {
  if (capCache.has(font.id)) return capCache.get(font.id);
  if (!mctx) mctx = document.createElement('canvas').getContext('2d');
  mctx.font = `${font.weight} 100px ${font.stack}`;
  const a = mctx.measureText('H').actualBoundingBoxAscent;
  const v = a > 30 && a < 110 ? a / 100 : 0.72;
  capCache.set(font.id, v);
  return v;
}
export function clearMeasureCache() { mcache.clear(); capCache.clear(); }

// ---------------------------------------------------------------------------
// Dolgu / doku üretimi
// ---------------------------------------------------------------------------
const GRAD = {
  silver: ['#fbfcfd', '#aab2bb', '#eef1f4', '#868f99', '#dde2e7', '#b8c0c8'],
  gold: ['#fff3c9', '#c99b34', '#f8e29a', '#946c20', '#f0d27c', '#c29a3c'],
};

function metalGradient(id, kind, vertical = false) {
  const s = GRAD[kind];
  const stops = s.map((c, i) => `<stop offset="${Math.round((i / (s.length - 1)) * 100)}%" stop-color="${c}"/>`).join('');
  return `<linearGradient id="${id}" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="1">${stops}</linearGradient>`;
}

/**
 * Bir palet öğesi için dolgu üretir.
 * @returns {{defs:string, fill:string, overlay:(w,h)=>string}}
 */
function fillFor(item, idp, key) {
  const id = `${idp}${key}`;
  if (item.mirror) {
    return { defs: metalGradient(id, item.mirror), fill: `url(#${id})`, overlay: () => '', base: item.hex };
  }
  const hex = item.hex;
  const hex2 = item.hex2 || shade(hex, -0.3);
  const [r, g, b] = hexToRgb(hex2).map((v) => r1(v / 255));
  const f = `${id}f`;
  const cm = (a, c) => `<feColorMatrix in="n" type="matrix" values="0 0 0 0 ${r} 0 0 0 0 ${g} 0 0 0 0 ${b} ${a} 0 0 0 ${c}"/>`;
  const filt = (inner) => `<filter id="${f}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">${inner}</filter>`;
  const ov = (op) => (w, h) => `<rect width="${r1(w)}" height="${r1(h)}" fill="#000" filter="url(#${f})" opacity="${op}"/>`;
  const alphaFromR = (inner) =>
    `<feColorMatrix in="n" type="matrix" values="0 0 0 0 ${r} 0 0 0 0 ${g} 0 0 0 0 ${b} 1 0 0 0 0"/>${inner}`;
  const veins = Array.from({ length: 41 }, (_, i) => {
    const d = Math.abs(i - 20);
    return d >= 2 ? 0 : d === 1 ? 0.45 : 0.95;
  }).join(' ');
  switch (item.pat) {
    case 'wood':
      return {
        defs: filt(`<feTurbulence type="fractalNoise" baseFrequency="0.0012 0.16" numOctaves="3" seed="4" result="n"/>${cm(1.5, -0.3)}`),
        fill: hex, overlay: ov(0.7), base: hex,
      };
    case 'marble':
      return {
        defs: filt(`<feTurbulence type="fractalNoise" baseFrequency="0.0035 0.007" numOctaves="5" seed="11" result="n"/>${alphaFromR(`<feComponentTransfer><feFuncA type="table" tableValues="${veins}"/></feComponentTransfer>`)}`),
        fill: hex, overlay: ov(0.8), base: hex,
      };
    case 'stone':
      return {
        defs: filt(`<feTurbulence type="fractalNoise" baseFrequency="0.4" numOctaves="2" seed="5" result="n"/>${cm(1.5, -0.35)}`),
        fill: hex, overlay: ov(0.5), base: hex,
      };
    case 'brushed':
      return {
        defs: filt(`<feTurbulence type="fractalNoise" baseFrequency="0.0008 0.5" numOctaves="2" seed="8" result="n"/>${cm(1.4, -0.4)}`),
        fill: hex, overlay: ov(0.3), base: hex,
      };
    case 'metal':
      return {
        defs: `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${shade(hex, 0.18)}"/><stop offset="0.5" stop-color="${hex}"/><stop offset="1" stop-color="${shade(hex, -0.18)}"/></linearGradient>`,
        fill: `url(#${id})`, overlay: () => '', base: hex,
      };
    default:
      return { defs: '', fill: hex, overlay: () => '', base: hex };
  }
}

// ---------------------------------------------------------------------------
// Ana sahne
// ---------------------------------------------------------------------------
const SIZE_W = { L: 1, M: 0.62, S: 0.42 };

// ---------------------------------------------------------------------------
// Yazı yerleşimi: gerekirse satırları kelime kelime bölerek harfleri büyütür
// ---------------------------------------------------------------------------
const GAP = 0.55;

function splitBalanced(words, k, widthOf) {
  if (k <= 1 || words.length <= 1) return [words.join(' ')];
  const n = words.length;
  k = Math.min(k, n);
  let best = null;
  let bestW = Infinity;
  const rec = (start, left, acc) => {
    if (left === 1) {
      const chunks = [...acc, words.slice(start).join(' ')];
      const w = Math.max(...chunks.map(widthOf));
      if (w < bestW) { bestW = w; best = chunks; }
      return;
    }
    for (let e = start + 1; e <= n - left + 1; e++) rec(e, left - 1, [...acc, words.slice(start, e).join(' ')]);
  };
  rec(0, k, []);
  return best;
}

function planLines(lines, font, cap, ls, area, fitK) {
  const widthOf = (t) => (measure(t, font).w + t.length * ls * 100) / 100;
  const options = lines.map((l) => {
    const words = l.t.split(/\s+/).filter(Boolean);
    const out = [];
    const maxK = area.h / area.w >= 0.8 ? Math.min(3, words.length) : 1;
    for (let k = 1; k <= maxK; k++) out.push(splitBalanced(words, k, widthOf));
    return out;
  });
  let best = null;
  const evalCombo = (combo) => {
    const subs = [];
    combo.forEach((chunks, li) => {
      chunks.forEach((t, ci) => subs.push({ t, wt: SIZE_W[lines[li].s] || 1, src: lines[li].t, first: ci === 0, w: widthOf(t) }));
    });
    let sW = Infinity;
    for (const m of subs) sW = Math.min(sW, area.w / (m.w * m.wt));
    let coeff = 0;
    subs.forEach((m, i) => {
      coeff += cap * m.wt;
      if (i < subs.length - 1) coeff += GAP * cap * Math.min(m.wt, subs[i + 1].wt);
    });
    const s = Math.min(sW, area.h / coeff);
    const extra = subs.length - lines.length;
    const score = s * (1 - 0.05 * extra);
    if (!best || score > best.score) best = { subs, coeff, s, score };
  };
  const walk = (i, acc) => {
    if (i === options.length) { evalCombo(acc); return; }
    for (const o of options[i]) walk(i + 1, [...acc, o]);
  };
  walk(0, []);
  const s = best.s * fitK;
  return { subs: best.subs, s, blockH: s * best.coeff, gap: GAP };
}


/**
 * @param st normalize edilmiş durum
 * @param opts { night, idp, logoUrl, fontCss }
 */
export function buildScene(st, opts = {}) {
  const night = !!opts.night;
  const idp = opts.idp || 'p';
  const logoUrl = opts.logoUrl || null;
  const prod = getProduct(st.p);
  const v = visible(st);
  const font = find(FONTS, st.f);
  const defs = [];
  const baseLayer = [];
  const litLayer = [];
  const under = []; // dekupe için panel altı
  const hud = [];

  // ---- tuval ve sign dikdörtgeni
  let CW; let CH; let sx; let sy; let sw; let sh; let groundY = null;
  const aspect = st.w / st.h;
  if (st.p === 'totem') {
    CW = 720; CH = 980;
    const maxW = 400; const maxH = 740;
    if (aspect >= maxW / maxH) { sw = maxW; sh = sw / aspect; } else { sh = maxH; sw = sh * aspect; }
    sw = Math.max(sw, 60);
    groundY = CH - 84;
    sx = (CW - sw) / 2; sy = groundY - sh - 10;
  } else {
    CW = st.p === 'kapi' ? 900 : 1000;
    const maxW = st.p === 'kapi' ? 620 : 780;
    const maxH = st.p === 'kapi' ? 400 : 360;
    if (aspect >= maxW / maxH) { sw = maxW; sh = sw / aspect; } else { sh = maxH; sw = sh * aspect; }
    sh = Math.max(sh, 26);
    CH = Math.max(st.p === 'kapi' ? 600 : 330, Math.round(sh + 230));
    sx = (CW - sw) / 2; sy = (CH - sh) / 2 + 14;
  }
  sx = r1(sx); sy = r1(sy); sw = r1(sw); sh = r1(sh);
  const pxPerCm = sw / st.w;

  // ---- renk paleti (gündüz/gece)
  const wallA = night ? '#111621' : '#ece6db';
  const wallB = night ? '#080b11' : '#d8d1c3';
  const dim = night ? '#05070c' : null;
  const dimLabel = night ? '#aab4c6' : '#5b6371';

  // ---- paylaşılan tanımlar
  defs.push(metalGradient(`${idp}gS`, 'silver'), metalGradient(`${idp}gG`, 'gold'));
  defs.push(`<linearGradient id="${idp}wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${wallA}"/><stop offset="1" stop-color="${wallB}"/></linearGradient>`);
  defs.push(`<linearGradient id="${idp}shine" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".5" stop-color="#fff" stop-opacity=".05"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></linearGradient>`);
  defs.push(`<filter id="${idp}wtex" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="2"/><feColorMatrix type="matrix" values="0 0 0 0 ${night ? 1 : 0} 0 0 0 0 ${night ? 1 : 0} 0 0 0 0 ${night ? 1 : 0} 0 0 0 0.05 0"/></filter>`);

  // ---- duvar
  baseLayer.push(`<rect width="${CW}" height="${CH}" fill="url(#${idp}wall)"/>`);
  baseLayer.push(`<rect width="${CW}" height="${CH}" filter="url(#${idp}wtex)"/>`);
  if (groundY !== null) {
    defs.push(`<linearGradient id="${idp}gnd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${night ? '#1a1f2a' : '#b9b3a6'}"/><stop offset="1" stop-color="${night ? '#0b0e14' : '#9d978a'}"/></linearGradient>`);
    baseLayer.push(`<rect y="${groundY}" width="${CW}" height="${CH - groundY}" fill="url(#${idp}gnd)"/>`);
    baseLayer.push(`<rect y="${groundY}" width="${CW}" height="2" fill="${night ? '#2a3140' : '#8d877a'}"/>`);
  }

  // ---- yazı yerleşimi
  const lines = activeLines(st);
  const hasZ = hasZemin(st);
  const cap = capRatio(font);
  const ls = st.up ? 0.045 : 0.012;
  const pad = hasZ || st.p === 'germe'
    ? clamp(Math.min(sw, sh) * 0.09, 6, 46)
    : clamp(Math.min(sw, sh) * 0.04, 2, 16);
  const frameT = st.p === 'germe' ? clamp(Math.min(sw, sh) * 0.055, 6, 20) : 0;
  let area = { x: sx + pad + frameT, y: sy + pad + frameT, w: sw - 2 * (pad + frameT), h: sh - 2 * (pad + frameT) };

  let logoBox = null;
  if (st.logo) {
    if (st.p === 'totem') {
      const size = Math.min(area.w * 0.7, area.h * 0.3);
      logoBox = { x: area.x + (area.w - size) / 2, y: area.y, w: size, h: size };
      area = { x: area.x, y: area.y + size + size * 0.18, w: area.w, h: area.h - size - size * 0.18 };
    } else {
      const size = Math.min(area.h * 0.92, area.w * 0.3);
      logoBox = { x: area.x, y: area.y + (area.h - size) / 2, w: size, h: size };
      const gap = size * 0.22;
      area = { x: area.x + size + gap, y: area.y, w: area.w - size - gap, h: area.h };
    }
  }

  const laid = [];
  let meta = { lines: [], pxPerCm, capRatio: cap };
  if (lines.length && area.w > 4 && area.h > 4) {
    const plan = planLines(lines, font, cap, ls, area, st.fit / 100);
    let y = area.y + (area.h - plan.blockH) / 2;
    plan.subs.forEach((m, i) => {
      const size = plan.s * m.wt;
      const capPx = size * cap;
      const base = y + capPx;
      laid.push({
        text: m.t, size: r1(size), base: r1(base), cx: r1(area.x + area.w / 2), ls: r1(size * ls), capPx,
      });
      if (m.first) meta.lines.push({ text: m.src, capCm: capPx / pxPerCm });
      const next = plan.subs[i + 1];
      y = base + (next ? plan.gap * cap * Math.min(m.wt, next.wt) * plan.s : 0);
    });
  }
  meta.area = area;

  // Küçük yazı kuralı: kutu harf sistemlerinde harf yüksekliği SMALL_TEXT_CM altındaki satırlar
  // dekupe (veya seçilen yöntem) ile yapılır; ayrı bir grupta çizilir.
  const sp = st.p === 'germe' ? null : smallPlan(st);
  const boxy = ['kutu_isikli', 'kutu_isiksiz', 'krom'].includes(st.s);
  const tinyLine = (l) => l.capPx / pxPerCm < SMALL_TEXT_CM;
  const smallLaid = sp ? laid.filter(tinyLine) : [];
  const mainLaid = sp ? laid.filter((l) => !tinyLine(l)) : laid;
  meta.lines.forEach((l) => { l.small = !!sp && l.capCm < SMALL_TEXT_CM; });
  meta.small = sp && smallLaid.length
    ? { method: sp.method, backing: sp.backing, lines: meta.lines.filter((l) => l.small).map((l) => l.text) }
    : null;
  meta.tiny = boxy && !sp ? meta.lines.filter((l) => l.capCm < SMALL_TEXT_CM).map((l) => l.text) : [];

  const textEls = (arr) => arr
    .map((l) => `<text x="${l.cx}" y="${l.base}" font-size="${l.size}" letter-spacing="${l.ls}">${esc(l.text)}</text>`)
    .join('');
  const gAttr = `text-anchor="middle" font-family="${font.stack}" font-weight="${font.weight}"`;
  defs.push(`<g id="${idp}lt" ${gAttr}>${textEls(mainLaid)}</g>`);
  defs.push(`<g id="${idp}ls" ${gAttr}>${textEls(smallLaid)}</g>`);
  const Ug = (gid, extra = '') => `<use href="#${idp}${gid}" ${extra}/>`;
  const U = (extra = '') => Ug('lt', extra);
  const minOf = (arr) => (arr.length ? Math.min(...arr.map((l) => l.size)) : 20);

  // ---- zemin
  const cornerR = st.cr === 'yuvarlak' ? clamp(Math.min(sw, sh) * 0.14, 6, 46) : 2;
  const zItem = hasZ ? zeminColor(st) : null;
  const zFill = zItem ? fillFor(zItem, idp, 'z') : null;
  const zDepth = clamp((st.zt / 10) * pxPerCm * 1.4, 2, 10);

  const mainCut = st.s === 'dekupe' && hasZ && mainLaid.length > 0;
  const smallCut = !!sp && sp.method === 'dekupe' && hasZ && smallLaid.length > 0;
  const isCut = mainCut || smallCut;

  // ---- harf stili
  const lit = visible(st).led || st.p === 'germe';
  const o = st.o;
  const led = find(LED_COLORS, o.lc);

  // ---- sahne parçaları: panel
  function panelSVG() {
    const parts = [];
    if (zFill) defs.push(zFill.defs);
    const edge = shade(zFill.base, -0.38);
    const body = `<rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" rx="${r1(cornerR)}" fill="${zFill.fill}"/>`;
    defs.push(`<filter id="${idp}psh" x="-10%" y="-10%" width="125%" height="135%"><feDropShadow dx="${night ? 2 : 4}" dy="${night ? 4 : 8}" stdDeviation="${night ? 6 : 7}" flood-color="#000" flood-opacity="${night ? 0.6 : 0.3}"/></filter>`);
    let inner = `<rect x="${r1(sx + zDepth * 0.6)}" y="${r1(sy + zDepth)}" width="${sw}" height="${sh}" rx="${r1(cornerR)}" fill="${edge}"/>`;
    inner += body;
    if (zFill.overlay) {
      defs.push(`<clipPath id="${idp}zc"><rect width="${sw}" height="${sh}" rx="${r1(cornerR)}"/></clipPath>`);
      inner += `<g clip-path="url(#${idp}zc)" transform="translate(${sx} ${sy})">${zFill.overlay(sw, sh)}</g>`;
    }
    inner += `<rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" rx="${r1(cornerR)}" fill="url(#${idp}shine)" opacity=".28"/>`;
    inner += `<rect x="${sx + 0.5}" y="${sy + 0.5}" width="${sw - 1}" height="${sh - 1}" rx="${r1(cornerR)}" fill="none" stroke="rgba(255,255,255,.35)"/>`;
    if (isCut) {
      defs.push(`<mask id="${idp}cut" maskUnits="userSpaceOnUse" x="${sx - 20}" y="${sy - 20}" width="${sw + 60}" height="${sh + 60}"><rect x="${sx - 20}" y="${sy - 20}" width="${sw + 60}" height="${sh + 60}" fill="#fff"/>${mainCut ? Ug('lt', 'fill="#000" stroke="#000" stroke-width="0.6"') : ''}${smallCut ? Ug('ls', 'fill="#000" stroke="#000" stroke-width="0.6"') : ''}</mask>`);
      parts.push(`<g filter="url(#${idp}psh)"><g mask="url(#${idp}cut)">${inner}</g></g>`);
    } else {
      parts.push(`<g filter="url(#${idp}psh)">${inner}</g>`);
    }
    // Kapı tabelası sabitleme noktaları
    if (v.fix && st.fx === 'distans') {
      const m = clamp(Math.min(sw, sh) * 0.07, 6, 18);
      for (const [px, py] of [[sx + m, sy + m], [sx + sw - m, sy + m], [sx + m, sy + sh - m], [sx + sw - m, sy + sh - m]]) {
        parts.push(`<circle cx="${r1(px)}" cy="${r1(py)}" r="${r1(clamp(m * 0.28, 2, 4.5))}" fill="url(#${idp}gS)" stroke="rgba(0,0,0,.35)" stroke-width=".8"/>`);
      }
    }
    return parts.join('');
  }

  // ---- logo
  function logoSVG() {
    if (!logoBox) return '';
    const b = logoBox;
    if (logoUrl) {
      return `<image href="${logoUrl}" x="${r1(b.x)}" y="${r1(b.y)}" width="${r1(b.w)}" height="${r1(b.h)}" preserveAspectRatio="xMidYMid meet"/>`;
    }
    const col = hasZ && lum(zFill.base) < 0.5 ? '#ffffff' : '#14161a';
    const r = b.w / 2;
    return (
      `<g opacity=".8"><circle cx="${r1(b.x + r)}" cy="${r1(b.y + r)}" r="${r1(r * 0.96)}" fill="none" stroke="${col}" stroke-width="${r1(Math.max(1.2, r * 0.04))}" stroke-dasharray="${r1(r * 0.12)} ${r1(r * 0.09)}"/>` +
      `<text x="${r1(b.x + r)}" y="${r1(b.y + r + r * 0.12)}" text-anchor="middle" font-size="${r1(r * 0.38)}" font-family="Inter, Arial, sans-serif" font-weight="700" fill="${col}" letter-spacing="1">LOGO</text></g>`
    );
  }

  // =========================================================================
  // GERME TABELA
  // =========================================================================
  if (st.p === 'germe') {
    const fr = find(FRAME_COLORS, st.fr);
    const gc = find(GERME_COLORS, st.gc);
    const ink = st.gi === 'auto' ? gc.ink : (find(GERME_INK, st.gi).hex || gc.ink);
    const ft = frameT;
    const depth = clamp(sh * 0.07, 6, 16);
    defs.push(`<linearGradient id="${idp}fr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(fr.hex, 0.22)}"/><stop offset=".5" stop-color="${fr.hex}"/><stop offset="1" stop-color="${shade(fr.hex, -0.28)}"/></linearGradient>`);
    defs.push(`<radialGradient id="${idp}bk" cx=".5" cy=".5" r=".75"><stop offset="0" stop-color="${shade(gc.hex, night ? 0.3 : 0.1)}"/><stop offset="1" stop-color="${shade(gc.hex, night ? -0.05 : -0.1)}"/></radialGradient>`);
    defs.push(`<filter id="${idp}gbox" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="${r1(clamp(sh * 0.12, 8, 30))}"/></filter>`);
    let s = '';
    if (night) s += `<rect x="${sx - 6}" y="${sy - 6}" width="${sw + 12}" height="${sh + 12}" rx="10" fill="${led.glow}" filter="url(#${idp}gbox)" opacity=".7"/>`;
    s += `<polygon points="${sx + sw},${sy} ${sx + sw + depth},${sy + depth * 0.7} ${sx + sw + depth},${sy + sh + depth * 0.7} ${sx + sw},${sy + sh}" fill="${shade(fr.hex, -0.45)}"/>`;
    s += `<polygon points="${sx},${sy + sh} ${sx + depth},${sy + sh + depth * 0.7} ${sx + sw + depth},${sy + sh + depth * 0.7} ${sx + sw},${sy + sh}" fill="${shade(fr.hex, -0.55)}"/>`;
    s += `<rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" rx="3" fill="url(#${idp}fr)" filter="url(#${idp}psh)"/>`;
    s += `<rect x="${r1(sx + ft)}" y="${r1(sy + ft)}" width="${r1(sw - 2 * ft)}" height="${r1(sh - 2 * ft)}" fill="url(#${idp}bk)"/>`;
    defs.push(`<filter id="${idp}psh" x="-10%" y="-10%" width="125%" height="135%"><feDropShadow dx="4" dy="7" stdDeviation="7" flood-color="#000" flood-opacity="${night ? 0.5 : 0.28}"/></filter>`);
    s += `<rect x="${r1(sx + ft)}" y="${r1(sy + ft)}" width="${r1(sw - 2 * ft)}" height="${r1(sh - 2 * ft)}" fill="url(#${idp}shine)" opacity="${night ? 0.1 : 0.18}"/>`;
    s += logoSVG();
    s += U(`fill="${ink}"`);
    litLayer.push(s);
  } else {
    // =======================================================================
    // Panel (zemin)
    // =======================================================================
    let panel = '';
    if (hasZ) {
      panel = panelSVG();
    } else {
      // zeminsiz: alanı kesik çizgilerle göster
      hud.push(`<rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" fill="none" stroke="${night ? '#46506a' : '#a69f90'}" stroke-dasharray="6 6" stroke-width="1.2" rx="4"/>`);
    }

    // =====================================================================
    // Harfler: ana yazılar (st.s) ve küçük yazılar (dekupe vb.) ayrı gruplarda
    // =====================================================================
    let letters = '';
    let litLetters = '';
    const dpx = (cm) => clamp(cm * pxPerCm * 0.55, 3, 16);
    defs.push(`<filter id="${idp}dsh" x="-10%" y="-20%" width="130%" height="170%"><feDropShadow dx="2.5" dy="4.5" stdDeviation="3.5" flood-color="#000" flood-opacity="${night ? 0.55 : 0.32}"/></filter>`);
    const gS = `url(#${idp}gS)`;
    const gG = `url(#${idp}gG)`;

    /** gid: 'lt' | 'ls'; method: strateji kimliği; c: { arr, small, backing } */
    function drawGroup(gid, method, c) {
      const Uu = (extra = '') => Ug(gid, extra);
      const minS = minOf(c.arr);
      const glow = (color, strength = 1) => {
        const b1 = clamp(minS * 0.07, 1.5, 9);
        const b2 = clamp(minS * 0.28, 5, 34);
        defs.push(`<filter id="${idp}b1${gid}" x="-20%" y="-80%" width="140%" height="260%"><feGaussianBlur stdDeviation="${r1(b1)}"/></filter>`);
        defs.push(`<filter id="${idp}b2${gid}" x="-30%" y="-120%" width="160%" height="340%"><feGaussianBlur stdDeviation="${r1(b2)}"/></filter>`);
        return (
          Uu(`fill="${color}" filter="url(#${idp}b2${gid})" opacity="${r1(0.55 * strength)}" stroke="${color}" stroke-width="${r1(minS * 0.12)}"`) +
          Uu(`fill="${color}" filter="url(#${idp}b1${gid})" opacity="${r1(0.9 * strength)}"`)
        );
      };
      const extr = (n, fill, dx = 0.55, dy = 0.7) => {
        let out = '';
        for (let k = n; k >= 1; k--) out += Uu(`x="${r1(k * dx)}" y="${r1(k * dy)}" fill="${fill}"`);
        return out;
      };

      switch (method) {
        case 'kutu_isikli':
        case 'kutu_isiksiz': {
          const isLit = method === 'kutu_isikli';
          const pc = plexiOf(o.pc);
          const n = Math.round(dpx(o.dp));
          const clear = pc.clear;
          let sideFill; let sideLit = false;
          if (o.side === 'plexi') {
            const bc = o.bc === 'same' ? pc : plexiOf(o.bc);
            sideFill = night && isLit ? mix(bc.hex, led.hex, 0.35) : shade(bc.hex, -0.16);
            sideLit = isLit;
          } else {
            const sc = find(SIDE_COLORS, o.sc);
            sideFill = sc.metal === 'gold' ? gG : sc.metal === 'silver' ? gS : sc.hex;
          }
          if (isLit && night) {
            const dark = lum(pc.hex) < 0.12;
            const gcol = dark ? pc.hex : lum(pc.hex) > 0.8 ? led.glow : mix(pc.hex, led.glow, 0.2);
            const strength = dark ? 0.2 : 1;
            const faceCol = dark ? shade(pc.hex, 0.1) : mix(lum(pc.hex) > 0.8 ? led.hex : pc.hex, '#ffffff', 0.2);
            if (!sideLit) letters += `<g filter="url(#${idp}dsh)">${extr(n, sideFill)}</g>`;
            litLetters += glow(gcol, strength);
            if (sideLit) litLetters += extr(n, shade(sideFill, 0.25));
            litLetters += Uu(`fill="${faceCol}" stroke="${shade(gcol, 0.2)}" stroke-width=".7"`);
            litLetters += Uu(`fill="url(#${idp}shine)" opacity=".18"`);
          } else {
            letters += `<g filter="url(#${idp}dsh)">${extr(n, sideFill)}${Uu(`fill="${pc.hex}" ${clear ? 'fill-opacity=".85"' : ''} stroke="${shade(pc.hex, -0.28)}" stroke-width=".7"`)}${Uu(`fill="url(#${idp}shine)" opacity=".5"`)}</g>`;
          }
          break;
        }
        case 'krom': {
          const metal = o.ks === 'altin' ? gG : gS;
          const metalHex = o.ks === 'altin' ? '#c99b34' : '#aab2bb';
          const n = Math.round(dpx(o.dp));
          const fw = r1(clamp(minS * 0.035, 1.2, 4));
          const pc = plexiOf(o.pc);
          const isLit = o.kl === 1 && o.kt !== 'tam';
          if (o.kt === 'tam') {
            letters += `<g filter="url(#${idp}dsh)">${extr(n, metal)}${Uu(`fill="${metal}" stroke="${metalHex}" stroke-width=".6"`)}${Uu(`fill="url(#${idp}shine)" opacity=".35"`)}</g>`;
          } else if (isLit && night) {
            const dark = lum(pc.hex) < 0.12;
            const gcol = dark ? pc.hex : lum(pc.hex) > 0.8 ? led.glow : mix(pc.hex, led.glow, 0.2);
            const faceCol = dark ? shade(pc.hex, 0.1) : mix(lum(pc.hex) > 0.8 ? led.hex : pc.hex, '#ffffff', 0.2);
            letters += `<g filter="url(#${idp}dsh)">${extr(n, metal)}</g>`;
            litLetters += glow(gcol, dark ? 0.2 : 0.85);
            if (o.kt === 'fileli') litLetters += Uu(`fill="${metal}" stroke="${metal}" stroke-width="${fw * 2}" stroke-linejoin="round"`);
            litLetters += Uu(`fill="${faceCol}"`);
          } else {
            letters += `<g filter="url(#${idp}dsh)">${extr(n, metal)}`;
            if (o.kt === 'fileli') letters += Uu(`fill="${metal}" stroke="${metal}" stroke-width="${fw * 2}" stroke-linejoin="round"`);
            letters += `${Uu(`fill="${pc.hex}" stroke="${shade(pc.hex, -0.25)}" stroke-width=".5"`)}${Uu(`fill="url(#${idp}shine)" opacity=".5"`)}</g>`;
          }
          break;
        }
        case 'kabartma': {
          // küçük yazılarda: ön yüz pleksisiyle aynı renkte ince kabartma düz harf
          const it = c.small ? { hex: plexiOf(o.pc).hex } : kabartmaColor(st);
          const f = c.small ? { defs: '', fill: it.hex, base: it.hex } : fillFor(it, idp, 'k');
          defs.push(f.defs);
          const n = c.small ? 2 : Math.round(clamp(o.kk * 0.35, 1.5, 7));
          const side = shade(f.base, -0.38);
          letters += `<g filter="url(#${idp}dsh)">${extr(n, side, 0.5, 0.65)}${Uu(`fill="${f.fill}" stroke="${shade(f.base, -0.2)}" stroke-width=".5"`)}${Uu(`fill="url(#${idp}shine)" opacity="${it.mirror ? 0.25 : 0.4}"`)}</g>`;
          break;
        }
        case 'lazer': {
          const lf = find(LASER_FINISH, o.lf);
          const f = fillFor(lf, idp, 'l');
          defs.push(f.defs);
          const n = Math.round(clamp(o.lk * 0.5, 1.5, 4));
          letters += `<g filter="url(#${idp}dsh)">${extr(n, shade(f.base, -0.42), 0.4, 0.5)}${Uu(`fill="${f.fill}" stroke="${shade(f.base, -0.25)}" stroke-width=".5"`)}${Uu(`fill="url(#${idp}shine)" opacity=".28"`)}</g>`;
          break;
        }
        case 'baski': {
          if (c.small) {
            // küçük yazılarda folyo rengi zeminle zıt seçilir
            letters += Uu(`fill="${hasZ && lum(zFill.base) < 0.5 ? '#f6f6f3' : '#16171b'}"`);
          } else {
            const fc = find(FOIL_COLORS, o.fc);
            const f = fillFor(fc, idp, 'b');
            defs.push(f.defs);
            letters += Uu(`fill="${f.fill}"`);
          }
          break;
        }
        case 'dekupe': {
          const backing = c.backing || o.df;
          const pc = plexiOf(o.pc);
          // panelin altındaki katman: boşsa duvar, doluysa pleksi
          under.push(backing === 'bos' ? Uu(`fill="${night ? '#0b0e14' : '#cfc8ba'}"`) : Uu(`fill="${pc.hex}"`));
          letters += Uu(`fill="none" stroke="rgba(0,0,0,.45)" stroke-width="1"`);
          if (backing === 'led' && night) {
            const gcol = lum(pc.hex) > 0.8 ? led.glow : mix(pc.hex, led.glow, 0.2);
            litLetters += glow(gcol, 0.55);
            litLetters += Uu(`fill="${mix(lum(pc.hex) > 0.8 ? led.hex : pc.hex, '#ffffff', 0.25)}"`);
          }
          break;
        }
        default:
          break;
      }
    }

    if (mainLaid.length) {
      // ana yazılar; dekupe ise panel yoksa çizilmez (normalize zemini zorunlu kılar)
      if (st.s !== 'dekupe' || hasZ) drawGroup('lt', st.s, { arr: mainLaid, small: false, backing: null });
    }
    if (smallLaid.length && sp) drawGroup('ls', sp.method, { arr: smallLaid, small: true, backing: sp.backing });

    // Önizlemede küçük yazı kuralını açıkça göster
    if (meta.small) {
      const NAME = { dekupe: 'dekupe', kabartma: 'kabartma düz harf', baski: 'folyo' };
      const MAIN = { kutu_isikli: 'ışıklı kutu harf', kutu_isiksiz: 'kutu harf', krom: 'krom harf' }[st.s];
      const label = `Büyük yazı: ${MAIN} · Küçük yazı: ${NAME[meta.small.method]}`;
      const lw = label.length * 8.9 + 34;
      hud.push(
        `<g transform="translate(14 14)"><rect width="${r1(lw)}" height="32" rx="16" fill="${night ? '#1b2231' : '#fff'}" stroke="${night ? '#38425a' : '#d6cfbf'}"/>` +
        `<circle cx="17" cy="16" r="4.5" fill="#b8913a"/><text x="30" y="21" font-size="15.5" font-family="Inter, Arial, sans-serif" font-weight="600" fill="${dimLabel}">${esc(label)}</text></g>`,
      );
    }

    baseLayer.push(under.join(''));
    baseLayer.push(panel);
    baseLayer.push(logoSVG());
    baseLayer.push(letters);
    litLayer.push(litLetters);
  }

  // ---- ölçü çizgileri
  const dtxt = (x, y, t, rot = 0) => {
    const w = t.length * 7.2 + 14;
    return `<g transform="translate(${r1(x)} ${r1(y)})${rot ? ` rotate(${rot})` : ''}"><rect x="${-w / 2}" y="-10" width="${w}" height="20" rx="10" fill="${night ? '#1b2231' : '#fff'}" stroke="${night ? '#38425a' : '#d6cfbf'}"/><text y="4.2" text-anchor="middle" font-size="12" font-family="Inter, Arial, sans-serif" font-weight="600" fill="${dimLabel}">${esc(t)}</text></g>`;
  };
  const fmt = (n) => String(Math.round(n * 10) / 10).replace('.', ',');
  const ly = sy - 24;
  const lx = sx - 26;
  const lc = night ? '#6b7690' : '#8a8374';
  hud.push(
    `<g stroke="${lc}" stroke-width="1.2" fill="none">` +
      `<path d="M${sx} ${ly} H${sx + sw} M${sx} ${ly - 5} V${ly + 5} M${sx + sw} ${ly - 5} V${ly + 5}"/>` +
      `<path d="M${lx} ${sy} V${sy + sh} M${lx - 5} ${sy} H${lx + 5} M${lx - 5} ${sy + sh} H${lx + 5}"/>` +
    `</g>`,
    dtxt(sx + sw / 2, ly, `${fmt(st.w)} cm`),
    dtxt(lx, sy + sh / 2, `${fmt(st.h)} cm`, -90),
  );

  // ---- gece örtüsü
  const overlay = night
    ? `<rect width="${CW}" height="${CH}" fill="${dim}" opacity="${st.p === 'germe' ? 0.5 : 0.52}"/>`
    : '';

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CW} ${CH}" role="img" aria-label="${esc(`Tabela önizlemesi: ${prod.name}, ${st.w} × ${st.h} cm${lines.length ? ', yazı: ' + lines.map((l) => l.t).join(' / ') : ''}${night ? ', gece görünümü' : ', gündüz görünümü'}`)}" preserveAspectRatio="xMidYMid meet">` +
    `<defs>${defs.join('')}</defs>` +
    baseLayer.join('') +
    overlay +
    litLayer.join('') +
    hud.join('') +
    `</svg>`;

  meta = { ...meta, width: CW, height: CH };
  return { svg, width: CW, height: CH, meta };
}
