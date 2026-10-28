// Tabela sihirbazı: durum yönetimi, olaylar, önizleme ve paylaşım eylemleri.
import { FONTS, PRESETS, EASY_TYPES } from '../data/catalog.mjs';
import {
  defaultState, normalize, switchProduct, encodeState, decodeState, getProduct, applyPreset,
} from './state.js';
import {
  find, summarize, refNo, specText, whatsappText, isLit, activeLines,
} from './model.js';
import { buildScene, clearMeasureCache } from './render.js';
import { deriveEasy, applyEasyChange, setEasyType, recommend } from './easy.js';
import { stepsFor, renderStep, specHTML, levelMeter } from './ui.js';
import {
  waLink, copyText, buildCard, canvasToBlob, downloadBlob,
} from './share.js';

const LS_KEY = 'ir.wizard.v1';
const BRAND = 'İyi Reklam';

function lsGet() { try { return localStorage.getItem(LS_KEY); } catch { return null; } }
function lsSet(v) { try { localStorage.setItem(LS_KEY, v); } catch { /* özel mod vb. */ } }
function lsDel() { try { localStorage.removeItem(LS_KEY); } catch { /* yok say */ } }

function setPath(obj, path, val) {
  const parts = path.split('.');
  let o = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = Array.isArray(o) ? Number(parts[i]) : parts[i];
    if (o[key] == null || typeof o[key] !== 'object') o[key] = {};
    o = o[key];
  }
  const last = Array.isArray(o) ? Number(parts[parts.length - 1]) : parts[parts.length - 1];
  o[last] = val;
}

function deepClone(x) { return JSON.parse(JSON.stringify(x)); }

export function mountWizard(root) {
  const base = root.dataset.base || '../assets/';
  const app = { st: deriveEasy(defaultState('cephe')), night: false, stepId: 'tur', meta: {}, logoUrl: null, scene: null, quiz: {}, quizWhy: '' };

  // ---- başlangıç durumu
  let banner = '';
  const hash = location.hash.match(/[#&]d=([A-Za-z0-9_-]+)/);
  const params = new URLSearchParams(location.search);
  if (hash) {
    const st = decodeState(hash[1]);
    if (st) { app.st = st; app.stepId = 'ozet'; banner = 'shared'; }
  }
  if (!banner) {
    const saved = lsGet();
    const st = saved ? decodeState(saved) : null;
    if (st) { app.st = st; banner = 'restored'; app.stepId = st.m === 'e' ? 'tur' : 'urun'; }
  }
  if (!hash) {
    const mod = params.get('mod');
    const tur = params.get('tur');
    const urun = params.get('urun');
    const typeOfProduct = { cephe: 'isikli_harf', totem: 'totem', kapi: 'kapi', germe: 'germe' };
    // Kayıtlı/paylaşılan tasarım yoksa ve doğrudan detaylı mod istendiyse sade (ekonomik) varsayılanlarla başla
    if (!banner && mod === 'detayli') app.st = normalize({ ...defaultState('cephe'), m: 'p' });
    if (tur && EASY_TYPES.some((t) => t.id === tur)) {
      app.st = setEasyType({ ...app.st, m: 'e' }, tur);
      banner = '';
    } else if (urun && getProduct(urun).id === urun && urun !== app.st.p) {
      app.st = app.st.m === 'e' ? setEasyType(app.st, typeOfProduct[urun]) : switchProduct(app.st, urun);
      banner = '';
    }
    if (mod === 'detayli') app.st = normalize({ ...app.st, m: 'p' });
    else if (mod === 'kolay' && app.st.m !== 'e') app.st = deriveEasy({ ...app.st, m: 'e' });
    if (!banner || mod) app.stepId = app.st.m === 'e' ? 'tur' : 'urun';
  }

  // ---- iskelet
  root.innerHTML =
    `<div class="wz">` +
    `<div class="wz-mode" role="radiogroup" aria-label="Sihirbaz modu">` +
    `<label class="mode-o"><input type="radio" name="mode" value="e" data-act="mode"><span><b>Kolay mod</b><small>Biz önerelim, siz seçin</small></span></label>` +
    `<label class="mode-o"><input type="radio" name="mode" value="p" data-act="mode"><span><b>Detaylı mod</b><small>Tüm malzeme ayrıntıları</small></span></label>` +
    `</div>` +
    `<nav class="wz-steps" aria-label="Sihirbaz adımları"><ol id="wz-steps"></ol><div class="wz-prog" aria-hidden="true"><i id="wz-prog"></i></div></nav>` +
    `<div class="wz-banner" id="wz-banner" hidden></div>` +
    `<div class="wz-grid">` +
    `<aside class="wz-stage" aria-label="Tabela önizlemesi">` +
    `<div class="wz-view" id="wz-view"></div>` +
    `<div class="wz-tools">` +
    `<div class="seg seg-sm" role="radiogroup" aria-label="Görünüm"><label class="seg-o"><input type="radio" name="view" value="day" checked data-act="view"><span>Gündüz</span></label><label class="seg-o"><input type="radio" name="view" value="night" data-act="view"><span>Gece</span></label></div>` +
    `<button type="button" class="pill" data-act="zoom">Büyüt</button>` +
    `<button type="button" class="pill" data-act="reset">Sıfırla</button>` +
    `</div>` +
    `<div class="wz-mini" id="wz-mini"></div>` +
    `</aside>` +
    `<section class="wz-panel" aria-label="Seçenekler">` +
    `<div id="wz-step" tabindex="-1"></div>` +
    `<div class="wz-nav"><button type="button" class="btn btn-ghost" data-act="prev">Geri</button><span class="wz-count" id="wz-count"></span><button type="button" class="btn btn-primary" data-act="next">İleri</button></div>` +
    `</section>` +
    `</div>` +
    `<dialog id="wz-zoom" class="wz-zoom" aria-label="Büyük önizleme"><button type="button" class="wz-zoom-x" data-act="zoom-close" aria-label="Kapat">×</button><div id="wz-zoom-view"></div></dialog>` +
    `</div>`;

  const $ = (id) => root.querySelector('#' + id);
  const view = $('wz-view');
  const stepHost = $('wz-step');
  const mini = $('wz-mini');
  const stepsEl = $('wz-steps');
  const prog = $('wz-prog');
  const countEl = $('wz-count');
  const bannerEl = $('wz-banner');
  const zoomDlg = $('wz-zoom');

  // ---- yardımcılar
  const steps = () => stepsFor(app.st);
  const stepIndex = () => {
    const i = steps().findIndex((s) => s.id === app.stepId);
    return i < 0 ? 0 : i;
  };
  function ensureStep() {
    const list = steps();
    if (!list.some((s) => s.id === app.stepId)) {
      app.stepId = app.stepId === 'sistem' && list.some((s) => s.id === 'detay') ? 'detay' : list[0].id;
    }
  }

  function say(msg) {
    const el = root.querySelector('#act-msg');
    if (el) { el.textContent = msg; }
  }

  // ---- yazı tipi yükleme
  let fontKey = '';
  function ensureFont() {
    const f = find(FONTS, app.st.f);
    const text = activeLines(app.st).map((l) => l.t).join(' ') || 'A';
    const key = f.id + '|' + text;
    if (key === fontKey) return;
    fontKey = key;
    if (!document.fonts || !document.fonts.load) return;
    document.fonts.load(`${f.weight} 64px "${f.family}"`, text).then(() => {
      if (key !== fontKey) return;
      clearMeasureCache();
      renderPreview(true);
    }).catch(() => {});
  }

  // ---- önizleme
  let raf = 0;
  function renderPreview(sync = false) {
    const run = () => {
      raf = 0;
      const r = buildScene(app.st, { night: app.night, idp: 'p', logoUrl: app.logoUrl });
      app.scene = r;
      app.meta = r.meta;
      view.innerHTML = r.svg;
      renderMini();
      if (zoomDlg.open) $('wz-zoom-view').innerHTML = buildScene(app.st, { night: app.night, idp: 'z', logoUrl: app.logoUrl }).svg;
    };
    if (sync) { if (raf) cancelAnimationFrame(raf); run(); return; }
    if (!raf) raf = requestAnimationFrame(run);
  }

  function renderMini() {
    const info = summarize(app.st, app.meta || {});
    const caps = (app.meta?.lines || []).map((l) => `${String(Math.round(l.capCm * 10) / 10).replace('.', ',')} cm`);
    mini.innerHTML =
      `<div class="mini-row"><span>Fiyat seviyesi</span><b>${info.level.label}</b>${levelMeter(info.level)}</div>` +
      (caps.length ? `<div class="mini-row"><span>Harf yüksekliği ≈</span><b>${caps.join(' · ')}</b></div>` : '');
  }

  // ---- adım çubuğu (yapı değişmedikçe düğmeler yerinde güncellenir; böylece
  // alan odağı kaybolurken yapılan tıklamalar yok olmaz)
  let stepsSig = '';
  function renderSteps() {
    const list = steps();
    const idx = stepIndex();
    const sig = list.map((s) => s.id + s.t).join('|');
    if (sig !== stepsSig) {
      stepsSig = sig;
      stepsEl.innerHTML = list
        .map((s, i) => `<li><button type="button" data-act="goto" data-step="${s.id}"><i>${i + 1}</i><span>${s.t}</span></button></li>`)
        .join('');
    }
    stepsEl.querySelectorAll('button').forEach((b, i) => {
      b.className = (i === idx ? 'on' : '') + (i < idx ? ' done' : '');
      if (i === idx) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
    prog.style.width = `${((idx + 1) / list.length) * 100}%`;
    countEl.textContent = `Adım ${idx + 1} / ${list.length}`;
    const prev = root.querySelector('[data-act="prev"]');
    const next = root.querySelector('[data-act="next"]');
    prev.disabled = idx === 0;
    next.hidden = idx === list.length - 1;
    root.querySelectorAll('input[name="mode"]').forEach((i) => { i.checked = i.value === app.st.m; });
    // aktif adımı yatay çubukta görünür kıl
    const on = stepsEl.querySelector('.on');
    if (on && stepsEl.scrollWidth > stepsEl.clientWidth) {
      const left = on.offsetLeft - stepsEl.clientWidth / 2 + on.clientWidth / 2;
      stepsEl.scrollLeft = Math.max(0, left);
    }
  }

  // ---- adım içeriği
  function specParts(a = 's1', b = 's2') {
    const day = buildScene(app.st, { night: false, idp: a, logoUrl: app.logoUrl });
    const night = isLit(app.st) ? buildScene(app.st, { night: true, idp: b, logoUrl: app.logoUrl }) : null;
    return specHTML(app, day.svg, night ? night.svg : '');
  }

  function renderPanel({ keepFocus = true } = {}) {
    ensureStep();
    const ae = document.activeElement;
    const sig = keepFocus && ae && ae.dataset && (ae.dataset.k || ae.dataset.q) ? { k: ae.dataset.k, q: ae.dataset.q, v: ae.value } : null;
    const isFinal = app.stepId === 'ozet';
    stepHost.innerHTML = renderStep(app, isFinal ? '<div id="spec-host"></div>' : '');
    if (isFinal) updateSpec();
    renderSteps();
    if (sig) {
      const sel = (sig.k ? `[data-k="${CSS.escape(sig.k)}"]` : `[data-q="${CSS.escape(sig.q)}"]`) + (ae.type === 'radio' ? `[value="${CSS.escape(String(sig.v))}"]` : '');
      const el = stepHost.querySelector(sel);
      if (el && el.focus) el.focus({ preventScroll: true });
    }
  }

  function updateSpec() {
    const host = root.querySelector('#spec-host');
    if (!host) return;
    host.innerHTML = specParts().html;
  }

  // ---- kaydet / URL
  let saveT = 0;
  function persist() {
    clearTimeout(saveT);
    saveT = setTimeout(() => {
      const code = encodeState(app.st);
      lsSet(code);
      try { history.replaceState(null, '', location.pathname + location.search + '#d=' + code); } catch { /* file:// vb. */ }
    }, 350);
  }

  function commit({ rerender = false, spec = true } = {}) {
    app.st = normalize(app.st);
    ensureStep();
    ensureFont();
    renderPreview();
    persist();
    if (rerender) renderPanel();
    else if (app.stepId === 'ozet' && spec) updateSpec();
    renderSteps();
  }

  function showBanner(kind) {
    if (!kind) { bannerEl.hidden = true; return; }
    bannerEl.hidden = false;
    bannerEl.innerHTML =
      (kind === 'shared'
        ? '<b>Paylaşılan tasarım açıldı.</b> Seçimleri inceleyebilir, değiştirebilir veya yeni bir tasarım başlatabilirsiniz.'
        : '<b>Kaldığınız yerden devam ediyorsunuz.</b> Önceki tasarımınız bu cihazdan yüklendi.') +
      ' <button type="button" class="pill" data-act="reset">Yeni tasarım</button> <button type="button" class="pill" data-act="banner-close" aria-label="Kapat">Tamam</button>';
  }

  function go(stepId) {
    app.stepId = stepId;
    renderPanel({ keepFocus: false });
    const top = root.getBoundingClientRect().top + window.scrollY - (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--hdr')) || 64) - 8;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    stepHost.focus({ preventScroll: true });
  }

  function setMode(m) {
    if (m === 'e') app.st = deriveEasy({ ...app.st, m: 'e' });
    else app.st = normalize({ ...app.st, m: 'p' });
    app.stepId = steps()[0].id;
    commit({ rerender: true });
  }

  function onQuiz(name, value) {
    app.quiz[name] = value;
    const r = recommend(app.quiz);
    app.quizWhy = r.why;
    app.st = setEasyType(app.st, r.type, r.budget);
    commit({ rerender: true });
  }

  // ---- olaylar
  function parseVal(t) {
    if (t.type === 'checkbox') return t.checked ? 1 : 0;
    if (t.dataset.n) return Number(t.value);
    return t.value;
  }

  root.addEventListener('change', (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    if (t.dataset.act === 'view') { app.night = t.value === 'night'; renderPreview(); return; }
    if (t.dataset.act === 'mode') { setMode(t.value); return; }
    if (t.dataset.q) { onQuiz(t.dataset.q, t.value); return; }
    if (t.dataset.act === 'logo' && t.files && t.files[0]) { loadLogo(t.files[0]); return; }
    if (!t.dataset.k) return;
    if (t.type === 'number' || t.type === 'text' || t.type === 'tel' || t.tagName === 'TEXTAREA' || t.type === 'range') {
      if (t.dataset.num) {
        const min = Number(t.dataset.min); const max = Number(t.dataset.max);
        let n = Number(String(t.value).replace(',', '.'));
        if (!Number.isFinite(n)) n = min;
        n = Math.min(max, Math.max(min, n));
        t.value = n;
        setPath(app.st, t.dataset.k, n);
        const err = root.querySelector('#size-err');
        if (err) err.hidden = true;
        commit();
      }
      return;
    }
    const val = parseVal(t);
    if (t.dataset.k.startsWith('e.')) {
      app.st = applyEasyChange(app.st, t.dataset.k, val);
      commit({ rerender: true });
      return;
    }
    if (t.dataset.act === 'product') app.st = switchProduct(app.st, String(val));
    else setPath(app.st, t.dataset.k, val);
    // toggle'lar ve radyo seçimleri adımın görünümünü değiştirebilir
    commit({ rerender: true });
  });

  root.addEventListener('input', (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement) || !t.dataset.k) return;
    if (t.type === 'radio' || t.type === 'checkbox') return;
    if (t.dataset.num) {
      const min = Number(t.dataset.min); const max = Number(t.dataset.max);
      const n = Number(String(t.value).replace(',', '.'));
      const err = root.querySelector('#size-err');
      if (t.type === 'range') {
        const out = t.parentElement.querySelector('output');
        if (out) out.textContent = `${n}%`;
      }
      if (Number.isFinite(n) && n >= min && n <= max) {
        setPath(app.st, t.dataset.k, n);
        if (err) err.hidden = true;
        commit({ spec: false });
      } else if (err && t.type !== 'range') {
        err.hidden = false;
        err.textContent = `Lütfen ${min} ile ${max} arasında bir değer girin.`;
      }
      return;
    }
    setPath(app.st, t.dataset.k, t.value);
    commit({ spec: true });
  });

  root.addEventListener('click', (e) => {
    const b = e.target instanceof Element ? e.target.closest('[data-act]') : null;
    if (!b || b.tagName === 'INPUT') return;
    const act = b.dataset.act;
    const list = steps();
    const idx = stepIndex();
    switch (act) {
      case 'next': if (idx < list.length - 1) go(list[idx + 1].id); break;
      case 'prev': if (idx > 0) go(list[idx - 1].id); break;
      case 'goto': go(b.dataset.step); break;
      case 'tpl': {
        const t = PRESETS[Number(b.dataset.i)];
        if (t) { app.st = applyPreset(app.st, t); commit({ rerender: true }); say(''); }
        break;
      }
      case 'preset':
        app.st.w = Number(b.dataset.w); app.st.h = Number(b.dataset.h);
        commit({ rerender: true });
        break;
      case 'note': {
        const wrap = b.closest('.note');
        const ta = wrap.querySelector('textarea');
        const open = ta.hidden;
        ta.hidden = !open;
        wrap.classList.toggle('open', open);
        b.setAttribute('aria-expanded', String(open));
        if (open) ta.focus();
        break;
      }
      case 'pro': {
        app.st = normalize({ ...app.st, m: 'p' });
        commit({ rerender: true });
        go(app.st.p === 'germe' ? 'zemin' : 'sistem');
        break;
      }
      case 'reset': {
        app.st = app.st.m === 'e' ? deriveEasy(defaultState('cephe')) : normalize({ ...defaultState('cephe'), m: 'p' });
        app.logoUrl = null;
        app.quiz = {};
        app.quizWhy = '';
        app.stepId = steps()[0].id;
        lsDel();
        showBanner('');
        commit({ rerender: true });
        break;
      }
      case 'banner-close': showBanner(''); break;
      case 'zoom':
        zoomDlg.showModal ? zoomDlg.showModal() : zoomDlg.setAttribute('open', '');
        $('wz-zoom-view').innerHTML = buildScene(app.st, { night: app.night, idp: 'z', logoUrl: app.logoUrl }).svg;
        break;
      case 'zoom-close': zoomDlg.close ? zoomDlg.close() : zoomDlg.removeAttribute('open'); break;
      case 'logo-clear': app.logoUrl = null; renderPreview(); renderPanel(); break;
      case 'whatsapp': doWhatsapp(); break;
      case 'copy': doCopy(); break;
      case 'link': doLink(); break;
      case 'png': doPng(false); break;
      case 'share': doPng(true); break;
      case 'print': doPrint(); break;
      default: break;
    }
  });

  zoomDlg.addEventListener('click', (e) => { if (e.target === zoomDlg) zoomDlg.close(); });

  // ---- logo
  function loadLogo(file) {
    if (!/^image\//.test(file.type) || file.size > 3 * 1024 * 1024) {
      say('Logo en fazla 3 MB olan bir görsel olmalıdır.');
      return;
    }
    const fr = new FileReader();
    fr.onload = () => { app.logoUrl = String(fr.result); renderPreview(); renderPanel(); };
    fr.readAsDataURL(file);
  }

  // ---- paylaşım eylemleri
  const link = () => `${location.origin === 'null' ? '' : location.origin}${location.pathname}#d=${encodeState(app.st)}`;
  const info = () => ({ brand: BRAND, ref: refNo(app.st), date: new Date().toLocaleDateString('tr-TR'), link: link().length < 6000 ? link() : '' });

  function doWhatsapp() {
    const text = whatsappText(app.st, app.meta || {}, info());
    window.open(waLink(text), '_blank', 'noopener');
    say('WhatsApp açılıyor… Mesajda şartname özeti ve tasarım bağlantısı yer alır.');
  }

  async function doCopy() {
    const ok = await copyText(specText(app.st, app.meta || {}, info()));
    say(ok ? 'Şartname metni panoya kopyalandı.' : 'Kopyalanamadı; lütfen metni elle seçin.');
  }

  async function doLink() {
    const ok = await copyText(link());
    say(ok ? 'Tasarım bağlantısı panoya kopyalandı. Bağlantıyı açan herkes aynı tasarımı görür.' : 'Kopyalanamadı; adres çubuğundaki bağlantıyı paylaşabilirsiniz.');
  }

  async function doPng(share) {
    say('Görsel hazırlanıyor…');
    try {
      const scenes = [{ ...buildScene(app.st, { night: false, idp: 'x1', logoUrl: app.logoUrl }), label: 'Gündüz' }];
      if (isLit(app.st)) scenes.push({ ...buildScene(app.st, { night: true, idp: 'x2', logoUrl: app.logoUrl }), label: 'Gece' });
      const cv = await buildCard(app, scenes, base);
      const blob = await canvasToBlob(cv);
      if (!blob) throw new Error('blob');
      const name = `iyi-reklam-sartname-${refNo(app.st)}.png`;
      if (share && navigator.canShare) {
        const file = new File([blob], name, { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: 'Tabela şartnamesi', text: whatsappText(app.st, app.meta || {}, info()) });
            say('Paylaşıldı.');
            return;
          } catch (err) {
            if (err && err.name === 'AbortError') { say(''); return; }
          }
        }
      }
      downloadBlob(blob, name);
      say('Görsel indirildi. WhatsApp’tan bize gönderebilirsiniz.');
    } catch {
      say('Görsel oluşturulamadı. “Yazdır / PDF” seçeneğini deneyebilirsiniz.');
    }
  }

  function doPrint() {
    let pr = document.getElementById('print-root');
    if (!pr) {
      pr = document.createElement('div');
      pr.id = 'print-root';
      document.body.appendChild(pr);
    }
    pr.innerHTML = specParts('r1', 'r2').html;
    setTimeout(() => window.print(), 80);
  }
  window.addEventListener('afterprint', () => {
    const pr = document.getElementById('print-root');
    if (pr) pr.innerHTML = '';
  });

  // ---- ilk çizim
  showBanner(banner);
  renderPreview(true);
  renderPanel({ keepFocus: false });
  ensureFont();
  document.documentElement.classList.add('wz-ready');
  // test ve hata ayıklama için küçük bir kanca
  root.__wz = { app, deepClone };
}
