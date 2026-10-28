// Sihirbaz durumu: varsayılanlar, doğrulama (normalize) ve paylaşılabilir bağlantı kodlaması.
import {
  PRODUCTS, STRATEGIES, ZEMIN_MATERIALS, THICKNESS, PALETTES, SIDE_COLORS, KROM_SIDES,
  LED_BRANDS, LED_COLORS, FRAME_COLORS, FONTS, GERME_COLORS, GERME_INK, DEPTHS, CORNERS,
  LASER_MATERIALS, LASER_FINISH, FIX_TYPES, SERVICE_OPTIONS, PLEXI_COLORS, FOIL_COLORS, PRESETS,
  DEKOTA_COLORS, COMPOSITE_COLORS, MIRROR_DEKOTA_COLORS,
  EASY_TYPES, EASY_COLORS, EASY_BG_IDS, EASY_LIGHTS, EASY_METALS, DEFAULT_EASY,
} from '../data/catalog.mjs';

export const STATE_VERSION = 1;

export const getProduct = (id) => PRODUCTS.find((p) => p.id === id) || PRODUCTS[0];

const ids = (list) => list.map((x) => x.id);
const vals = (list) => list.map((x) => x.v);

/** Malzeme + palet eşlemesi: harf malzemeleri */
export const LETTER_MATS = {
  pleksi: { name: 'Pleksi', brand: 'Akpolimer', thick: 'pleksi', palette: PLEXI_COLORS },
  dekota: { name: 'Dekota', thick: 'dekota', palette: DEKOTA_COLORS },
  aynali: { name: 'Aynalı Dekota', thick: 'aynali', palette: MIRROR_DEKOTA_COLORS },
  kompozit: { name: 'Alüminyum Kompozit', brand: 'Sistem', thick: 'kompozit', palette: COMPOSITE_COLORS },
};

export function defaultOpts() {
  return {
    // pleksi ön yüz (kutu harf / krom / dekupe dolgu)
    pc: 'opal', pt: 2.8,
    // yan yüzey: 'plexi' (pleksi bant) | 'solid' (renkli yan)
    side: 'solid', sc: 'antrasit', bc: 'same', dp: 6,
    // LED
    lb: 'standart', lc: 'beyaz',
    // krom
    kt: 'fileli', ks: 'gumus', kl: 1,
    // kabartma
    km: 'pleksi', kk: 4.5, kr: 'opal',
    // dekupe
    df: 'bos',
    // lazer
    lm: 'inox', lk: 3, lf: 'firca',
    // baskı / folyo
    fc: 'f-beyaz', fm: 'folyo',
  };
}

export function defaultState(product = 'cephe') {
  const p = getProduct(product);
  const [w, h] = [p.size.w[2], p.size.h[2]];
  const s = {
    v: STATE_VERSION,
    m: 'e', // 'e' = kolay mod, 'p' = detaylı mod
    e: { ...DEFAULT_EASY },
    p: p.id,
    w, h, q: 1,
    L: [{ t: 'FİRMA ADINIZ', s: 'L' }, { t: '', s: 'M' }, { t: '', s: 'S' }, { t: '', s: 'S' }],
    f: 'montserrat', up: 1, fit: 90, logo: 0,
    z: p.zemin === 'none' ? 0 : 1,
    zm: 'kompozit', zt: 3, zc: 'k-antrasit', cr: 'duz',
    s: p.defaultStrategy,
    o: defaultOpts(),
    sv: 'montaj', fx: 'distans',
    fr: 'beyaz', sd: 'tek', gc: 'g-lacivert', gi: 'auto',
    n: {},
    c: { name: '', phone: '', firm: '', city: '', b2b: 0 },
  };
  if (p.id === 'kapi') { s.zc = 'k-beyaz'; s.o.kr = 'opal'; s.L[0].t = 'DR. AD SOYAD'; s.L[1].t = 'Uzman Doktor'; }
  if (p.id === 'totem') { s.zc = 'k-antrasit'; s.L[1].t = 'Slogan veya alt başlık'; }
  if (p.id === 'cephe') { s.zc = 'k-antrasit'; }
  if (p.id === 'germe') { s.L[1].t = 'alt başlık / slogan'; }
  return s;
}

const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const num = (v, d) => (Number.isFinite(+v) ? +v : d);
const pick = (list, v, d) => (list.includes(v) ? v : d);
const str = (v, max, d = '') => (typeof v === 'string' ? v.slice(0, max) : d);

export function paletteFor(key) {
  return PALETTES[key] || PLEXI_COLORS;
}

/** Her türlü dış girdiyi (URL, eski sürüm) geçerli bir duruma çevirir */
export function normalize(input) {
  const base = defaultState(typeof input?.p === 'string' ? input.p : 'cephe');
  const src = input && typeof input === 'object' ? input : {};
  const p = getProduct(src.p);
  const s = { ...base, p: p.id };

  s.m = src.m === 'p' ? 'p' : 'e';
  const e = src.e && typeof src.e === 'object' ? src.e : {};
  s.e = {
    t: pick(ids(EASY_TYPES), e.t, DEFAULT_EASY.t),
    b: pick([0, 1, 2], num(e.b, NaN), DEFAULT_EASY.b),
    c: pick(ids(EASY_COLORS), e.c, DEFAULT_EASY.c),
    g: pick(EASY_BG_IDS, e.g, DEFAULT_EASY.g),
    l: pick(ids(EASY_LIGHTS), e.l, DEFAULT_EASY.l),
    m: pick(ids(EASY_METALS), e.m, DEFAULT_EASY.m),
  };

  s.w = clamp(num(src.w, p.size.w[2]), p.size.w[0], p.size.w[1]);
  s.h = clamp(num(src.h, p.size.h[2]), p.size.h[0], p.size.h[1]);
  s.q = clamp(Math.round(num(src.q, 1)), 1, 999);

  if (Array.isArray(src.L)) {
    s.L = base.L.map((d, i) => {
      const x = src.L[i];
      if (!x || typeof x !== 'object') return { t: i === 0 ? d.t : '', s: d.s };
      return { t: str(x.t, 60), s: pick(['L', 'M', 'S'], x.s, d.s) };
    });
  }
  s.f = pick(ids(FONTS), src.f, base.f);
  s.up = src.up === 0 || src.up === false ? 0 : 1;
  s.fit = clamp(num(src.fit, 90), 40, 100);
  s.logo = src.logo ? 1 : 0;

  s.z = p.zemin === 'none' ? 0 : p.zemin === 'required' ? 1 : src.z === 0 || src.z === false ? 0 : 1;
  s.zm = pick(ids(ZEMIN_MATERIALS), src.zm, base.zm);
  const zMat = ZEMIN_MATERIALS.find((m) => m.id === s.zm);
  s.zt = pick(vals(THICKNESS[zMat.thick]), num(src.zt, NaN), THICKNESS[zMat.thick][0].v);
  const zPal = paletteFor(zMat.palette);
  s.zc = pick(ids(zPal), src.zc, zPal.some((c) => c.id === base.zc) ? base.zc : zPal[0].id);
  s.cr = pick(ids(CORNERS), src.cr, 'duz');

  const strategies = p.strategies;
  s.s = pick(strategies, src.s, p.defaultStrategy);

  const o = { ...defaultOpts(), ...(src.o && typeof src.o === 'object' ? src.o : {}) };
  const d = defaultOpts();
  o.pc = pick(ids(PLEXI_COLORS), o.pc, d.pc);
  o.pt = pick(vals(THICKNESS.pleksi), num(o.pt, NaN), d.pt);
  o.side = pick(['plexi', 'solid'], o.side, d.side);
  o.sc = pick(ids(SIDE_COLORS), o.sc, d.sc);
  o.bc = o.bc === 'same' ? 'same' : pick(ids(PLEXI_COLORS), o.bc, 'same');
  o.dp = pick(vals(DEPTHS), num(o.dp, NaN), d.dp);
  o.lb = pick(ids(LED_BRANDS), o.lb, d.lb);
  o.lc = pick(ids(LED_COLORS), o.lc, d.lc);
  o.kt = pick(['fileli', 'filesiz', 'tam'], o.kt, d.kt);
  o.ks = pick(ids(KROM_SIDES), o.ks, d.ks);
  o.kl = o.kl === 0 || o.kl === false ? 0 : 1;
  o.km = pick(Object.keys(LETTER_MATS), o.km, d.km);
  const km = LETTER_MATS[o.km];
  o.kk = pick(vals(THICKNESS[km.thick]), num(o.kk, NaN), THICKNESS[km.thick][0].v);
  o.kr = pick(ids(km.palette), o.kr, km.palette[0].id);
  o.df = pick(['bos', 'pleksi', 'led'], o.df, d.df);
  o.lm = pick(ids(LASER_MATERIALS), o.lm, d.lm);
  o.lk = pick(vals(THICKNESS.metal), num(o.lk, NaN), d.lk);
  o.lf = pick(ids(LASER_FINISH), o.lf, d.lf);
  o.fc = pick(ids(FOIL_COLORS), o.fc, d.fc);
  o.fm = pick(['folyo', 'baski'], o.fm, d.fm);
  s.o = o;

  s.sv = pick(ids(SERVICE_OPTIONS), src.sv, 'montaj');
  s.fx = pick(ids(FIX_TYPES), src.fx, 'distans');
  s.fr = pick(ids(FRAME_COLORS), src.fr, 'beyaz');
  s.sd = pick(['tek', 'cift'], src.sd, 'tek');
  s.gc = pick(ids(GERME_COLORS), src.gc, 'g-lacivert');
  s.gi = pick(ids(GERME_INK), src.gi, 'auto');

  s.n = {};
  if (src.n && typeof src.n === 'object') {
    for (const [k, v] of Object.entries(src.n)) {
      if (/^[a-z_]{1,24}$/.test(k) && typeof v === 'string' && v.trim()) s.n[k] = v.slice(0, 400);
    }
  }
  const c = src.c && typeof src.c === 'object' ? src.c : {};
  s.c = {
    name: str(c.name, 60), phone: str(c.phone, 24), firm: str(c.firm, 80),
    city: str(c.city, 60), b2b: c.b2b ? 1 : 0,
  };

  // Kurallar: dekupe ve kapı/totem için zemin zorunlu
  if (s.s === 'dekupe') s.z = 1;
  return s;
}

/** Ürün değişince boyutları yeni ürüne uyarlar, diğer seçimleri korur */
export function switchProduct(prev, productId) {
  const next = defaultState(productId);
  const merged = {
    ...next,
    m: prev.m, e: { ...prev.e },
    f: prev.f, up: prev.up, fit: prev.fit, logo: prev.logo, c: prev.c, sv: prev.sv, q: prev.q,
    o: { ...prev.o },
    zm: prev.zm, zt: prev.zt, cr: prev.cr,
    fr: prev.fr, sd: prev.sd, gc: prev.gc, gi: prev.gi,
  };
  // Ürüne özgü örnek metinler: kullanıcı değiştirmediyse yenisini göster
  const prevDefaults = defaultState(prev.p).L.map((x) => x.t);
  merged.L = prev.L.map((x, i) => ({ ...x, t: x.t === prevDefaults[i] ? next.L[i].t : x.t }));
  // Zemin rengi yalnızca varsayılan olarak bırakıldıysa yeni ürünün varsayılanına geçer
  merged.zc = prev.zc === defaultState(prev.p).zc ? next.zc : prev.zc;
  if (getProduct(productId).strategies.includes(prev.s)) merged.s = prev.s;
  return normalize(merged);
}

// ---------------------------------------------------------------------------
// Paylaşılabilir bağlantı: varsayılandan farklı alanlar + base64url
// ---------------------------------------------------------------------------
function diff(a, d) {
  const out = {};
  for (const k of Object.keys(a)) {
    const va = a[k];
    const vd = d[k];
    if (va && typeof va === 'object' && !Array.isArray(va) && vd && typeof vd === 'object') {
      const sub = diff(va, vd);
      if (Object.keys(sub).length) out[k] = sub;
    } else if (JSON.stringify(va) !== JSON.stringify(vd)) {
      out[k] = va;
    }
  }
  return out;
}

function b64urlEncode(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(code) {
  const b64 = code.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((code.length + 3) % 4);
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeState(state) {
  const d = defaultState(state.p);
  const delta = diff(state, d);
  delete delta.v;
  delta.p = state.p;
  delta.v = STATE_VERSION;
  return b64urlEncode(JSON.stringify(delta));
}

export function decodeState(code) {
  try {
    const delta = JSON.parse(b64urlDecode(code));
    if (!delta || typeof delta !== 'object') return null;
    const base = defaultState(delta.p);
    const merged = deepMerge(base, delta);
    return normalize(merged);
  } catch {
    return null;
  }
}

function deepMerge(base, delta) {
  const out = Array.isArray(base) ? base.slice() : { ...base };
  for (const k of Object.keys(delta)) {
    const bv = base[k];
    const dv = delta[k];
    if (dv && typeof dv === 'object' && !Array.isArray(dv) && bv && typeof bv === 'object' && !Array.isArray(bv)) {
      out[k] = deepMerge(bv, dv);
    } else {
      out[k] = dv;
    }
  }
  return out;
}

/** Hazır şablonu uygular; kullanıcının yazdığı metin ve iletişim bilgileri korunur */
export function applyPreset(prev, preset) {
  const base = defaultState(preset.patch.p);
  const s = normalize(deepMerge(base, preset.patch));
  s.c = prev.c;
  s.m = prev.m;
  s.e = { ...prev.e };
  s.q = prev.q;
  s.f = prev.f;
  s.up = prev.up;
  // Örnek metinleri (varsayılanlar ve diğer şablonlar) kullanıcı yazısı saymayız
  const known = new Set(['']);
  for (const prod of PRODUCTS) defaultState(prod.id).L.forEach((x) => known.add(x.t));
  for (const t of PRESETS) (t.patch.L || []).forEach((x) => known.add(x.t));
  const edited = prev.L.some((x) => !known.has(x.t));
  if (edited) s.L = prev.L.map((x) => ({ ...x }));
  return normalize(s);
}
