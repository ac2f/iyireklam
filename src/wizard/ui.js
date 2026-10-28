// Sihirbaz adımları için HTML şablonları (string tabanlı; olaylar app.js'te delegasyonla yönetilir).
import {
  PRODUCTS, STRATEGIES, ZEMIN_MATERIALS, THICKNESS, DEPTHS, SIDE_COLORS, KROM_SIDES, LED_BRANDS,
  LED_COLORS, FRAME_COLORS, FONTS, PRESETS, GERME_COLORS, GERME_INK, CORNERS, LASER_MATERIALS, LASER_FINISH,
  FIX_TYPES, SERVICE_OPTIONS, PLEXI_COLORS, FOIL_COLORS, COST_LEVELS, fmtMm, PLEXI_THICKNESS_NOTE,
  EASY_TYPES, EASY_BUDGETS, EASY_COLORS, EASY_BG, EASY_LIGHTS, EASY_METALS, QUIZ,
  SMALL_TEXT_CM, SMALL_METHODS, SMALL_BACKINGS,
} from '../data/catalog.mjs';
import { getProduct, paletteFor, LETTER_MATS } from './state.js';
import {
  visible, hasZemin, cheapest, zeminMat, find, summarize, refNo, costLabel, itemCost, buildRows, smallPlan, BOX_STRATS,
} from './model.js';
import { easyType, budgetSummary, contrastWarning } from './easy.js';

export const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmt = (n) => String(n).replace('.', ',');
const COST_SHORT = ['En uygun', 'Hafif fark', 'Fiyatı artırır', 'Belirgin artış'];

// ---------------------------------------------------------------------------
// Adımlar
// ---------------------------------------------------------------------------
export function stepsFor(st) {
  if (st.m === 'e') {
    return [
      { id: 'tur', t: 'Tabela türü' },
      { id: 'olcu', t: 'Ölçü & Yazı' },
      { id: 'gorunum', t: 'Görünüm' },
      { id: 'ozet', t: 'Şartname' },
    ];
  }
  const germe = st.p === 'germe';
  const list = [
    { id: 'urun', t: 'Ürün' },
    { id: 'olcu', t: 'Ölçü & Yazı' },
    { id: 'zemin', t: germe ? 'Çerçeve & Kumaş' : 'Zemin' },
  ];
  if (!germe) list.push({ id: 'sistem', t: 'Harf Sistemi' });
  list.push({ id: 'detay', t: germe ? 'Aydınlatma' : 'Harf Detayı' });
  list.push({ id: 'montaj', t: 'Montaj' });
  list.push({ id: 'ozet', t: 'Şartname' });
  return list;
}

// ---------------------------------------------------------------------------
// Küçük bileşenler
// ---------------------------------------------------------------------------
function badge(c) {
  const lv = COST_LEVELS[Math.min(3, Math.max(0, c))];
  return `<span class="cb ${lv.cls}">${COST_SHORT[lv.id]}</span>`;
}

export function swatchBg(it) {
  if (it.mirror === 'silver') return 'linear-gradient(135deg,#fbfcfd 0%,#aab2bb 30%,#eef1f4 52%,#868f99 78%,#dde2e7 100%)';
  if (it.mirror === 'gold') return 'linear-gradient(135deg,#fff3c9 0%,#c99b34 30%,#f8e29a 52%,#946c20 78%,#f0d27c 100%)';
  const h = it.hex;
  const h2 = it.hex2 || 'rgba(0,0,0,.28)';
  switch (it.pat) {
    case 'wood': return `repeating-linear-gradient(0deg,${h2} 0 1px,transparent 1px 4px),repeating-linear-gradient(0deg,rgba(0,0,0,.12) 0 2px,transparent 2px 9px),${h}`;
    case 'marble': return `radial-gradient(ellipse at 28% 30%,${h2}66 0,transparent 38%),radial-gradient(ellipse at 74% 70%,${h2}55 0,transparent 42%),linear-gradient(115deg,transparent 46%,${h2}77 48%,transparent 51%),${h}`;
    case 'stone': return `radial-gradient(circle,${h2}88 0 1px,transparent 1.5px) 0 0/5px 5px,${h}`;
    case 'brushed': return `repeating-linear-gradient(0deg,rgba(255,255,255,.28) 0 1px,transparent 1px 3px),${h}`;
    case 'metal': return `linear-gradient(135deg,rgba(255,255,255,.4),transparent 45%,rgba(0,0,0,.25)),${h}`;
    default: return it.clear ? `linear-gradient(135deg,rgba(255,255,255,.55),transparent 55%),${h}` : h;
  }
}

function group({ id, title, help, body, note, st, hint }) {
  return (
    `<fieldset class="g" id="g-${id}" data-g="${id}">` +
    `<legend class="g-t">${title}</legend>` +
    (help ? `<p class="g-h">${help}</p>` : '') +
    body +
    (hint ? `<p class="g-hint">${hint}</p>` : '') +
    (note ? noteHTML(st, note) : '') +
    `</fieldset>`
  );
}

function noteHTML(st, key) {
  if (st.m === 'e') return ''; // kolay modda tek bir genel not alanı bulunur
  const val = st.n[key] || '';
  const open = !!val;
  return (
    `<div class="note${open ? ' open' : ''}">` +
    `<button type="button" class="note-btn" data-act="note" aria-expanded="${open}">${open ? 'Notu düzenle' : '+ Not ekle'}</button>` +
    `<textarea class="note-ta" rows="2" maxlength="400" data-k="n.${key}" placeholder="Özel isteğiniz, farklı kalınlık veya renk tercihiniz…" aria-label="Bu seçenek için not"${open ? '' : ' hidden'}>${esc(val)}</textarea>` +
    `</div>`
  );
}

function radios(k, cur, items, { kind = 'card', num = false, cols = '' } = {}) {
  const inner = items
    .map((it) => {
      const checked = String(it.v) === String(cur) ? ' checked' : '';
      const input = `<input type="radio" name="${k}" value="${esc(it.v)}" data-k="${k}"${num ? ' data-n="1"' : ''}${checked}>`;
      if (kind === 'chip') {
        return `<label class="chip">${input}<span class="chip-b"><b>${esc(it.t)}</b>${typeof it.cost === 'number' ? badge(it.cost) : ''}</span></label>`;
      }
      if (kind === 'seg') {
        return `<label class="seg-o">${input}<span>${esc(it.t)}</span></label>`;
      }
      return (
        `<label class="opt">${input}<span class="opt-b">` +
        `<span class="opt-t">${esc(it.t)}</span>` +
        (it.d ? `<span class="opt-d">${esc(it.d)}</span>` : '') +
        (typeof it.cost === 'number' ? badge(it.cost) : '') +
        `</span></label>`
      );
    })
    .join('');
  const cls = kind === 'chip' ? 'chips' : kind === 'seg' ? 'seg' : 'opts';
  return `<div class="${cls} ${cols}" role="radiogroup">${inner}</div>`;
}

function swatches(k, cur, palette, label = 'Seçili') {
  const groups = [];
  for (const it of palette) {
    const g = it.grp || '';
    let last = groups[groups.length - 1];
    if (!last || last.g !== g) { last = { g, items: [] }; groups.push(last); }
    last.items.push(it);
  }
  const sel = palette.find((x) => x.id === cur) || palette[0];
  const body = groups
    .map((gr) => {
      const items = gr.items
        .map(
          (it) =>
            `<label class="sw" title="${esc(it.name)}"><input type="radio" name="${k}" value="${esc(it.id)}" data-k="${k}"${it.id === cur ? ' checked' : ''} aria-label="${esc(it.name)}">` +
            `<span class="sw-c" style="background:${swatchBg(it)}">${itemCost(it) ? `<i class="sw-d c${itemCost(it)}" aria-hidden="true"></i>` : ''}</span><span class="sw-n">${esc(it.name)}</span></label>`,
        )
        .join('');
      return (gr.g ? `<p class="sw-g">${esc(gr.g)}</p>` : '') + `<div class="sw-grid" role="radiogroup" aria-label="${esc(gr.g || 'Renk')}">${items}</div>`;
    })
    .join('');
  const sc = itemCost(sel);
  return `<div class="sw-wrap"><p class="sw-sel">${label}: <b>${esc(sel.name)}</b>${sc ? ` ${badge(sc)}` : ''}</p>${body}</div>`;
}

function toggle(k, on, label, desc = '') {
  return (
    `<label class="tgl"><input type="checkbox" data-k="${k}" data-b="1"${on ? ' checked' : ''}><span class="tgl-s" aria-hidden="true"></span>` +
    `<span class="tgl-t"><b>${label}</b>${desc ? `<small>${desc}</small>` : ''}</span></label>`
  );
}

function cheapNames(items, nameKey = 't') {
  const min = Math.min(...items.map((x) => x.cost ?? 0));
  return items.filter((x) => (x.cost ?? 0) === min).map((x) => x[nameKey]).join(', ');
}

function costHint(items, extra = '') {
  return `<b>En uygun seçenek:</b> ${esc(cheapNames(items))}. Standart dışı tercihlerde fiyat yukarı yönlü değişebilir.${extra ? ' ' + extra : ''}`;
}

const PAL_HINT = {
  composite: 'Düz renkler en uygun seçenektir. Metalik, fırçalı, ahşap ve taş desenler fiyatı hafif, aynalı gold/gümüş ise belirgin artırabilir. Noktalı renkler fiyatı etkiler.',
  plexi: 'Standart renkler (opal beyaz, siyah, kırmızı vb.) en uygun seçenektir. Aynalı pleksi (ayna gümüş / altın) fiyatı yukarı taşır.',
  dekota: 'Düz dekota renkleri en uygun seçeneklerdir.',
  mirrorDekota: 'Aynalı dekota, düz dekotaya göre fiyatı yukarı taşır; gümüş ve gold arasında fark yoktur.',
  foil: 'Düz renkli folyo en uygun seçenektir; altın ve gümüş folyo fiyatı artırabilir.',
  laser: 'Boyalı yüzeyler en uygun seçenektir; ayna ve altın kaplama fiyatı yukarı taşıyabilir.',
};
const thickItems = (key) => THICKNESS[key].map((t) => ({ v: t.v, t: fmtMm(t.v), cost: t.cost }));
const THICK_WARN = 'Kalın tercihler fiyatı oldukça artırır.';

// ---------------------------------------------------------------------------
// Ürün ikonları
// ---------------------------------------------------------------------------
const ICONS = {
  cephe: '<svg viewBox="0 0 80 48" aria-hidden="true"><rect x="4" y="9" width="72" height="30" rx="3" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M13 31l5.5-13 5.5 13M15 26.5h7M31 18v13h5a3.6 3.6 0 0 0 0-7h-5h4.2a3.2 3.2 0 0 0 0-6H31M62 20.5a6.5 6.5 0 1 0 0 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  totem: '<svg viewBox="0 0 80 48" aria-hidden="true"><rect x="29" y="2" width="22" height="40" rx="2.5" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M34 12h12M34 19h12M34 26h8" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M20 45h40" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
  kapi: '<svg viewBox="0 0 80 48" aria-hidden="true"><rect x="14" y="8" width="52" height="32" rx="3" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="20" cy="14" r="1.8" fill="currentColor"/><circle cx="60" cy="14" r="1.8" fill="currentColor"/><circle cx="20" cy="34" r="1.8" fill="currentColor"/><circle cx="60" cy="34" r="1.8" fill="currentColor"/><path d="M26 22h28M30 29h20" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
  germe: '<svg viewBox="0 0 80 48" aria-hidden="true"><rect x="5" y="8" width="70" height="32" rx="3" fill="none" stroke="currentColor" stroke-width="3.4"/><rect x="11" y="14" width="58" height="20" rx="1.5" fill="currentColor" opacity=".16"/><path d="M24 26h32M30 20h20" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M2 4l4 4M78 4l-4 4M40 1v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
};
Object.assign(ICONS, {
  isikli: '<svg viewBox="0 0 80 48" aria-hidden="true"><rect x="4" y="13" width="72" height="28" rx="3" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M13 34l5-12 5 12M15 30h6M32 22v12h5a3.2 3.2 0 0 0 0-6.4h-5h4a2.8 2.8 0 0 0 0-5.6h-4M62 25a6 6 0 1 0 0 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 5l2.5 4M40 2v5.5M66 5l-2.5 4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  dekupe: '<svg viewBox="0 0 80 48" aria-hidden="true"><rect x="4" y="9" width="72" height="30" rx="3" fill="currentColor" opacity=".18" stroke="currentColor" stroke-width="2.4"/><path d="M13 31l5.5-13 5.5 13M15 26.5h7M31 18v13h5a3.6 3.6 0 0 0 0-7h-5h4.2a3.2 3.2 0 0 0 0-6H31M62 20.5a6.5 6.5 0 1 0 0 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="3.2 2.6"/></svg>',
  kabartma: '<svg viewBox="0 0 80 48" aria-hidden="true"><rect x="4" y="9" width="72" height="30" rx="3" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M14.5 32.5l5.5-13 5.5 13M16.5 28h7M32.5 19.5v13h5a3.6 3.6 0 0 0 0-7h-5h4.2a3.2 3.2 0 0 0 0-6H32.5M63.5 22a6.5 6.5 0 1 0 0 7" fill="none" stroke="currentColor" opacity=".35" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M13 31l5.5-13 5.5 13M15 26.5h7M31 18v13h5a3.6 3.6 0 0 0 0-7h-5h4.2a3.2 3.2 0 0 0 0-6H31M62 20.5a6.5 6.5 0 1 0 0 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  krom: '<svg viewBox="0 0 80 48" aria-hidden="true"><rect x="4" y="9" width="72" height="30" rx="3" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M28 18h24l6 7-18 13-18-13zM22 25h36M34 18l-3 7 9 13M46 18l3 7-9 13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
});
export const PRODUCT_ICONS = ICONS;

// ---------------------------------------------------------------------------
// Adım içerikleri
// ---------------------------------------------------------------------------
function stepUrun(app) {
  const st = app.st;
  const cards = PRODUCTS.map(
    (p) =>
      `<label class="pcard"><input type="radio" name="p" value="${p.id}" data-k="p" data-act="product"${p.id === st.p ? ' checked' : ''}>` +
      `<span class="pcard-b"><span class="pcard-i">${ICONS[p.id]}</span><span class="pcard-t">${esc(p.name)}</span><span class="pcard-d">${esc(p.desc)}</span></span></label>`,
  ).join('');
  return (
    `<div class="step-intro"><h2 class="step-h">Ne tasarlamak istiyorsunuz?</h2><p>Ürününüzü seçin; adım adım malzeme, renk ve ölçüyü belirleyin. Önizleme anında güncellenir ve sonunda paylaşılabilir bir şartname oluşur.</p></div>` +
    `<div class="pcards" role="radiogroup" aria-label="Ürün tipi">${cards}</div>` +
    `<div class="presets-box"><h3 class="g-t" style="font-size:15px">Hazır örneklerden başlayın</h3><div class="tpls">${PRESETS.map((t, i) => `<button type="button" class="tpl" data-act="tpl" data-i="${i}"><b>${esc(t.name)}</b><span>${esc(t.desc)}</span></button>`).join('')}</div></div>` +
    `<p class="g-hint">Dikey ışıklı kutu totem için <b>Germe Tabela</b> seçip yüksekliği artırabilirsiniz. Listede olmayan bir ürün için sonunda not düşebilir veya bizi arayabilirsiniz.</p>` +
    noteHTML(st, 'urun')
  );
}


// ---------------------------------------------------------------------------
// KOLAY MOD adımları
// ---------------------------------------------------------------------------
function quizChips(name, items, cur) {
  return (
    `<div class="chips" role="radiogroup" aria-label="${esc(name)}">` +
    items
      .map(
        (it) =>
          `<label class="chip"><input type="radio" name="q-${name}" value="${esc(it.v)}" data-q="${name}"${cur === it.v ? ' checked' : ''}><span class="chip-b"><b>${esc(it.t)}</b></span></label>`,
      )
      .join('') +
    `</div>`
  );
}

function stepTur(app) {
  const st = app.st;
  const q = app.quiz || {};
  const answered = Object.keys(q).length > 0;
  const cards = EASY_TYPES.map(
    (t) =>
      `<label class="tcard"><input type="radio" name="e.t" value="${t.id}" data-k="e.t"${t.id === st.e.t ? ' checked' : ''}>` +
      `<span class="tcard-b"><span class="tcard-i">${ICONS[t.icon]}</span>` +
      `<span class="tcard-t">${esc(t.name)}<small>${esc(t.sub)}</small></span>` +
      `<span class="tcard-d">${esc(t.desc)}</span>${t.tag ? `<em class="tcard-tag">${esc(t.tag)}</em>` : ''}</span></label>`,
  ).join('');
  const T = easyType(st.e.t);
  return (
    `<div class="step-intro"><h2 class="step-h">Nasıl bir tabela istiyorsunuz?</h2><p>Teknik bilgi gerekmez: tabela türünü seçin, geri kalan malzeme ve ayrıntıları sizin için biz ayarlayalım.</p></div>` +
    `<details class="quiz" open><summary>Hangisini seçeceğimi bilmiyorum</summary>` +
    `<p class="quiz-p">Üç kısa soruya cevap verin, size uygun olanı seçelim.</p>` +
    `<div class="quiz-q"><b>1. Nereye yapılacak?</b>${quizChips('where', QUIZ.where, q.where)}</div>` +
    `<div class="quiz-q"><b>2. Geceleri ışık versin mi?</b>${quizChips('light', QUIZ.light, q.light)}</div>` +
    `<div class="quiz-q"><b>3. Nasıl bir görünüm istersiniz?</b>${quizChips('look', QUIZ.look, q.look)}</div>` +
    (answered && app.quizWhy ? `<p class="quiz-res" role="status"><b>Önerimiz: ${esc(T.name)}.</b> ${esc(app.quizWhy)}</p>` : '') +
    `</details>` +
    `<div class="tcards" role="radiogroup" aria-label="Tabela türü">${cards}</div>` +
    `<p class="g-hint">Seçiminiz sonradan değişebilir. Daha fazla ayrıntı isterseniz <b>Detaylı mod</b>a geçerek zemin, kalınlık, LED ve renkleri tek tek ayarlayabilirsiniz.</p>`
  );
}

function easyColorTitle(T) {
  if (T.id === 'germe') return 'Tabela rengi';
  if (T.lit) return 'Harf ve ışık rengi';
  return 'Harf rengi';
}

function stepGorunum(app) {
  const st = app.st;
  const e = st.e;
  const T = easyType(e.t);
  const budgets = EASY_BUDGETS.map(
    (b) =>
      `<label class="opt"><input type="radio" name="e.b" value="${b.id}" data-k="e.b" data-n="1"${b.id === e.b ? ' checked' : ''}>` +
      `<span class="opt-b"><span class="opt-t">${esc(b.name)}${b.tag ? ` <i class="tagi">${esc(b.tag)}</i>` : ''}</span>` +
      `<span class="opt-d">${esc(b.desc)}</span>` +
      `<span class="opt-d opt-s">${esc(budgetSummary(st, b.id))}</span>${badge(b.cost)}</span></label>`,
  ).join('');
  let html =
    `<div class="step-intro"><h2 class="step-h">Görünümü seçin</h2><p>Bütçenizi ve renkleri seçin; malzeme, kalınlık, derinlik ve LED gibi teknik ayrıntıları sizin için biz belirliyoruz.</p></div>` +
    group({
      id: 'butce', title: 'Bütçeniz nasıl?', body: `<div class="opts">${budgets}</div>`,
      hint: '<b>En uygun seçenek: Ekonomik.</b> Daha kalın malzeme, marka LED ve ışıklı yan bant gibi tercihler fiyatı yukarı taşır; kesin fiyat ölçü ve keşif sonrası netleşir.',
    });
  html += group({
    id: 'renk', title: easyColorTitle(T),
    help: T.id === 'germe' ? 'Baskılı kumaşın zemin rengi. Yazı rengi otomatik olarak okunaklı seçilir.' : T.id === 'krom' ? 'Ön yüzdeki pleksinin rengi; ışıkta bu renk parlar.' : '',
    body: swatches('e.c', e.c, EASY_COLORS), hint: 'Altın ve gümüş seçenekleri aynalı malzeme kullandığı için fiyatı artırabilir.',
  });
  if (T.zemin) {
    const warn = contrastWarning(st);
    html += group({
      id: 'zemin', title: 'Zemin (arka plan) rengi', help: 'Harflerin üzerine yerleştirileceği panelin rengi.',
      body: swatches('e.g', e.g, EASY_BG),
      hint: warn ? `<b>${esc(warn)}</b>` : 'Düz renkler en uygun seçenektir; aynalı zeminler fiyatı artırır. Koyu zeminde açık, açık zeminde koyu yazı en okunaklısıdır.',
    });
  }
  if (T.id === 'krom') {
    html += group({
      id: 'metal', title: 'Krom rengi (yan yüzey)',
      body: radios('e.m', e.m, EASY_METALS.map((m) => ({ v: m.id, t: m.name, cost: m.id === 'altin' ? 1 : 0 })), { kind: 'chip' }),
    });
  }
  if (T.lit) {
    html += group({
      id: 'isik', title: 'Işık rengi', body: radios('e.l', e.l, EASY_LIGHTS.map((l) => ({ v: l.id, t: l.name, d: l.desc })), { cols: '' }),
    });
  }
  const rows = buildRows(st, app.meta || {}).filter((r) => ['Zemin', 'Harf', 'Aydınlatma', 'Germe'].includes(r.g));
  html +=
    `<div class="sel-box"><h3>Sizin için seçtiklerimiz</h3><dl>${rows.map((r) => `<div><dt>${esc(r.label)}</dt><dd>${esc(r.value)}</dd></div>`).join('')}</dl>` +
    `<p><button type="button" class="pill" data-act="pro">Ayrıntıları kendim ayarlayacağım</button></p></div>`;
  return html;
}

function stepOlcu(app) {
  const st = app.st;
  const p = getProduct(st.p);
  const sizeBody =
    `<div class="row2">` +
    `<label class="fld"><span>Genişlik (cm)</span><input type="number" inputmode="decimal" min="${p.size.w[0]}" max="${p.size.w[1]}" step="1" value="${st.w}" data-k="w" data-num="1" data-min="${p.size.w[0]}" data-max="${p.size.w[1]}"></label>` +
    `<label class="fld"><span>Yükseklik (cm)</span><input type="number" inputmode="decimal" min="${p.size.h[0]}" max="${p.size.h[1]}" step="1" value="${st.h}" data-k="h" data-num="1" data-min="${p.size.h[0]}" data-max="${p.size.h[1]}"></label>` +
    `<label class="fld"><span>Adet</span><input type="number" inputmode="numeric" min="1" max="999" step="1" value="${st.q}" data-k="q" data-num="1" data-min="1" data-max="999"></label>` +
    `</div>` +
    `<p class="fld-err" id="size-err" role="alert" hidden></p>` +
    `<div class="presets"><span>Hazır ölçüler:</span>${p.presets.map(([w, h]) => `<button type="button" class="pill" data-act="preset" data-w="${w}" data-h="${h}">${w} × ${h}</button>`).join('')}</div>` +
    `<p class="g-hint">Geçerli aralık: ${p.size.w[0]}–${p.size.w[1]} cm genişlik, ${p.size.h[0]}–${p.size.h[1]} cm yükseklik. Daha büyük işler için bizi arayın.</p>`;

  const lines = [];
  for (let i = 0; i < p.maxLines; i++) {
    const ph = ['1. satır — ana yazı (firma adı)', '2. satır — alt başlık / slogan', '3. satır — telefon, adres vb.', '4. satır — ek bilgi'][i];
    lines.push(
      `<div class="line"><input type="text" maxlength="60" autocomplete="off" placeholder="${ph}" value="${esc(st.L[i].t)}" data-k="L.${i}.t" aria-label="${i + 1}. satır metni">` +
      radios(`L.${i}.s`, st.L[i].s, [{ v: 'L', t: 'Büyük' }, { v: 'M', t: 'Orta' }, { v: 'S', t: 'Küçük' }], { kind: 'seg' }) +
      `</div>`,
    );
  }
  const fonts = FONTS.map(
    (f) =>
      `<label class="font"><input type="radio" name="f" value="${f.id}" data-k="f"${f.id === st.f ? ' checked' : ''}><span class="font-b"><span class="font-s" style="font-family:${f.stack};font-weight:${f.weight}">${esc(f.sample)}</span><span class="font-n">${esc(f.name)}</span></span></label>`,
  ).join('');

  return (
    `<div class="step-intro"><h2 class="step-h">Ölçü ve yazı</h2><p>Tabelanın dış ölçüsünü ve üzerinde yazacak metni girin. Harfler ölçüye göre otomatik yerleşir.</p></div>` +
    group({ id: 'olcu', title: 'Ölçü', body: sizeBody, note: 'olcu', st }) +
    group({
      id: 'metin', title: 'Metin', help: 'Boş bıraktığınız satırlar çizilmez. Türkçe karakterler (İ, ı, ğ, ş) desteklenir.',
      hint: BOX_STRATS.includes(st.s) && !(st.p === 'germe')
        ? `<b>Küçük yazılar:</b> harf yüksekliği ${SMALL_TEXT_CM} cm’nin altındaki satırlar (örn. slogan, telefon) kutu harf yerine <b>dekupe</b> yapılır; önizlemede panelden oyulmuş olarak görürsünüz.`
        : '',
      body: `<div class="lines">${lines.join('')}</div>` +
        toggle('up', st.up, 'BÜYÜK HARF', 'Tüm yazıyı büyük harfe çevirir') +
        `<label class="rng"><span>Yazı boyutu <output>${st.fit}%</output></span><input type="range" min="40" max="100" step="5" value="${st.fit}" data-k="fit" data-num="1" data-min="40" data-max="100" aria-label="Yazı boyutu yüzdesi"></label>`,
      note: 'metin', st,
    }) +
    group({ id: 'font', title: 'Yazı tipi', body: `<div class="fonts" role="radiogroup" aria-label="Yazı tipi">${fonts}</div>`, hint: 'Önizleme yazı tipleri temsilidir; farklı bir font veya kendi logonuzu not olarak iletebilirsiniz.', note: 'yazitipi', st }) +
    group({
      id: 'logo', title: 'Logo / amblem',
      body: toggle('logo', st.logo, 'Logo alanı ekle', 'Önizlemede logo için yer ayırır') +
        (st.logo
          ? `<div class="logo-up"><label class="btn btn-ghost btn-sm" for="logo-file">Logo yükle (önizleme)</label><input id="logo-file" class="sr" type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" data-act="logo">${app.logoUrl ? '<button type="button" class="pill" data-act="logo-clear">Logoyu kaldır</button>' : ''}<small>Logo yalnızca bu cihazda önizlenir; kesim dosyasını WhatsApp veya e-posta ile ileteceksiniz.</small></div>`
          : ''),
      note: 'logo', st,
    })
  );
}

function stepZemin(app) {
  const st = app.st;
  const p = getProduct(st.p);
  const v = visible(st);
  if (st.p === 'germe') return stepGerme(app);

  let html = `<div class="step-intro"><h2 class="step-h">Zemin malzemesi</h2><p>Harflerin üzerine monte edileceği panel. ${p.zemin === 'optional' ? 'Harfleri doğrudan duvara da uygulayabiliriz.' : 'Bu ürün için zemin panelidir.'}</p></div>`;

  if (p.zemin === 'optional') {
    html += group({
      id: 'zeminvar', title: 'Zemin kullanılsın mı?',
      body: radios('z', st.z, [
        { v: 1, t: 'Zeminli (panel üzerine)', d: 'Harfler bir panel üzerine monte edilir; düzgün ve korunaklı görünüm.', cost: 1 },
        { v: 0, t: 'Zeminsiz (doğrudan yüzeye)', d: 'Harfler doğrudan duvara/cepheye uygulanır.', cost: 0 },
      ], { num: true }),
      note: 'zemin', st,
      hint: st.s === 'dekupe' ? 'Dekupe sistemi için zemin gereklidir.' : '',
    });
  }
  if (!hasZemin(st)) return html + `<p class="g-hint">Zemin seçmediniz; bir sonraki adıma geçebilirsiniz.</p>`;

  const mats = ZEMIN_MATERIALS.map((m) => ({
    v: m.id, t: m.name + (m.brand ? ` · ${m.brand}` : ''), d: m.desc, cost: m.cost,
  }));
  html += group({
    id: 'zmat', title: 'Zemin malzemesi', body: radios('zm', st.zm, mats), hint: costHint(mats), note: 'zemin_mal', st,
  });
  const zm = zeminMat(st);
  html += group({
    id: 'zkal', title: `${zm.name} kalınlığı`, body: radios('zt', st.zt, thickItems(zm.thick), { kind: 'chip', num: true }),
    hint: costHint(thickItems(zm.thick), THICK_WARN), note: 'zemin_kalinlik', st,
  });
  const pal = paletteFor(zm.palette);
  const palLabel = zm.palette === 'composite' ? 'Sistem kompozit paleti' : zm.palette === 'plexi' ? 'Akpolimer paleti' : zm.palette === 'mirrorDekota' ? 'Aynalı dekota' : 'Dekota renkleri';
  html += group({
    id: 'zrenk', title: `Zemin rengi / deseni`, help: `${palLabel} — ekran renkleri yaklaşıktır; kesin renk kartelasından teyit edilir.`,
    body: swatches('zc', st.zc, pal), hint: PAL_HINT[zm.palette], note: 'zemin_renk', st,
  });
  html += group({ id: 'kose', title: 'Köşe', body: radios('cr', st.cr, CORNERS.map((c) => ({ v: c.id, t: c.name, cost: c.cost })), { kind: 'chip' }), hint: costHint(CORNERS.map((c) => ({ ...c, t: c.name }))), note: 'kose', st });
  return html;
}

function stepGerme(app) {
  const st = app.st;
  const frames = FRAME_COLORS.map((f) => ({ v: f.id, t: f.name, cost: f.cost }));
  return (
    `<div class="step-intro"><h2 class="step-h">Çerçeve ve baskı kumaşı</h2><p>Alüminyum çerçeveli, arkadan LED aydınlatmalı germe tabela. Yüzey dijital baskılı germe kumaştır.</p></div>` +
    group({ id: 'cerceve', title: 'Çerçeve rengi', body: radios('fr', st.fr, frames, { kind: 'chip' }), hint: costHint(frames), note: 'cerceve', st }) +
    group({
      id: 'yuz', title: 'Yüz sayısı',
      body: radios('sd', st.sd, [
        { v: 'tek', t: 'Tek taraflı', d: 'Duvara monte, tek yönden görünür.', cost: 0 },
        { v: 'cift', t: 'Çift taraflı', d: 'Bayrak/askı tipi, iki yönden görünür.', cost: 2 },
      ]),
      hint: 'Çift taraflı yapıda LED ve kumaş miktarı artar; fiyat yukarı yönlü değişir.', note: 'yuz', st,
    }) +
    group({
      id: 'kumas', title: 'Baskı zemin rengi',
      help: 'Tasarım dosyanızı baskı öncesi birlikte netleştiririz. Buradaki renk önizleme içindir.',
      body: swatches('gc', st.gc, GERME_COLORS.map((c) => ({ ...c, id: c.id }))), note: 'kumas', st,
    }) +
    group({ id: 'ink', title: 'Yazı rengi', body: radios('gi', st.gi, GERME_INK.map((c) => ({ v: c.id, t: c.name })), { kind: 'chip' }), note: 'yazi_rengi', st })
  );
}

function stepSistem(app) {
  const st = app.st;
  const p = getProduct(st.p);
  const items = p.strategies.map((id) => ({ v: id, t: STRATEGIES[id].name, d: STRATEGIES[id].desc, cost: STRATEGIES[id].cost }));
  return (
    `<div class="step-intro"><h2 class="step-h">Harfler nasıl işlensin?</h2><p>İşleme yöntemi hem görünümü hem maliyeti belirler. Yöntemi seçtikten sonra malzeme, kalınlık ve renkleri ayarlayacaksınız.</p></div>` +
    group({ id: 'sistem', title: 'Harf sistemi', body: radios('s', st.s, items), hint: costHint(items), note: 'sistem', st })
  );
}

function ledGroups(st) {
  const brands = LED_BRANDS.map((b) => ({ v: b.id, t: b.name, d: b.desc, cost: b.cost }));
  const colors = LED_COLORS.map((c) => ({ ...c, v: c.id, t: c.name }));
  const chips =
    `<div class="chips led-colors" role="radiogroup" aria-label="LED rengi">` +
    colors
      .map(
        (c) =>
          `<label class="chip led"><input type="radio" name="o.lc" value="${c.id}" data-k="o.lc"${st.o.lc === c.id ? ' checked' : ''}><span class="chip-b"><i class="led-dot" style="--c:${c.glow}"></i><b>${esc(c.name)}</b></span></label>`,
      )
      .join('') +
    `</div>`;
  return (
    group({ id: 'ledmarka', title: 'LED markası', body: radios('o.lb', st.o.lb, brands), hint: costHint(brands, 'Samsung ve Epistar seçimleri standart modüle göre maliyeti yükseltebilir.'), note: 'led_marka', st }) +
    group({ id: 'ledrenk', title: 'LED rengi', body: chips, hint: 'Beyaz ve günışığı en yaygın seçimlerdir. Renkli LED’ler ve özel tonlar için not ekleyebilirsiniz.', note: 'led_renk', st })
  );
}


function smallGroups(app) {
  const st = app.st;
  const meta = app.meta || {};
  const sp = smallPlan(st);
  const cm = (n) => `${String(Math.round(n * 10) / 10).replace('.', ',')} cm`;
  const tiny = (meta.lines || []).filter((l) => l.capCm < SMALL_TEXT_CM);
  const mainName = { kutu_isikli: 'ışıklı kutu harf', kutu_isiksiz: 'kutu harf', krom: 'krom harf' }[st.s];
  const info = tiny.length
    ? `Şu an küçük sayılan yazılar: ${tiny.map((l) => `“${esc(l.text)}” (≈ ${cm(l.capCm)})`).join(', ')}.`
    : `Şu an ${SMALL_TEXT_CM} cm’nin altında harf yok; tüm yazılar ${mainName} olur. Slogan veya telefon gibi küçük bir satır eklerseniz otomatik olarak dekupe önizlenir.`;
  let html = group({
    id: 'kucuk', title: `Küçük yazılar (${SMALL_TEXT_CM} cm altı)`,
    help: `Çok küçük harflerin kutu harf olarak yapılması zordur. Bu yüzden küçük yazılar genellikle <b>dekupe</b> (panelden oyma) yapılır. ${info}`,
    body: radios('sm', st.sm, SMALL_METHODS.map((m) => ({ v: m.id, t: m.name, d: m.desc }))),
    hint: !hasZemin(st) ? 'Dekupe için zemin (panel) gerekir; zeminsiz tasarımda küçük yazılar kabartma düz harf olarak yapılır.' : '',
    note: 'kucuk_yazi', st,
  });
  if (sp && sp.method === 'dekupe') {
    const items = SMALL_BACKINGS.map((b) => ({ v: b.id, t: b.name, d: b.desc, cost: b.cost }));
    html += group({
      id: 'kucukarka', title: 'Küçük yazıların arkası (dekupe)', body: radios('sb', st.sb, items),
      hint: costHint(items.filter((i) => typeof i.cost === 'number')), note: 'kucuk_arka', st,
    });
  }
  return html;
}

function stepDetay(app) {
  const st = app.st;
  const v = visible(st);
  const o = st.o;
  let html = '';

  if (st.p === 'germe') {
    html += `<div class="step-intro"><h2 class="step-h">Aydınlatma</h2><p>Germe tabela arkadan LED ile aydınlatılır. LED markasını ve ışık rengini seçin.</p></div>`;
    return html + ledGroups(st);
  }

  html += `<div class="step-intro"><h2 class="step-h">${esc(STRATEGIES[st.s].short)} detayları</h2><p>${esc(STRATEGIES[st.s].desc)}</p></div>`;

  // Krom model
  if (v.krom) {
    const kt = [
      { v: 'fileli', t: 'Fileli', d: 'Pleksi ön yüzün çevresinde ince krom çizgi (file). Prestijli, belirgin kontur.', cost: 3 },
      { v: 'filesiz', t: 'Filesiz', d: 'Pleksi ön yüz, krom yan yüzey; daha sade.', cost: 2 },
      { v: 'tam', t: 'Tam krom (ön yüz de krom)', d: 'Pleksi olmadan tüm yüzey krom; ışıksız uygulanır.', cost: 3 },
    ];
    html += group({ id: 'kromtip', title: 'Krom model', body: radios('o.kt', o.kt, kt), hint: costHint(kt), note: 'krom', st });
    html += group({
      id: 'kromyan', title: 'Krom yan / file rengi',
      body: radios('o.ks', o.ks, KROM_SIDES.map((c) => ({ v: c.id, t: c.name, cost: c.cost })), { kind: 'chip' }),
      hint: costHint(KROM_SIDES.map((c) => ({ ...c, t: c.name }))), note: 'krom_yan', st,
    });
    if (v.kromLit) {
      html += group({
        id: 'kromisik', title: 'Aydınlatma',
        body: radios('o.kl', o.kl, [{ v: 1, t: 'Işıklı (LED)', cost: 2 }, { v: 0, t: 'Işıksız', cost: 0 }], { kind: 'chip', num: true }),
        note: 'krom_isik', st,
      });
    }
  }

  // Pleksi ön yüz
  if (v.plexiFront) {
    const dek = st.s === 'dekupe';
    const title = dek ? 'Arka dolgu pleksisi' : 'Ön yüz pleksisi';
    html += group({
      id: 'pkal', title: `${title} — kalınlık`, body: radios('o.pt', o.pt, thickItems('pleksi'), { kind: 'chip', num: true }),
      hint: `${costHint(thickItems('pleksi'))} <b>Kalın pleksi tercihleri fiyatı oldukça artırır.</b> ${esc(PLEXI_THICKNESS_NOTE)}`, note: 'on_kalinlik', st,
    });
    html += group({
      id: 'prenk', title: `${title} — renk`, help: 'Akpolimer pleksi paleti. Işıklı uygulamada pleksi rengi ışık rengini belirler.',
      body: swatches('o.pc', o.pc, PLEXI_COLORS), hint: PAL_HINT.plexi, note: 'on_renk', st,
    });
  }

  // Kutu harf yan yüzey
  if (v.sides) {
    const lit = st.s === 'kutu_isikli';
    const sideOpts = [
      { v: 'solid', t: 'Işıksız yan bant', d: 'Antrasit, siyah, beyaz, altın veya gümüş renkli yan yüzey.', cost: 0 },
      { v: 'plexi', t: lit ? 'Pleksi ışıklı bant' : 'Pleksi bant (ışıksız)', d: lit ? 'Yanlar da pleksi olur; ışık yanlardan da yayılır, hacimli ve parlak görünür.' : 'Yan yüzey renkli pleksi olur.', cost: lit ? 2 : 1 },
    ];
    html += group({
      id: 'yan', title: 'Yan yüzey', body: radios('o.side', o.side, sideOpts), hint: costHint(sideOpts, lit ? 'Işıklı pleksi bant LED sayısını ve maliyeti artırır.' : ''), note: 'yan', st,
    });
    if (o.side === 'solid') {
      const sc = SIDE_COLORS.map((c) => ({ ...c, v: c.id, t: c.name }));
      const chips = `<div class="chips" role="radiogroup" aria-label="Yan bant rengi">${sc.map((c) => `<label class="chip"><input type="radio" name="o.sc" value="${c.id}" data-k="o.sc"${o.sc === c.id ? ' checked' : ''}><span class="chip-b"><span class="mini-sw" style="background:${swatchBg(c.metal ? { mirror: c.metal, hex: c.hex } : c)}"></span><b>${esc(c.name)}</b>${badge(c.cost)}</span></label>`).join('')}</div>`;
      html += group({ id: 'yanrenk', title: 'Yan bant rengi', body: chips, hint: costHint(sc), note: 'yan_renk', st });
    } else {
      const bandPal = [{ id: 'same', name: 'Ön yüzle aynı renk', hex: find(PLEXI_COLORS, o.pc).hex, grp: '' }, ...PLEXI_COLORS];
      html += group({
        id: 'yanpleksi', title: 'Pleksi bant rengi', help: 'Varsayılan olarak ön yüzle aynı renktir.',
        body: swatches('o.bc', o.bc, bandPal), note: 'yan_renk', st,
      });
    }
  }
  if (v.depth) {
    const items = DEPTHS.map((d) => ({ v: d.v, t: `${d.v} cm`, cost: d.cost }));
    html += group({
      id: 'derin', title: 'Harf derinliği (yan yükseklik)', body: radios('o.dp', o.dp, items, { kind: 'chip', num: true }),
      hint: costHint(items, 'Daha derin harf daha fazla malzeme ve işçilik demektir. Farklı bir derinlik için not yazabilirsiniz.'), note: 'derinlik', st,
    });
  }
  if (BOX_STRATS.includes(st.s)) html += smallGroups(app);

  // Kabartma
  if (v.kabartma) {
    const mats = Object.entries(LETTER_MATS).map(([id, m]) => ({
      v: id, t: m.name + (m.brand ? ` · ${m.brand}` : ''), cost: { pleksi: 1, dekota: 0, aynali: 2, kompozit: 1 }[id],
      d: { pleksi: 'Akpolimer pleksi; parlak, canlı renkler.', dekota: 'Hafif ve ekonomik düz harf.', aynali: 'Gümüş veya gold ayna yüzey.', kompozit: 'Sistem kompozit paleti; ahşap, mermer, metalik seçenekler.' }[id],
    }));
    html += group({ id: 'kmal', title: 'Harf malzemesi', body: radios('o.km', o.km, mats), hint: costHint(mats), note: 'kabartma_mal', st });
    const km = LETTER_MATS[o.km];
    html += group({
      id: 'kkal', title: `${km.name} kalınlığı`, body: radios('o.kk', o.kk, thickItems(km.thick), { kind: 'chip', num: true }),
      hint: costHint(thickItems(km.thick), THICK_WARN), note: 'kabartma_kalinlik', st,
    });
    html += group({ id: 'krenk', title: 'Harf rengi', body: swatches('o.kr', o.kr, km.palette), hint: PAL_HINT[{ pleksi: 'plexi', dekota: 'dekota', aynali: 'mirrorDekota', kompozit: 'composite' }[o.km]], note: 'kabartma_renk', st });
  }

  // Dekupe
  if (v.dekupe) {
    const df = [
      { v: 'bos', t: 'Boş (arkası açık)', d: 'Harflerin arkasından duvar/yüzey görünür.', cost: 0 },
      { v: 'pleksi', t: 'Arkadan renkli pleksi dolgu', d: 'Oyuk harflerin arkasına renkli pleksi yerleştirilir.', cost: 1 },
      { v: 'led', t: 'Arkadan pleksi + LED aydınlatma', d: 'Harfler geceleri ışık verir; en gösterişli dekupe.', cost: 3 },
    ];
    html += group({ id: 'dek', title: 'Dekupe arkası', body: radios('o.df', o.df, df), hint: costHint(df), note: 'dekupe', st });
  }

  // Lazer
  if (v.lazer) {
    const lm = LASER_MATERIALS.map((m) => ({ v: m.id, t: m.name, cost: m.cost }));
    html += group({ id: 'lmal', title: 'Metal cinsi', body: radios('o.lm', o.lm, lm, { kind: 'chip' }), hint: costHint(lm), note: 'lazer_mal', st });
    html += group({ id: 'lkal', title: 'Metal kalınlığı', body: radios('o.lk', o.lk, thickItems('metal'), { kind: 'chip', num: true }), hint: costHint(thickItems('metal'), THICK_WARN), note: 'lazer_kalinlik', st });
    html += group({ id: 'lyuz', title: 'Yüzey / renk', body: swatches('o.lf', o.lf, LASER_FINISH), hint: PAL_HINT.laser, note: 'lazer_yuzey', st });
  }

  // Baskı / folyo
  if (v.baski) {
    html += group({
      id: 'bmet', title: 'Uygulama yöntemi',
      body: radios('o.fm', o.fm, [{ v: 'folyo', t: 'Kesim folyo', cost: 0 }, { v: 'baski', t: 'Dijital baskı', cost: 1 }], { kind: 'chip' }),
      hint: 'Kesim folyo en ekonomik seçenektir; çok renkli tasarımlarda dijital baskı kullanılır.', note: 'baski_yontem', st,
    });
    html += group({ id: 'brenk', title: 'Folyo / baskı rengi', body: swatches('o.fc', o.fc, FOIL_COLORS), hint: PAL_HINT.foil, note: 'baski_renk', st });
  }

  if (v.led) html += ledGroups(st);
  return html;
}

function montajGroups(st, { fix }) {
  const sv = SERVICE_OPTIONS.map((x) => ({ v: x.id, t: x.name, d: x.desc, cost: x.cost }));
  let html = group({ id: 'montaj', title: 'Teslimat şekli', body: radios('sv', st.sv, sv), hint: costHint(sv), note: 'montaj', st });
  if (fix) {
    const fx = FIX_TYPES.map((f) => ({ v: f.id, t: f.name, d: f.desc, cost: f.cost }));
    html += group({ id: 'sabit', title: 'Sabitleme şekli', body: radios('fx', st.fx, fx), hint: costHint(fx), note: 'sabitleme', st });
  }
  html += group({
    id: 'genel', title: 'Eklemek istedikleriniz',
    help: 'Bu alandaki bilgiler şartnamenin sonuna eklenir: keşif adresi, istenen teslim tarihi, özel renk kodu vb.',
    body: `<textarea class="note-ta open" rows="4" maxlength="400" data-k="n.genel" placeholder="Örn. Cephe ölçüleri, adres, istenen termin, özel renk kodu…" aria-label="Genel not">${esc(st.n.genel || '')}</textarea>`,
  });
  return html;
}

function stepMontaj(app) {
  const st = app.st;
  return (
    `<div class="step-intro"><h2 class="step-h">Montaj ve teslimat</h2><p>Üretimin ardından tabelanın nasıl teslim edileceğini seçin.</p></div>` +
    montajGroups(st, { fix: visible(st).fix })
  );
}

// ---------------------------------------------------------------------------
// Özet / şartname
// ---------------------------------------------------------------------------
export function levelMeter(level) {
  return (
    `<div class="lvl" role="img" aria-label="Fiyat seviyesi: ${esc(level.label)}">` +
    [0, 1, 2, 3].map((i) => `<i class="${i <= level.id ? 'on c' + level.id : ''}"></i>`).join('') +
    `</div>`
  );
}

export function specHTML(app, svgDay, svgNight) {
  const st = app.st;
  const info = summarize(st, app.meta);
  const now = new Date();
  const date = now.toLocaleDateString('tr-TR');
  const ref = refNo(st, now);
  let group = '';
  const rows = info.rows
    .map((r) => {
      let head = '';
      if (r.g !== group) { group = r.g; head = `<tr class="sg"><th colspan="3">${esc(group)}</th></tr>`; }
      const note = st.n[r.k];
      return (
        head +
        `<tr><td class="sl">${esc(r.label)}</td><td class="sv">${esc(r.value)}${note ? `<span class="sn">Not: ${esc(note)}</span>` : ''}${r.best ? `<span class="sb">En uygun alternatif: ${esc(r.best)}</span>` : ''}</td>` +
        `<td class="sc">${typeof r.cost === 'number' ? badge(r.cost) : ''}</td></tr>`
      );
    })
    .join('');
  const c = st.c;
  const cust = [c.name && `Ad Soyad: ${esc(c.name)}`, c.firm && `İşletme: ${esc(c.firm)}`, c.phone && `Telefon: ${esc(c.phone)}`, c.city && `İlçe / İl: ${esc(c.city)}`, c.b2b && 'Reklamcı / fason sipariş']
    .filter(Boolean)
    .join(' · ');
  return {
    ref,
    html:
      `<article id="spec-sheet" class="spec" aria-label="Tabela şartnamesi">` +
      `<header class="spec-h"><div class="spec-brand"><b>İyi Reklam</b><span>Tabela Şartnamesi</span></div><div class="spec-ref"><span>No: <b>${ref}</b></span><span>Tarih: ${date}</span></div></header>` +
      `<div class="spec-prev${svgNight ? ' two' : ''}"><figure>${svgDay}<figcaption>Gündüz görünümü</figcaption></figure>${svgNight ? `<figure>${svgNight}<figcaption>Gece görünümü</figcaption></figure>` : ''}</div>` +
      `<table class="spec-t"><tbody>${rows}</tbody></table>` +
      (st.n.genel ? `<p class="spec-gn"><b>Genel not:</b> ${esc(st.n.genel)}</p>` : '') +
      `<div class="spec-lvl">${levelMeter(info.level)}<div><b>Fiyat seviyesi: ${esc(info.level.label)}</b><p>${esc(info.level.desc)}</p></div></div>` +
      (info.tips.length ? `<div class="spec-tips"><b>Bütçeyi düşürmek isterseniz</b><ul>${info.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>` : '') +
      (cust ? `<p class="spec-cust"><b>Müşteri bilgileri:</b> ${cust}</p>` : '') +
      `<footer class="spec-f"><p>Bu şartname ön bilgilendirme niteliğindedir. Kesin fiyat, ölçü ve renk onayı; keşif ve kartela teyidi sonrasında netleşir.</p><p><b>İyi Reklam</b> · Sebze Bahçeleri Cad. No: 107/22 İskitler, Altındağ / Ankara · <b>0531 520 90 01</b></p></footer>` +
      `</article>`,
  };
}

function stepOzet(app, specPart) {
  const st = app.st;
  const c = st.c;
  const canShare = typeof navigator !== 'undefined' && !!navigator.share;
  return (
    `<div class="step-intro"><h2 class="step-h">Şartnameniz hazır</h2><p>Aşağıdaki şartname seçimlerinizi, notlarınızı ve fiyat etkisini içerir. WhatsApp ile bize gönderin; ölçüyü ve fiyatı birlikte netleştirelim.</p>` +
    (st.m === 'e' ? `<p><button type="button" class="pill" data-act="pro">Ayrıntıları kendim düzenlemek istiyorum</button></p>` : '') + `</div>` +
    (st.m === 'e' ? montajGroups(st, { fix: false }) : '') +
    group({
      id: 'musteri', title: 'İletişim bilgileriniz (isteğe bağlı)', help: 'Şartnameye eklenir; sunucuya gönderilmez.',
      body:
        `<div class="row2">` +
        `<label class="fld"><span>Ad Soyad</span><input type="text" maxlength="60" autocomplete="name" value="${esc(c.name)}" data-k="c.name"></label>` +
        `<label class="fld"><span>Telefon</span><input type="tel" maxlength="24" autocomplete="tel" inputmode="tel" value="${esc(c.phone)}" data-k="c.phone"></label>` +
        `<label class="fld"><span>İşletme adı</span><input type="text" maxlength="80" autocomplete="organization" value="${esc(c.firm)}" data-k="c.firm"></label>` +
        `<label class="fld"><span>İlçe / İl</span><input type="text" maxlength="60" autocomplete="address-level2" value="${esc(c.city)}" data-k="c.city"></label>` +
        `</div>` +
        toggle('c.b2b', c.b2b, 'Reklamcıyım (fason sipariş)', 'Fason imalat koşulları için ayrıca görüşürüz'),
    }) +
    `<div class="actions" role="group" aria-label="Paylaşım seçenekleri">` +
    `<button type="button" class="btn btn-wa" data-act="whatsapp">WhatsApp ile gönder</button>` +
    (canShare ? `<button type="button" class="btn btn-primary" data-act="share">Görseli paylaş</button>` : '') +
    `<button type="button" class="btn btn-ghost" data-act="png">Görseli indir (PNG)</button>` +
    `<button type="button" class="btn btn-ghost" data-act="print">Yazdır / PDF</button>` +
    `<button type="button" class="btn btn-ghost" data-act="copy">Metni kopyala</button>` +
    `<button type="button" class="btn btn-ghost" data-act="link">Bağlantıyı kopyala</button>` +
    `<a class="btn btn-ghost" href="tel:+905315209001">Ara: 0531 520 90 01</a>` +
    `</div>` +
    `<p class="act-msg" id="act-msg" role="status" aria-live="polite"></p>` +
    specPart
  );
}

export function renderStep(app, specPart = '') {
  const id = app.stepId;
  switch (id) {
    case 'tur': return stepTur(app);
    case 'gorunum': return stepGorunum(app);
    case 'urun': return stepUrun(app);
    case 'olcu': return stepOlcu(app);
    case 'zemin': return stepZemin(app);
    case 'sistem': return stepSistem(app);
    case 'detay': return stepDetay(app);
    case 'montaj': return stepMontaj(app);
    case 'ozet': return stepOzet(app, specPart);
    default: return '';
  }
}

export { costLabel, cheapest };
