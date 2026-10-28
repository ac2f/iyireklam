// Seçimlerden şartname satırları, fiyat seviyesi ve ipuçları üretir.
import {
  COST_LEVELS, THICKNESS, DEPTHS, SIDE_COLORS, KROM_SIDES, LED_BRANDS, LED_COLORS, FRAME_COLORS,
  FONTS, GERME_COLORS, GERME_INK, CORNERS, LASER_MATERIALS, LASER_FINISH, FIX_TYPES,
  SERVICE_OPTIONS, PLEXI_COLORS, FOIL_COLORS, STRATEGIES, ZEMIN_MATERIALS, fmtMm, SMALL_TEXT_CM,
} from '../data/catalog.mjs';
import { LETTER_MATS, getProduct, paletteFor, encodeState } from './state.js';

export const find = (list, id) => list.find((x) => x.id === id) || list[0];
export const findV = (list, v) => list.find((x) => x.v === v) || list[0];

export function costOf(list, key, val) {
  const it = list.find((x) => x[key] === val);
  return it && typeof it.cost === 'number' ? it.cost : 0;
}

export function cheapest(list) {
  let best = list[0];
  for (const x of list) if ((x.cost ?? 0) < (best.cost ?? 0)) best = x;
  return best;
}

export const upper = (s) => s.toLocaleUpperCase('tr-TR');

/** Palet öğesinin fiyat etkisi: düz renk en uygun; aynalı/desenli/metalik yüzeyler daha pahalı */
export function itemCost(it) {
  if (!it) return 0;
  if (it.mirror) return 2;
  if (['wood', 'marble', 'stone', 'brushed', 'metal'].includes(it.pat)) return 1;
  return 0;
}
const PAL_BEST = 'düz renkli bir seçenek';

export function lineText(st, i) {
  const t = (st.L[i]?.t || '').trim();
  return st.up ? upper(t) : t;
}

export function activeLines(st) {
  const max = getProduct(st.p).maxLines;
  const out = [];
  for (let i = 0; i < Math.min(max, st.L.length); i++) {
    const t = lineText(st, i);
    if (t) out.push({ i, t, s: st.L[i].s });
  }
  return out;
}

export const hasZemin = (st) => getProduct(st.p).zemin !== 'none' && !!st.z;
export const isLit = (st) =>
  st.s === 'kutu_isikli' ||
  (st.s === 'krom' && st.o.kl === 1 && st.o.kt !== 'tam') ||
  (st.s === 'dekupe' && st.o.df === 'led') ||
  st.p === 'germe';

/** Küçük yazı kuralı yalnızca hacimli (kutu) harf sistemlerinde geçerlidir */
export const BOX_STRATS = ['kutu_isikli', 'kutu_isiksiz', 'krom'];

/**
 * Harf yüksekliği SMALL_TEXT_CM altındaki satırlar için uygulanacak yöntem.
 * @returns {null | {method:'dekupe'|'kabartma'|'baski', backing:string|null}} null = küçük yazılar ana sistemle yapılır
 */
export function smallPlan(st) {
  if (!BOX_STRATS.includes(st.s)) return null;
  let m = st.sm;
  if (m === 'same') return null;
  if (m === 'auto' || m === 'dekupe') m = hasZemin(st) ? 'dekupe' : 'kabartma'; // dekupe için panel gerekir
  if (m === 'dekupe') {
    const backing = st.sb === 'auto' ? (isLit(st) ? 'led' : 'bos') : st.sb;
    return { method: 'dekupe', backing };
  }
  return { method: m, backing: null };
}

export const plexiOf = (id) => find(PLEXI_COLORS, id);
export const ledColor = (id) => find(LED_COLORS, id);

/** Hangi gruplar hangi seçimlerde görünür: UI ve şartname aynı kuralı kullanır */
export function visible(st) {
  const p = getProduct(st.p);
  const s = st.s;
  const lit = isLit(st);
  return {
    zemin: hasZemin(st),
    zeminToggle: p.zemin === 'optional',
    plexiFront: s === 'kutu_isikli' || s === 'kutu_isiksiz' || (s === 'krom' && st.o.kt !== 'tam') || (s === 'dekupe' && st.o.df !== 'bos'),
    sides: s === 'kutu_isikli' || s === 'kutu_isiksiz',
    depth: s === 'kutu_isikli' || s === 'kutu_isiksiz' || s === 'krom',
    led: lit && p.id !== 'germe',
    krom: s === 'krom',
    kromLit: s === 'krom' && st.o.kt !== 'tam',
    kabartma: s === 'kabartma',
    dekupe: s === 'dekupe',
    lazer: s === 'lazer',
    baski: s === 'baski' && p.id !== 'germe',
    germe: p.id === 'germe',
    fix: p.id === 'kapi',
  };
}

export function zeminMat(st) {
  return find(ZEMIN_MATERIALS, st.zm);
}

export function zeminColor(st) {
  return find(paletteFor(zeminMat(st).palette), st.zc);
}

export function kabartmaMat(st) {
  return LETTER_MATS[st.o.km];
}

export function kabartmaColor(st) {
  return find(kabartmaMat(st).palette, st.o.kr);
}

export function gradeLevel(avg) {
  if (avg < 0.5) return { id: 0, label: 'Ekonomik', desc: 'Seçimleriniz genel olarak en uygun maliyet çizgisinde.' };
  if (avg < 1.15) return { id: 1, label: 'Dengeli', desc: 'Fiyat/performans dengesi yüksek, standart seviye bir tabela.' };
  if (avg < 1.8) return { id: 2, label: 'Premium', desc: 'Malzeme ve işçilik seçimleriniz fiyatı yukarı taşıyor.' };
  return { id: 3, label: 'Üst Segment', desc: 'Gösterişli ve yüksek maliyetli bir yapı; kalemleri tek tek gözden geçirebiliriz.' };
}

/**
 * Şartname satırları. Her satır: { k (not anahtarı), label, value, cost, tip, group }
 * meta: renderer'dan gelen ölçüler (harf yüksekliği vs.)
 */
export function buildRows(st, meta) {
  meta = meta || {};
  const v = visible(st);
  const o = st.o;
  const rows = [];
  const add = (r) => rows.push(r);
  const prod = getProduct(st.p);

  // --- Ürün & ölçü
  add({ g: 'Ürün', k: 'urun', label: 'Ürün tipi', value: prod.name });
  add({ g: 'Ürün', k: 'olcu', label: 'Ölçü (G × Y)', value: `${fmt(st.w)} × ${fmt(st.h)} cm` + (st.q > 1 ? ` · ${st.q} adet` : ' · 1 adet') });

  // --- Metin
  const lines = activeLines(st);
  const font = find(FONTS, st.f);
  const letterInfo = (meta.lines || [])
    .map((l) => `${fmt(Math.round(l.capCm * 10) / 10)} cm`)
    .join(' / ');
  add({
    g: 'Ürün', k: 'metin', label: 'Metin',
    value: lines.length ? lines.map((l) => `“${l.t}”`).join('  ·  ') : 'Henüz yazı girilmedi',
  });
  add({
    g: 'Ürün', k: 'yazitipi', label: 'Yazı tipi',
    value: `${font.name} (${font.family})${st.up ? ' · büyük harf' : ''}` + (letterInfo ? ` · yaklaşık harf yüksekliği: ${letterInfo}` : ''),
  });
  if (st.logo) add({ g: 'Ürün', k: 'logo', label: 'Logo / amblem', value: 'Var — dosyayı WhatsApp veya e-posta ile ileteceğim' });

  // --- Zemin
  if (v.zemin) {
    const zm = zeminMat(st);
    add({ g: 'Zemin', k: 'zemin', label: 'Zemin malzemesi', value: zm.name + (zm.brand ? ` (${zm.brand})` : ''), cost: zm.cost, tipList: ZEMIN_MATERIALS, tipKey: 'name' });
    add({ g: 'Zemin', k: 'zemin_kalinlik', label: 'Zemin kalınlığı', value: fmtMm(st.zt), cost: costOf(THICKNESS[zm.thick], 'v', st.zt), tipList: THICKNESS[zm.thick].map((t) => ({ ...t, name: fmtMm(t.v) })), tipKey: 'name' });
    const zc = zeminColor(st);
    add({ g: 'Zemin', k: 'zemin_renk', label: 'Zemin rengi / deseni', value: zc.name + (zc.grp ? ` (${zc.grp})` : ''), cost: itemCost(zc), best: itemCost(zc) >= 2 ? PAL_BEST : undefined });
    add({ g: 'Zemin', k: 'kose', label: 'Köşe', value: find(CORNERS, st.cr).name, cost: find(CORNERS, st.cr).cost, tipList: CORNERS, tipKey: 'name' });
  } else if (prod.zemin !== 'none') {
    add({ g: 'Zemin', k: 'zemin', label: 'Zemin', value: 'Zeminsiz — harfler doğrudan yüzeye monte edilir', cost: 0 });
  }

  // --- Germe
  if (v.germe) {
    add({ g: 'Germe', k: 'cerceve', label: 'Alüminyum çerçeve rengi', value: find(FRAME_COLORS, st.fr).name, cost: find(FRAME_COLORS, st.fr).cost, tipList: FRAME_COLORS, tipKey: 'name' });
    add({ g: 'Germe', k: 'yuz', label: 'Yüz sayısı', value: st.sd === 'cift' ? 'Çift taraflı' : 'Tek taraflı', cost: st.sd === 'cift' ? 2 : 0, tipList: [{ name: 'Tek taraflı', cost: 0 }, { name: 'Çift taraflı', cost: 2 }], tipKey: 'name' });
    add({ g: 'Germe', k: 'kumas', label: 'Baskı zemin rengi', value: find(GERME_COLORS, st.gc).name });
    add({ g: 'Germe', k: 'yazi_rengi', label: 'Yazı rengi', value: find(GERME_INK, st.gi).name });
    add({ g: 'Germe', k: 'sistem', label: 'Uygulama', value: 'Dijital baskılı germe kumaş (arkadan LED aydınlatmalı)', cost: 0 });
  }

  // --- Harf sistemi
  if (!v.germe) {
    const strat = STRATEGIES[st.s];
    add({
      g: 'Harf', k: 'sistem', label: 'Harf sistemi', value: strat.name, cost: strat.cost,
      tipList: prod.strategies.map((id) => STRATEGIES[id]), tipKey: 'name',
    });
    const sp = smallPlan(st);
    if (meta.small && meta.small.lines.length && sp) {
      const NAME = { dekupe: 'Dekupe (zeminden oyma)', kabartma: 'Kabartma düz harf', baski: 'Folyo / baskı' };
      const BACK = { bos: 'arkası açık', pleksi: 'arkadan renkli pleksi dolgu', led: 'arkadan pleksi + LED' };
      add({
        g: 'Harf', k: 'kucuk_yazi', label: `Küçük yazılar (${SMALL_TEXT_CM} cm altı)`,
        value: `${NAME[sp.method]}${sp.method === 'dekupe' ? ` — ${BACK[sp.backing]}` : ''} · ${meta.small.lines.map((t) => `“${t}”`).join(', ')}`,
        cost: sp.method === 'dekupe' ? { bos: 0, pleksi: 1, led: 3 }[sp.backing] : sp.method === 'kabartma' ? 1 : 0,
      });
    } else if (meta.tiny && meta.tiny.length && BOX_STRATS.includes(st.s) && !sp) {
      add({
        g: 'Harf', k: 'kucuk_yazi', label: `Küçük yazılar (${SMALL_TEXT_CM} cm altı)`,
        value: `Kutu harf olarak yapılacak — ${SMALL_TEXT_CM} cm altı harflerde imalat zordur · ${meta.tiny.map((t) => `“${t}”`).join(', ')}`,
        cost: 2,
      });
    }
  }

  if (v.plexiFront) {
    const label = st.s === 'dekupe' ? 'Arka dolgu pleksisi' : 'Ön yüz pleksisi';
    add({ g: 'Harf', k: 'on_kalinlik', label: `${label} — kalınlık`, value: fmtMm(o.pt), cost: costOf(THICKNESS.pleksi, 'v', o.pt), tipList: THICKNESS.pleksi.map((t) => ({ ...t, name: fmtMm(t.v) })), tipKey: 'name' });
    const pc = find(PLEXI_COLORS, o.pc);
    add({ g: 'Harf', k: 'on_renk', label: `${label} — renk`, value: `${pc.name} (Akpolimer)`, cost: itemCost(pc), best: itemCost(pc) >= 2 ? PAL_BEST : undefined });
  }

  if (v.sides) {
    if (o.side === 'plexi') {
      const bc = o.bc === 'same' ? find(PLEXI_COLORS, o.pc) : find(PLEXI_COLORS, o.bc);
      add({
        g: 'Harf', k: 'yan', label: 'Yan yüzey',
        value: `${st.s === 'kutu_isikli' ? 'Pleksi ışıklı bant' : 'Pleksi bant (ışıksız)'} — ${o.bc === 'same' ? 'ön yüzle aynı renk' : bc.name}`,
        cost: st.s === 'kutu_isikli' ? 2 : 1,
      });
    } else {
      const sc = find(SIDE_COLORS, o.sc);
      add({ g: 'Harf', k: 'yan', label: 'Yan yüzey', value: `Işıksız yan bant — ${sc.name}`, cost: sc.cost, tipList: SIDE_COLORS, tipKey: 'name' });
    }
  }
  if (v.depth) {
    add({ g: 'Harf', k: 'derinlik', label: 'Harf derinliği (yan yükseklik)', value: `${o.dp} cm`, cost: costOf(DEPTHS, 'v', o.dp), tipList: DEPTHS.map((d) => ({ ...d, name: `${d.v} cm` })), tipKey: 'name' });
  }

  if (v.krom) {
    const kt = { fileli: 'Fileli (pleksi ön yüz + ince krom çizgi)', filesiz: 'Filesiz (pleksi ön yüz, krom yan)', tam: 'Tam krom (ön yüz de krom)' }[o.kt];
    add({ g: 'Harf', k: 'krom', label: 'Krom model', value: kt, cost: { fileli: 3, filesiz: 2, tam: 3 }[o.kt] });
    const ks = find(KROM_SIDES, o.ks);
    add({ g: 'Harf', k: 'krom_yan', label: 'Krom yan / file rengi', value: ks.name, cost: ks.cost, tipList: KROM_SIDES, tipKey: 'name' });
    if (v.kromLit) add({ g: 'Harf', k: 'krom_isik', label: 'Aydınlatma', value: o.kl ? 'Işıklı (LED)' : 'Işıksız', cost: o.kl ? 2 : 0, tipList: [{ name: 'Işıksız', cost: 0 }, { name: 'Işıklı (LED)', cost: 2 }], tipKey: 'name' });
  }

  if (v.kabartma) {
    const km = kabartmaMat(st);
    add({ g: 'Harf', k: 'kabartma_mal', label: 'Harf malzemesi', value: km.name + (km.brand ? ` (${km.brand})` : ''), cost: { pleksi: 1, dekota: 0, aynali: 2, kompozit: 1 }[o.km], tipList: Object.entries(LETTER_MATS).map(([id, m]) => ({ name: m.name, cost: { pleksi: 1, dekota: 0, aynali: 2, kompozit: 1 }[id] })), tipKey: 'name' });
    add({ g: 'Harf', k: 'kabartma_kalinlik', label: 'Harf kalınlığı', value: fmtMm(o.kk), cost: costOf(THICKNESS[km.thick], 'v', o.kk), tipList: THICKNESS[km.thick].map((t) => ({ ...t, name: fmtMm(t.v) })), tipKey: 'name' });
    const kc = kabartmaColor(st);
    add({ g: 'Harf', k: 'kabartma_renk', label: 'Harf rengi', value: kc.name, cost: itemCost(kc), best: itemCost(kc) >= 2 ? PAL_BEST : undefined });
  }

  if (v.dekupe) {
    add({ g: 'Harf', k: 'dekupe', label: 'Dekupe arkası', value: { bos: 'Boş (arkası açık / yüzey görünür)', pleksi: 'Arkadan renkli pleksi dolgu', led: 'Arkadan pleksi + LED aydınlatma' }[o.df], cost: { bos: 0, pleksi: 1, led: 3 }[o.df], tipList: [{ name: 'Boş (arkası açık)', cost: 0 }, { name: 'Arkadan renkli pleksi dolgu', cost: 1 }, { name: 'Arkadan pleksi + LED', cost: 3 }], tipKey: 'name' });
  }

  if (v.lazer) {
    const lm = find(LASER_MATERIALS, o.lm);
    add({ g: 'Harf', k: 'lazer_mal', label: 'Metal cinsi', value: lm.name, cost: lm.cost, tipList: LASER_MATERIALS, tipKey: 'name' });
    add({ g: 'Harf', k: 'lazer_kalinlik', label: 'Metal kalınlığı', value: fmtMm(o.lk), cost: costOf(THICKNESS.metal, 'v', o.lk), tipList: THICKNESS.metal.map((t) => ({ ...t, name: fmtMm(t.v) })), tipKey: 'name' });
    const lf = find(LASER_FINISH, o.lf);
    add({ g: 'Harf', k: 'lazer_yuzey', label: 'Yüzey / renk', value: lf.name, cost: itemCost(lf), best: itemCost(lf) >= 2 ? PAL_BEST : undefined });
  }

  if (v.baski) {
    const fc = find(FOIL_COLORS, o.fc);
    add({ g: 'Harf', k: 'baski_renk', label: 'Folyo / baskı rengi', value: `${fc.name} — ${o.fm === 'folyo' ? 'kesim folyo' : 'dijital baskı'}`, cost: Math.max(itemCost(fc), o.fm === 'baski' ? 1 : 0) });
  }

  // --- Aydınlatma
  if (v.led || v.germe) {
    const lb = find(LED_BRANDS, o.lb);
    add({ g: 'Aydınlatma', k: 'led_marka', label: 'LED markası', value: lb.name, cost: lb.cost, tipList: LED_BRANDS, tipKey: 'name' });
    add({ g: 'Aydınlatma', k: 'led_renk', label: 'LED rengi', value: find(LED_COLORS, o.lc).name });
  }

  // --- Montaj
  const sv = find(SERVICE_OPTIONS, st.sv);
  add({ g: 'Teslimat', k: 'montaj', label: 'Montaj / teslimat', value: sv.name, cost: sv.cost, tipList: SERVICE_OPTIONS, tipKey: 'name' });
  if (v.fix) {
    const fx = find(FIX_TYPES, st.fx);
    add({ g: 'Teslimat', k: 'sabitleme', label: 'Sabitleme', value: fx.name, cost: fx.cost, tipList: FIX_TYPES, tipKey: 'name' });
  }

  // İpucu: aynı gruptaki en uygun seçenek
  for (const r of rows) {
    if (!r.best && r.tipList && typeof r.cost === 'number' && r.cost > 0) {
      const best = cheapest(r.tipList);
      if ((best.cost ?? 0) < r.cost) r.best = best[r.tipKey];
    }
    delete r.tipList;
    delete r.tipKey;
  }
  return rows;
}

function fmt(n) {
  return String(Math.round(n * 10) / 10).replace('.', ',');
}

export function summarize(st, meta = {}) {
  const rows = buildRows(st, meta);
  const priced = rows.filter((r) => typeof r.cost === 'number');
  const avg = priced.length ? priced.reduce((a, r) => a + r.cost, 0) / priced.length : 0;
  const level = gradeLevel(avg);
  const tips = rows
    .filter((r) => r.best && r.cost >= 2)
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 4)
    .map((r) => `${r.label}: “${r.value}” yerine “${r.best}” seçerseniz maliyet düşer.`);
  return { rows, level, tips, avg };
}

export function refNo(st, now = new Date()) {
  const code = encodeState(st);
  let h = 2166136261;
  for (let i = 0; i < code.length; i++) { h ^= code.charCodeAt(i); h = Math.imul(h, 16777619); }
  const tag = (h >>> 0).toString(36).toUpperCase().padStart(4, '0').slice(-4);
  const y = String(now.getFullYear()).slice(2);
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `IR-${y}${m}${d}-${tag}`;
}

export const costLabel = (c) => COST_LEVELS[Math.min(3, Math.max(0, c))].label;

/** Düz metin şartname (kopyala / yazdır) */
export function specText(st, meta, info) {
  const { rows } = summarize(st, meta);
  const out = [];
  out.push(`${info.brand} — TABELA ŞARTNAMESİ`);
  out.push(`No: ${info.ref}   Tarih: ${info.date}`);
  out.push('');
  let group = '';
  for (const r of rows) {
    if (r.g !== group) { group = r.g; out.push(`[${group.toUpperCase()}]`); }
    let line = `• ${r.label}: ${r.value}`;
    if (typeof r.cost === 'number') line += `  (${costLabel(r.cost)})`;
    out.push(line);
    const note = st.n[r.k];
    if (note) out.push(`   Not: ${note}`);
  }
  if (st.n.genel) { out.push(''); out.push(`Genel not: ${st.n.genel}`); }
  const c = st.c;
  if (c.name || c.phone || c.firm || c.city) {
    out.push('');
    out.push('[MÜŞTERİ]');
    if (c.name) out.push(`• Ad Soyad: ${c.name}`);
    if (c.firm) out.push(`• İşletme: ${c.firm}`);
    if (c.phone) out.push(`• Telefon: ${c.phone}`);
    if (c.city) out.push(`• İlçe / İl: ${c.city}`);
    if (c.b2b) out.push('• Reklamcı / fason sipariş');
  }
  out.push('');
  out.push('Bu şartname ön bilgilendirme niteliğindedir; kesin fiyat ve teslim süresi ölçü/keşif sonrası netleşir.');
  if (info.link) { out.push(''); out.push(`Tasarımı açın: ${info.link}`); }
  return out.join('\n');
}

/** WhatsApp için kısa metin */
export function whatsappText(st, meta, info) {
  const { rows, level } = summarize(st, meta);
  const keep = rows.filter((r) => !['yazitipi'].includes(r.k));
  const out = [`*${info.brand} — Tabela Şartnamesi*`, `No: ${info.ref}`];
  for (const r of keep) {
    out.push(`• ${r.label}: ${r.value}`);
    const note = st.n[r.k];
    if (note) out.push(`  _Not: ${note}_`);
  }
  if (st.n.genel) out.push(`Genel not: ${st.n.genel}`);
  out.push(`Fiyat seviyesi: ${level.label}`);
  const c = st.c;
  const who = [c.name, c.firm].filter(Boolean).join(' / ');
  if (who) out.push(`Ben: ${who}${c.phone ? ' · ' + c.phone : ''}`);
  if (info.link) out.push(`Tasarım: ${info.link}`);
  return out.join('\n');
}

