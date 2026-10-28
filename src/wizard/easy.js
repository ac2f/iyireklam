// Kolay mod: kullanıcının sade seçimlerinden (tür, bütçe, renk, ışık) tüm teknik ayrıntıları üretir.
import {
  EASY_TYPES, EASY_COLORS, EASY_BG, LED_BRANDS, FRAME_COLORS, fmtMm,
} from '../data/catalog.mjs';
import { normalize, switchProduct } from './state.js';
import { find } from './model.js';
import { lum } from './render.js';

export const easyType = (id) => find(EASY_TYPES, id);
export const easyColor = (id) => find(EASY_COLORS, id);
export const easyBg = (id) => find(EASY_BG, id);

const LED = ['standart', 'epistar', 'samsung'];

/**
 * Kolay mod seçimlerinden (st.e) detaylı seçimleri üretir.
 * Metin, ölçü ve iletişim bilgileri korunur; tür değiştiyse ürün de değişir.
 */
export function deriveEasy(input) {
  const st = normalize({ ...input, m: 'e' });
  const e = st.e;
  const T = easyType(e.t);
  const b = e.b;
  const col = easyColor(e.c);
  const bg = easyBg(e.g);

  let s = st.p === T.product ? { ...st, o: { ...st.o } } : switchProduct(st, T.product);
  s = { ...s, e: { ...e }, m: 'e', o: { ...s.o } };
  const o = s.o;

  s.s = T.strategy;
  s.z = T.zemin ? 1 : 0;
  s.zm = 'kompozit';
  s.zt = b === 2 ? 4 : 3;
  s.zc = bg.id;
  s.cr = 'duz';

  o.lb = LED[b];
  o.lc = e.l;

  switch (T.id) {
    case 'isikli_harf':
    case 'totem':
      o.pc = col.plexi;
      o.pt = [2.8, 4.5, 5.8][b];
      o.dp = [6, 7, 8][b];
      o.side = b === 2 && T.id === 'isikli_harf' ? 'plexi' : 'solid';
      o.bc = 'same';
      o.sc = col.metal === 'gold' ? 'altin' : col.metal === 'silver' ? 'gumus' : 'antrasit';
      break;
    case 'dekupe':
      o.df = 'led';
      o.pc = col.plexi;
      o.pt = [2.8, 2.8, 4.5][b];
      break;
    case 'krom':
      o.kt = b === 0 ? 'filesiz' : 'fileli';
      o.ks = e.m;
      o.kl = 1;
      o.pc = col.plexi;
      o.pt = [2.8, 2.8, 4.5][b];
      o.dp = [6, 7, 8][b];
      break;
    case 'kabartma':
    case 'kapi':
      if (col.metal) {
        o.km = 'aynali';
        o.kk = [4, 8, 8][b];
        o.kr = col.metal === 'gold' ? 'ad-gold' : 'ad-gumus';
      } else if (b === 0 && col.dek) {
        o.km = 'dekota';
        o.kk = 4.5;
        o.kr = col.dek;
      } else {
        o.km = 'pleksi';
        o.kk = [2.8, 4.5, 7.8][b];
        o.kr = col.plexi;
      }
      if (T.id === 'kapi') s.fx = ['bant', 'distans', 'distans'][b];
      break;
    case 'germe':
      s.gc = col.germe;
      s.gi = 'auto';
      s.fr = b === 2 ? 'eloksal' : 'beyaz';
      s.sd = 'tek';
      break;
    default:
      break;
  }
  return normalize(s);
}

/** Tür değiştirilince o türe uygun varsayılan renkleri uygular, sonra türetir */
export function setEasyType(st, typeId, budget) {
  const T = easyType(typeId);
  const e = { ...st.e, t: T.id, c: T.defaults.c, g: T.defaults.g };
  if (typeof budget === 'number') e.b = budget;
  return deriveEasy({ ...st, e });
}

/** Kolay moddaki bir seçim (e.xxx) değişti */
export function applyEasyChange(st, key, value) {
  if (key === 'e.t') return setEasyType(st, String(value));
  const field = key.slice(2);
  return deriveEasy({ ...st, e: { ...st.e, [field]: field === 'b' ? Number(value) : value } });
}

// ---------------------------------------------------------------------------
// "Bana öner"
// ---------------------------------------------------------------------------
export function recommend({ where = 'cephe', light = 'fark', look = 'canli' } = {}) {
  const budgetByLook = { sade: 0, canli: 1, modern: 1, luks: 2 };
  let type = 'isikli_harf';
  let why = '';
  if (where === 'kapi') {
    type = 'kapi';
    why = 'Oda ve kapılar için küçük, şık bir kapı/ofis tabelası en uygunu.';
  } else if (where === 'yol') {
    type = 'totem';
    why = 'Yol kenarında ve giriş alanlarında uzaktan fark edilmek için totem idealdir.';
  } else if (where === 'pano') {
    type = 'germe';
    why = 'Geniş yüzeylerde baskılı, arkadan aydınlatmalı germe tabela hem etkili hem verimlidir.';
  } else if (light === 'hayir') {
    type = 'kabartma';
    why = 'Işıksız istediğiniz için panele yapıştırılan kabartma harf sade, sağlam ve uygun fiyatlıdır.';
  } else if (look === 'luks') {
    type = 'krom';
    why = 'Lüks ve prestijli görünüm için altın veya gümüş yanlı krom harf önerilir.';
  } else if (look === 'modern') {
    type = 'dekupe';
    why = 'Şık ve modern görünüm için panelden oyulmuş, arkadan ışıklı yazı (dekupe) önerilir.';
  } else {
    type = 'isikli_harf';
    why = look === 'sade'
      ? 'Sade ve ekonomik bir ışıklı çözüm için ışıklı harf (kutu harf) en dengeli seçimdir.'
      : 'Dikkat çekmek ve gece de net görünmek için ışıklı harf (kutu harf) en çok tercih edilen çözümdür.';
  }
  return { type, budget: budgetByLook[look] ?? 1, why };
}

// ---------------------------------------------------------------------------
// Yardımcılar (arayüz metinleri)
// ---------------------------------------------------------------------------
/** Bütçe kartında gösterilen tek satırlık özet: seçilen bütçenin teknik karşılığı */
export function budgetSummary(st, b) {
  const s = deriveEasy({ ...st, e: { ...st.e, b } });
  const o = s.o;
  const led = find(LED_BRANDS, o.lb).name;
  switch (s.e.t) {
    case 'isikli_harf':
    case 'totem':
      return `${fmtMm(o.pt)} pleksi · ${o.dp} cm derinlik · ${led}${o.side === 'plexi' ? ' · ışıklı yan bant' : ''}`;
    case 'dekupe':
      return `${fmtMm(o.pt)} pleksi dolgu · arkadan LED · ${led}`;
    case 'krom':
      return `${o.kt === 'fileli' ? 'Fileli' : 'Filesiz'} krom · ${fmtMm(o.pt)} pleksi · ${o.dp} cm derinlik`;
    case 'kabartma':
    case 'kapi':
      return `${{ pleksi: 'Pleksi', dekota: 'Dekota', aynali: 'Aynalı dekota' }[o.km]} harf ${fmtMm(o.kk)} · kompozit zemin ${fmtMm(s.zt)}`;
    case 'germe':
      return `${find(FRAME_COLORS, s.fr).name} çerçeve · ${led}`;
    default:
      return '';
  }
}

/** Yazı (ana renk) ile zemin birbirine çok yakınsa uyarı metni döner */
export function contrastWarning(st) {
  const T = easyType(st.e.t);
  if (!T.zemin) return '';
  const col = easyColor(st.e.c);
  const bg = easyBg(st.e.g);
  const a = lum(col.hex) + 0.05;
  const b = lum(bg.hex) + 0.05;
  const ratio = Math.max(a, b) / Math.min(a, b); // WCAG kontrast oranı
  return ratio < 1.8 ? 'Seçtiğiniz renk ile zemin birbirine çok yakın; okunurluk düşebilir. Daha zıt bir renk öneririz.' : '';
}

