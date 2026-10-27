#!/usr/bin/env node
// Uçtan uca testler (Playwright + Chromium). Çalıştırma: npm test  (önce derleme yapar)
// Hem kök dizinde hem alt yolda (GitHub Pages benzetimi) yayını sınar.
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { startServer } from '../scripts/serve.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'tests/out');
await mkdir(OUT, { recursive: true });

const results = [];
let current = '';
async function test(name, fn) {
  current = name;
  const t0 = Date.now();
  try {
    await fn();
    results.push({ name, ok: true, ms: Date.now() - t0 });
    console.log(`  ✓ ${name} (${Date.now() - t0} ms)`);
  } catch (e) {
    results.push({ name, ok: false, err: e });
    console.log(`  ✗ ${name}\n      ${String(e && e.stack ? e.stack : e).split('\n').slice(0, 6).join('\n      ')}`);
  }
}
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
// Gerçek bir click olayı üretir (radyo/onay kutusunu seçer, change tetikler); yapışkan çubuk altında kalan öğeler için de güvenilir
const hit = (loc) => loc.evaluate((e) => e.click());

const server = await startServer(0, '');
const port = server.address().port;
const server2 = await startServer(0, '/iyireklam');
const port2 = server2.address().port;
const BASE = `http://localhost:${port}`;
const SUB = `http://localhost:${port2}/iyireklam`;

const browser = await chromium.launch();

async function newPage(opts = {}) {
  const ctx = await browser.newContext({
    viewport: opts.viewport || { width: 1280, height: 900 },
    permissions: ['clipboard-read', 'clipboard-write'],
    acceptDownloads: true,
    isMobile: !!opts.mobile,
    hasTouch: !!opts.mobile,
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  page.errs = [];
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') {
      const t = m.text();
      // dış kaynak (harita/ağ) kaynaklı beklenen gürültü
      if (/google\.com|ERR_(NAME_NOT_RESOLVED|INTERNET_DISCONNECTED|CONNECTION|TUNNEL|FAILED)|Failed to load resource/i.test(t)) return;
      page.errs.push(`${m.type()}: ${t}`);
    }
  });
  page.on('pageerror', (e) => page.errs.push('pageerror: ' + e));
  page.on('requestfailed', (r) => { if (r.url().startsWith('http://localhost')) page.errs.push('requestfailed: ' + r.url()); });
  page.on('response', (r) => { if (r.url().startsWith('http://localhost') && r.status() >= 400 && !r.url().endsWith('/favicon.ico')) page.errs.push(`HTTP ${r.status()}: ${r.url()}`); });
  return page;
}
const noErrs = (page) => assert(page.errs.length === 0, 'Konsol/ağ hataları:\n' + page.errs.join('\n'));

const state = (page) => page.evaluate(() => JSON.parse(JSON.stringify(document.getElementById('wizard').__wz.app.st)));
const goStep = async (page, id) => {
  await page.locator(`[data-act="goto"][data-step="${id}"]`).click();
  await page.waitForTimeout(60);
};
async function checkSvg(page, label) {
  const info = await page.evaluate(() => {
    const s = document.querySelector('#wz-view svg');
    if (!s) return { ok: false, why: 'svg yok' };
    const h = s.outerHTML;
    const bad = /NaN|undefined|\[object|Infinity/.test(h);
    const vb = s.getAttribute('viewBox');
    return { ok: !bad, why: bad ? (h.match(/.{30}(NaN|undefined|\[object|Infinity).{30}/) || [''])[0] : '', vb };
  });
  assert(info.ok, `${label}: önizleme SVG geçersiz (${info.why})`);
  const noOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  assert(noOverflow, `${label}: yatay taşma`);
}

// ---------------------------------------------------------------------------
console.log('\n▶ Genel sayfalar');
// ---------------------------------------------------------------------------
const SLUGS = await (async () => {
  const man = JSON.parse(await readFile(path.join(ROOT, '.build-manifest.json'), 'utf8'));
  return man.filter((f) => f.endsWith('index.html')).map((f) => f.replace(/index\.html$/, ''));
})();

for (const [label, vp, mobile] of [['masaüstü', { width: 1280, height: 900 }, false], ['mobil', { width: 360, height: 740 }, true]]) {
  await test(`Tüm sayfalar yüklenir, hata yok, yatay taşma yok (${label}, ${SLUGS.length} sayfa)`, async () => {
    const page = await newPage({ viewport: vp, mobile });
    for (const s of SLUGS) {
      await page.goto(`${BASE}/${s}`, { waitUntil: 'networkidle' });
      const h1 = await page.locator('h1').count();
      assert(h1 === 1, `/${s} sayfasında ${h1} adet h1 var`);
      const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      assert(over <= 1, `/${s} yatay taşma ${over}px`);
    }
    noErrs(page);
    await page.context().close();
  });
}

await test('Alt yolda (GitHub Pages benzetimi) tüm varlıklar ve bağlantılar çalışır', async () => {
  const page = await newPage();
  await page.goto(`${SUB}/`, { waitUntil: 'networkidle' });
  const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')).filter((h) => h && !h.startsWith('http') && !h.startsWith('tel:') && !h.startsWith('mailto:') && !h.startsWith('#')));
  assert(hrefs.length > 20, 'bağlantı sayısı az');
  for (const h of new Set(hrefs)) {
    const url = new URL(h, `${SUB}/`).href;
    const res = await page.request.get(url);
    assert(res.status() === 200, `${h} -> ${res.status()}`);
  }
  await page.goto(`${SUB}/tabela-sihirbazi/`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.wz-steps button');
  await page.goto(`${SUB}/rehber/pleksi-kalinlik-secimi/`, { waitUntil: 'networkidle' });
  const bad = await page.request.get(`${SUB}/olmayan-sayfa/`);
  assert(bad.status() === 404, '404 beklenir');
  noErrs(page);
  await page.context().close();
});

await test('Mobil menü açılır/kapanır, hizmetler bağlantıları görünür', async () => {
  const page = await newPage({ viewport: { width: 390, height: 780 }, mobile: true });
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  assert(!(await page.locator('#nav').isVisible()), 'menü başta kapalı olmalı');
  await page.locator('.burger').click();
  assert(await page.locator('#nav').isVisible(), 'menü açılmalı');
  assert(await page.locator('#nav a[href*="kutu-harf-tabela"]').isVisible(), 'kutu harf bağlantısı görünmeli');
  await page.locator('#nav a[href*="kutu-harf-tabela"]').click();
  await page.waitForURL(/kutu-harf-tabela/);
  assert(!(await page.locator('#nav').isVisible()), 'gezinince menü kapanmalı');
  noErrs(page);
  await page.context().close();
});

await test('Harita isteğe bağlı yüklenir (iframe eklenir)', async () => {
  const page = await newPage();
  await page.goto(`${BASE}/iletisim/`, { waitUntil: 'networkidle' });
  assert((await page.locator('.map iframe').count()) === 0, 'başta iframe olmamalı');
  await page.locator('[data-map-load]').click();
  await page.waitForSelector('.map iframe');
  const src = await page.locator('.map iframe').getAttribute('src');
  assert(src.startsWith('https://www.google.com/maps'), 'harita adresi');
  await page.context().close();
});

await test('SEO: canonical, JSON-LD, OG, robots, sitemap, llms.txt', async () => {
  const page = await newPage();
  await page.goto(`${BASE}/kutu-harf-tabela/`);
  const canon = await page.locator('link[rel=canonical]').getAttribute('href');
  assert(/\/kutu-harf-tabela\/$/.test(canon), 'canonical ' + canon);
  const lds = await page.$$eval('script[type="application/ld+json"]', (n) => n.map((x) => JSON.parse(x.textContent)));
  assert(lds.length === 1 && lds[0]['@graph'].some((g) => g['@type'] === 'Service'), 'Service JSON-LD');
  assert(lds[0]['@graph'].some((g) => g['@type'] === 'FAQPage'), 'FAQPage JSON-LD');
  for (const f of ['robots.txt', 'sitemap.xml', 'llms.txt', 'llms-full.txt', 'site.webmanifest']) {
    const r = await page.request.get(`${BASE}/${f}`);
    assert(r.status() === 200, f);
  }
  const llms = await (await page.request.get(`${BASE}/llms.txt`)).text();
  assert(llms.includes('0531 520 90 01') && llms.includes('Sebze Bahçeleri'), 'llms.txt NAP');
  const sm = await (await page.request.get(`${BASE}/sitemap.xml`)).text();
  assert((sm.match(/<loc>/g) || []).length === SLUGS.length, 'sitemap URL sayısı');
  await page.context().close();
});

// ---------------------------------------------------------------------------
console.log('\n▶ Sihirbaz');
// ---------------------------------------------------------------------------
async function openWizard(page, q = '') {
  await page.goto(`${BASE}/tabela-sihirbazi/${q}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) { /* */ } });
  if (q === '' || !q.includes('#')) {
    await page.goto(`${BASE}/tabela-sihirbazi/${q}`, { waitUntil: 'networkidle' });
  }
  await page.waitForSelector('.wz-steps button');
}

await test('Sihirbaz açılır; varsayılan durum, 7 adım, hata yok', async () => {
  const page = await newPage();
  await openWizard(page);
  assert((await page.locator('.wz-steps button').count()) === 7, '7 adım');
  const st = await state(page);
  assert(st.p === 'cephe' && st.w === 300 && st.h === 80, 'varsayılan durum');
  await checkSvg(page, 'varsayılan');
  noErrs(page);
  await page.context().close();
});

await test('?urun= parametresi ürünü seçer (4 ürün)', async () => {
  const page = await newPage();
  for (const p of ['cephe', 'totem', 'kapi', 'germe']) {
    await openWizard(page, `?urun=${p}`);
    const st = await state(page);
    assert(st.p === p, `${p} seçilmeli, gelen ${st.p}`);
    await checkSvg(page, p);
  }
  noErrs(page);
  await page.context().close();
});

async function fuzzStep(page, label, { night = false } = {}) {
  // adımdaki her radyo/onay kutusunu sırayla seç; her seçimde önizlemeyi doğrula
  const pairs = await page.$$eval('#wz-step input[type=radio][data-k]', (els) => els.map((e) => [e.name, e.value]));
  let n = 0;
  for (const [name, value] of pairs) {
    if (name === 'p') continue; // ürün değişimi ayrıca sınanır
    const sel = `#wz-step input[type=radio][name="${name}"][value="${value}"]`;
    const el = page.locator(sel);
    if ((await el.count()) === 0) continue; // seçim diğer grupları yeniden çizmiş olabilir
    await hit(el);
    await page.waitForTimeout(25);
    await checkSvg(page, `${label} ${name}=${value}${night ? ' (gece)' : ''}`);
    if (name !== 'z' && name !== 'view') {
      const got = await page.evaluate((nm) => {
        let o = document.getElementById('wizard').__wz.app.st;
        for (const k of nm.split('.')) o = o == null ? o : o[k];
        return o;
      }, name);
      assert(String(got) === String(value), `${label}: ${name}=${value} seçilmedi, durumda ${got}`);
    }
    n++;
  }
  const toggles = await page.$$eval('#wz-step input[type=checkbox][data-k]', (els) => els.map((e) => e.dataset.k));
  for (const k of toggles) {
    const el = page.locator(`#wz-step input[type=checkbox][data-k="${k}"]`);
    if ((await el.count()) === 0) continue;
    await hit(el);
    await page.waitForTimeout(25);
    await checkSvg(page, `${label} toggle ${k}`);
    await hit(el);
    n++;
  }
  return n;
}

for (const product of ['cephe', 'totem', 'kapi', 'germe']) {
  await test(`Her seçenek denenir: ${product} (tüm adımlar, tüm harf sistemleri, gündüz+gece)`, async () => {
    const page = await newPage();
    await openWizard(page, `?urun=${product}`);
    let total = 0;
    const stepIds = await page.$$eval('.wz-steps button', (b) => b.map((x) => x.dataset.step));
    for (const night of [false, true]) {
      if (night) await page.locator('input[name=view][value=night]').check({ force: true });
      await page.waitForTimeout(40);
      for (const id of stepIds) {
        if (id === 'urun' || id === 'ozet') continue;
        await goStep(page, id);
        if (id === 'sistem') {
          const strategies = await page.$$eval('#wz-step input[name="s"]', (e) => e.map((x) => x.value));
          for (const s of strategies) {
            await hit(page.locator(`#wz-step input[name="s"][value="${s}"]`));
            await checkSvg(page, `${product} sistem=${s}`);
            // bu sistemin detay adımını da tamamen dene
            await goStep(page, 'detay');
            total += await fuzzStep(page, `${product}/${s}/detay`, { night });
            await goStep(page, 'sistem');
          }
        } else if (id === 'detay') {
          // germe için sistem adımı yok; detay (aydınlatma) burada denenir
          if (product === 'germe') total += await fuzzStep(page, `${product}/detay`, { night });
        } else {
          total += await fuzzStep(page, `${product}/${id}`, { night });
        }
      }
    }
    assert(total > 40, `çok az seçenek denendi (${total})`);
    console.log(`      (${total} seçim denendi)`);
    noErrs(page);
    await page.context().close();
  });
}

await test('Hazır şablonlar: her biri uygulanır, ürün/sistem doğru, metin ve iletişim korunur', async () => {
  const page = await newPage();
  await openWizard(page);
  const n = await page.locator('.tpl').count();
  assert(n >= 6, 'şablon sayısı ' + n);
  const expect = [['cephe', 'kutu_isikli'], ['cephe', 'krom'], ['kapi', 'kabartma'], ['kapi', 'kabartma'], ['totem', 'kutu_isikli'], ['germe', 'baski'], ['cephe', 'dekupe'], ['cephe', 'kabartma']];
  for (let i = 0; i < n; i++) {
    await goStep(page, 'urun');
    await page.locator('.tpl').nth(i).click();
    await page.waitForTimeout(80);
    const st = await state(page);
    assert(st.p === expect[i][0] && st.s === expect[i][1], `şablon ${i}: ${st.p}/${st.s}`);
    await checkSvg(page, 'şablon ' + i);
    assert(st.L[0].t.length > 0, 'şablon metni');
  }
  // kullanıcı metni korunur
  await goStep(page, 'olcu');
  await page.locator('input[data-k="L.0.t"]').fill('Benim Firmam');
  await goStep(page, 'urun');
  await page.locator('.tpl').nth(1).click();
  const st = await state(page);
  assert(st.L[0].t === 'Benim Firmam' && st.s === 'krom', 'kullanıcı metni korunmalı: ' + st.L[0].t);
  noErrs(page);
  await page.context().close();
});

await test('Ölçü doğrulama: aralık dışı değer uyarı verir, tamamlanınca düzeltilir', async () => {
  const page = await newPage();
  await openWizard(page);
  await goStep(page, 'olcu');
  const w = page.locator('input[data-k="w"]');
  await w.fill('5');
  assert(await page.locator('#size-err').isVisible(), 'hata mesajı görünmeli');
  assert((await state(page)).w === 300, 'geçersiz değer duruma yazılmamalı');
  await w.fill('450');
  assert(!(await page.locator('#size-err').isVisible()), 'hata kaybolmalı');
  assert((await state(page)).w === 450, 'geçerli değer yazılmalı');
  await w.fill('99999');
  await w.blur();
  assert((await state(page)).w === 1500, 'üst sınıra çekilmeli');
  await page.locator('input[data-k="h"]').fill('120');
  assert((await state(page)).h === 120, 'yükseklik');
  await page.locator('[data-act="preset"]').first().click();
  const st = await state(page);
  assert(st.w === 200 && st.h === 60, 'hazır ölçü uygulanmalı');
  await checkSvg(page, 'ölçü');
  noErrs(page);
  await page.context().close();
});

await test('Uç ölçüler ve uzun metinler önizlemeyi bozmaz (tüm ürünler, gündüz+gece)', async () => {
  const page = await newPage();
  const sizes = {
    cephe: [[1500, 10], [30, 500], [1500, 500], [30, 10], [300, 80]],
    totem: [[400, 100], [40, 1000], [40, 100], [400, 1000]],
    kapi: [[8, 5], [150, 100], [8, 100], [150, 5]],
    germe: [[1000, 20], [30, 500], [30, 20], [1000, 500]],
  };
  const long = 'Çok Uzun Bir Firma Adı Anonim Şirketi Ticaret ve Sanayi Limited';
  for (const [product, list] of Object.entries(sizes)) {
    await openWizard(page, `?urun=${product}`);
    await goStep(page, 'olcu');
    await page.locator('input[data-k="L.0.t"]').fill(long);
    await page.locator('input[data-k="L.1.t"]').fill('Alt başlık metni de oldukça uzun olabilir burada');
    await page.locator('input[data-k="L.2.t"]').fill('0312 000 00 00 · www.ornek.com.tr · Ankara');
    for (const night of [false, true]) {
      await page.locator(`input[name=view][value=${night ? 'night' : 'day'}]`).check({ force: true });
      for (const [w, h] of list) {
        await page.locator('input[data-k="w"]').fill(String(w));
        await page.locator('input[data-k="h"]').fill(String(h));
        await page.waitForTimeout(60);
        await checkSvg(page, `${product} ${w}x${h}${night ? ' gece' : ''}`);
        const st = await state(page);
        assert(st.w === w && st.h === h, `${product}: ölçü uygulanmadı ${st.w}x${st.h}`);
      }
    }
  }
  noErrs(page);
  await page.context().close();
});

await test('Metin: Türkçe karakterler, büyük harf, satır boyutu, yazı tipleri, logo alanı', async () => {
  const page = await newPage();
  await openWizard(page);
  await goStep(page, 'olcu');
  await page.locator('input[data-k="L.0.t"]').fill('Çağrı İş ığş Öğüt');
  await page.locator('input[data-k="L.1.t"]').fill('şişli ğ ı i');
  await page.waitForTimeout(200);
  const txt = await page.locator('#wz-view svg').textContent();
  assert(txt.includes('ÇAĞRI İŞ IĞŞ ÖĞÜT'), 'tr-TR büyük harf dönüşümü: ' + txt);
  assert(txt.includes('ŞİŞLİ Ğ I İ'), 'ikinci satır büyük harf: ' + txt);
  await hit(page.locator('input[data-k="up"]'));
  await page.waitForTimeout(100);
  const txt2 = await page.locator('#wz-view svg').textContent();
  assert(txt2.includes('Çağrı İş ığş Öğüt'), 'büyük harf kapatılınca özgün yazı: ' + txt2);
  for (const f of ['montserrat', 'oswald', 'nunito', 'playfair', 'cormorant', 'dancing']) {
    await hit(page.locator(`input[name=f][value=${f}]`));
    await page.waitForTimeout(120);
    await checkSvg(page, 'font ' + f);
  }
  await hit(page.locator('input[data-k="logo"]'));
  await page.waitForTimeout(120);
  assert((await page.locator('#wz-view svg').textContent()).includes('LOGO'), 'logo yer tutucu');
  // logo yükleme
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
  await page.locator('#logo-file').setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: png });
  await page.waitForSelector('#wz-view svg image');
  noErrs(page);
  await page.context().close();
});

await test('Ürün değiştirince seçimler korunur / uyarlanır; germe\'de sistem adımı yok', async () => {
  const page = await newPage();
  await openWizard(page);
  await goStep(page, 'olcu');
  await page.locator('input[data-k="L.0.t"]').fill('Test Firma');
  await goStep(page, 'urun');
  await hit(page.locator('input[name=p][value=germe]'));
  assert((await page.locator('.wz-steps button').count()) === 6, 'germe 6 adım');
  let st = await state(page);
  assert(st.p === 'germe' && st.L[0].t === 'Test Firma' && st.w === 200 && st.h === 80, 'germe durumu ' + JSON.stringify([st.p, st.w, st.h, st.L[0].t]));
  await hit(page.locator('input[name=p][value=kapi]'));
  st = await state(page);
  assert(st.p === 'kapi' && st.z === 1 && st.w === 30, 'kapı zemini zorunlu');
  assert(['kabartma', 'dekupe', 'lazer', 'krom', 'baski'].includes(st.s), 'kapı için geçerli sistem: ' + st.s);
  await hit(page.locator('input[name=p][value=totem]'));
  await checkSvg(page, 'totem');
  noErrs(page);
  await page.context().close();
});

await test('Zemin: zeminsiz seçilebilir; dekupe seçilince zemin zorunlu olur', async () => {
  const page = await newPage();
  await openWizard(page);
  await goStep(page, 'zemin');
  await hit(page.locator('input[name=z][value="0"]'));
  await page.waitForTimeout(100);
  assert((await state(page)).z === 0, 'zeminsiz');
  assert((await page.locator('#wz-view svg rect[stroke-dasharray]').count()) > 0, 'zeminsiz alan çizgisi');
  await goStep(page, 'sistem');
  await hit(page.locator('input[name=s][value=dekupe]'));
  assert((await state(page)).z === 1, 'dekupe zemini zorunlu kılmalı');
  await checkSvg(page, 'dekupe');
  noErrs(page);
  await page.context().close();
});

await test('Notlar: her seçeneğe not eklenir, şartnamede görünür, boş not silinir', async () => {
  const page = await newPage();
  await openWizard(page);
  await goStep(page, 'detay');
  const first = page.locator('#wz-step .note-btn').first();
  await first.click();
  const ta = page.locator('#wz-step .note-ta:visible').first();
  await ta.fill('Özel not: 6 mm pleksi olsun');
  await goStep(page, 'ozet');
  const spec = await page.locator('#spec-sheet').textContent();
  assert(spec.includes('Özel not: 6 mm pleksi olsun'), 'not şartnamede olmalı');
  await goStep(page, 'detay');
  await page.locator('#wz-step .note-ta:visible').first().fill('');
  const st = await state(page);
  assert(Object.keys(st.n).length === 0, 'boş not temizlenmeli: ' + JSON.stringify(st.n));
  noErrs(page);
  await page.context().close();
});

await test('Fiyat etkisi: kalın pleksi, Samsung LED ve derin harf seviyeyi yükseltir; ipuçları çıkar', async () => {
  const page = await newPage();
  await openWizard(page);
  const lvl0 = await page.locator('#wz-mini b').first().textContent();
  await goStep(page, 'detay');
  await hit(page.locator('input[name="o.pt"][value="18"]'));
  await hit(page.locator('input[name="o.lb"][value="samsung"]'));
  await hit(page.locator('input[name="o.dp"][value="10"]'));
  await hit(page.locator('input[name="o.side"][value="plexi"]'));
  const lvl1 = await page.locator('#wz-mini b').first().textContent();
  assert(lvl0 !== lvl1, `seviye değişmeli (${lvl0} -> ${lvl1})`);
  const hint = await page.locator('#g-pkal .g-hint').textContent();
  assert(/oldukça artırır/.test(hint) && /2,8/.test(hint), 'kalın pleksi uyarısı: ' + hint);
  const ledHint = await page.locator('#g-ledmarka .g-hint').textContent();
  assert(/En uygun/.test(ledHint) && /Standart LED/.test(ledHint), 'LED en uygun ipucu: ' + ledHint);
  await goStep(page, 'ozet');
  const tips = await page.locator('.spec-tips').textContent();
  assert(/maliyet düşer/.test(tips), 'tasarruf ipuçları: ' + tips);
  noErrs(page);
  await page.context().close();
});

await test('Şartname: satırlar, harf yüksekliği, gündüz+gece görünümü, müşteri bilgileri', async () => {
  const page = await newPage();
  await openWizard(page);
  await goStep(page, 'ozet');
  await page.locator('input[data-k="c.name"]').fill('Ali Veli');
  await page.locator('input[data-k="c.phone"]').fill('0532 000 00 00');
  await hit(page.locator('input[data-k="c.b2b"]'));
  const spec = await page.locator('#spec-sheet').textContent();
  for (const needle of ['Tabela Şartnamesi', 'Cephe Tabelası', '300 × 80 cm', 'Işıklı Pleksi Kutu Harf', 'Opal Beyaz', 'LED', 'Ali Veli', '0532 000 00 00', 'Reklamcı', 'IR-']) {
    assert(spec.includes(needle), `şartnamede "${needle}" yok`);
  }
  assert((await page.locator('#spec-sheet .spec-prev figure').count()) === 2, 'ışıklı üründe gündüz+gece');
  // ışıksız sistemde tek görünüm
  await goStep(page, 'sistem');
  await hit(page.locator('input[name=s][value=kabartma]'));
  await goStep(page, 'ozet');
  assert((await page.locator('#spec-sheet .spec-prev figure').count()) === 1, 'ışıksızda tek görünüm');
  noErrs(page);
  await page.context().close();
});

await test('Durum bağlantıyla paylaşılır ve aynen geri yüklenir (tüm ürünler)', async () => {
  const page = await newPage();
  for (const product of ['cephe', 'totem', 'kapi', 'germe']) {
    await openWizard(page, `?urun=${product}`);
    await goStep(page, 'olcu');
    await page.locator('input[data-k="L.0.t"]').fill('Paylaşım Ğüşiö');
    await page.locator('input[data-k="w"]').fill('123');
    if (product !== 'germe') {
      await goStep(page, 'sistem');
      await hit(page.locator('input[name=s][value=krom]'));
      await goStep(page, 'detay');
      await hit(page.locator('input[name="o.ks"][value="altin"]'));
      await hit(page.locator('input[name="o.pc"][value="kirmizi"]'));
      await page.locator('#g-kromtip .note-btn').click();
      await page.locator('#g-kromtip .note-ta').fill('fileli olsun, özel not');
    }
    await goStep(page, 'ozet');
    await page.waitForTimeout(500); // hash güncellemesi (debounce)
    const before = await state(page);
    const url = page.url();
    assert(/#d=/.test(url), 'URL hash yok: ' + url);
    const p2 = await newPage();
    await p2.goto(url, { waitUntil: 'networkidle' });
    await p2.waitForSelector('.wz-steps button');
    const after = await state(p2);
    assert(JSON.stringify(before) === JSON.stringify(after), `${product}: durum farklı\n${JSON.stringify(before)}\n${JSON.stringify(after)}`);
    assert(await p2.locator('#wz-banner').isVisible(), 'paylaşım bandı');
    assert(await p2.locator('#spec-sheet').isVisible(), 'paylaşılan bağlantı şartnameyi açmalı');
    noErrs(p2);
    await p2.context().close();
  }
  await page.context().close();
});

await test('Bozuk/saldırgan bağlantı verisi güvenle ele alınır', async () => {
  const page = await newPage();
  const bad = [
    '#d=@@@@', '#d=e30', '#d=' + Buffer.from('{"p":"hack","w":"abc","L":"x","o":{"pc":"<img src=x onerror=alert(1)>"},"n":{"x y":"z","genel":"<script>alert(1)</script>"},"c":{"name":"<b>x</b>"}}').toString('base64url'),
    '#d=' + Buffer.from('{"p":"totem","w":-5,"h":99999999,"s":"dekupe","zm":"aynali","zt":999}').toString('base64url'),
  ];
  for (const h of bad) {
    await page.goto(`${BASE}/tabela-sihirbazi/${h}`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.wz-steps button');
    await checkSvg(page, 'bozuk hash ' + h.slice(0, 20));
    const dialogs = [];
    page.on('dialog', (d) => { dialogs.push(d.message()); d.dismiss(); });
    await page.waitForTimeout(100);
    assert(dialogs.length === 0, 'XSS iletişim kutusu açıldı');
    const st = await state(page);
    assert(['cephe', 'totem', 'kapi', 'germe'].includes(st.p), 'geçerli ürün');
    assert(st.w >= 8 && st.w <= 1500, 'ölçü sınırlandı');
  }
  assert((await page.locator('#wz-step img[src="x"]').count()) === 0, 'HTML enjekte edilmemeli');
  noErrs(page);
  await page.context().close();
});

await test('localStorage ile devam: yenileyince tasarım korunur, Sıfırla temizler', async () => {
  const page = await newPage();
  await openWizard(page);
  await goStep(page, 'olcu');
  await page.locator('input[data-k="L.0.t"]').fill('Kalıcı Tasarım');
  await page.waitForTimeout(500);
  await page.goto(`${BASE}/tabela-sihirbazi/`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.wz-steps button');
  assert((await state(page)).L[0].t === 'Kalıcı Tasarım', 'devam etmeli');
  assert(await page.locator('#wz-banner').isVisible(), 'devam bandı');
  await page.locator('#wz-banner [data-act="reset"]').click();
  assert((await state(page)).L[0].t === 'FİRMA ADINIZ', 'sıfırlanmalı');
  await page.waitForTimeout(500);
  await page.goto(`${BASE}/tabela-sihirbazi/`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.wz-steps button');
  assert((await state(page)).L[0].t === 'FİRMA ADINIZ', 'sıfırlama kalıcı olmalı');
  await page.context().close();
});

for (const [label, opts] of [['masaüstü', {}], ['mobil', { viewport: { width: 375, height: 700 }, mobile: true }]]) {
  await test(`Gerçek tıklamayla her seçeneğe ulaşılır; yapışkan çubuklar engellemez (${label})`, async () => {
    const page = await newPage(opts);
    await openWizard(page, '?urun=cephe');
    let n = 0;
    const clickAll = async () => {
      const pairs = await page.$$eval('#wz-step input[type=radio][data-k]', (els) => els.map((e) => [e.name, e.value]));
      for (const [name, value] of pairs) {
        const loc = page.locator(`#wz-step input[type=radio][name="${name}"][value="${value}"]`);
        if ((await loc.count()) === 0) continue;
        await loc.click({ timeout: 8000 }); // force yok: gerçek kullanıcı gibi, başka öğe üstünde kalırsa hata verir
        n++;
      }
    };
    await goStep(page, 'zemin');
    await clickAll();
    for (const strat of ['kutu_isikli', 'krom', 'kabartma', 'dekupe', 'lazer', 'baski']) {
      await goStep(page, 'sistem');
      await page.locator(`#wz-step input[name=s][value=${strat}]`).click({ timeout: 8000 });
      await goStep(page, 'detay');
      await clickAll();
    }
    assert(n > 80, 'az seçenek tıklandı: ' + n);
    noErrs(page);
    await page.context().close();
  });
}

await test('Gündüz/gece, büyüt penceresi, klavye ile gezinme', async () => {
  const page = await newPage();
  await openWizard(page);
  const dayHtml = await page.locator('#wz-view svg').innerHTML();
  await page.locator('input[name=view][value=night]').check({ force: true });
  await page.waitForTimeout(100);
  const nightHtml = await page.locator('#wz-view svg').innerHTML();
  assert(dayHtml !== nightHtml && nightHtml.includes('feGaussianBlur'), 'gece görünümü parlama içermeli');
  await page.locator('[data-act="zoom"]').click();
  await page.waitForSelector('#wz-zoom[open] svg');
  await page.keyboard.press('Escape');
  assert(!(await page.locator('#wz-zoom').getAttribute('open')), 'büyüt penceresi kapanmalı');
  // klavye: radyo grubunda ok tuşları
  await goStep(page, 'sistem');
  await page.locator('input[name=s][value=kutu_isikli]').focus();
  await page.keyboard.press('ArrowDown');
  assert((await state(page)).s === 'kutu_isiksiz', 'ok tuşu seçimi değiştirmeli: ' + (await state(page)).s);
  noErrs(page);
  await page.context().close();
});

await test('Paylaşım: WhatsApp bağlantısı, panoya kopyalama, bağlantı kopyalama', async () => {
  const page = await newPage();
  await openWizard(page);
  await goStep(page, 'olcu');
  await page.locator('input[data-k="L.0.t"]').fill('Paylaş Test');
  await goStep(page, 'ozet');
  await page.evaluate(() => { window.__opened = []; window.open = (u, t, f) => { window.__opened.push([u, t, f]); return null; }; });
  await page.locator('[data-act="whatsapp"]').click();
  const [u, target, feat] = (await page.evaluate(() => window.__opened))[0];
  assert(/^https:\/\/wa\.me\/905315209001\?text=/.test(u), 'WhatsApp adresi: ' + u);
  assert(target === '_blank' && /noopener/.test(feat), 'yeni sekme ve noopener');
  const text = decodeURIComponent(u.split('text=')[1] || '');
  for (const n of ['Tabela Şartnamesi', 'PAYLAŞ TEST', 'Cephe Tabelası', 'Tasarım:', '#d=']) assert(text.includes(n), `WhatsApp metninde "${n}" yok:\n${text}`);
  await page.locator('[data-act="copy"]').click();
  await page.waitForTimeout(150);
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  assert(clip.includes('TABELA ŞARTNAMESİ') && clip.includes('Işıklı Pleksi Kutu Harf'), 'kopyalanan metin: ' + clip.slice(0, 80));
  await page.locator('[data-act="link"]').click();
  await page.waitForTimeout(150);
  const link = await page.evaluate(() => navigator.clipboard.readText());
  assert(/#d=/.test(link), 'bağlantı kopyalanmalı');
  noErrs(page);
  await page.context().close();
});

await test('PNG şartname görseli indirilir (geçerli PNG, doğru boyut) — her ürün için', async () => {
  const page = await newPage();
  for (const product of ['cephe', 'totem', 'kapi', 'germe']) {
    await openWizard(page, `?urun=${product}`);
    await goStep(page, 'ozet');
    const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 20000 }), page.locator('[data-act="png"]').click()]);
    const file = path.join(OUT, `sartname-${product}.png`);
    await dl.saveAs(file);
    const buf = await readFile(file);
    assert(buf.slice(0, 8).toString('hex') === '89504e470d0a1a0a', 'PNG imzası');
    const w = buf.readUInt32BE(16); const h = buf.readUInt32BE(20);
    assert(w === 1200 && h > 700, `PNG boyutu ${w}x${h}`);
    assert(buf.length > 30000, 'PNG çok küçük: ' + buf.length);
  }
  noErrs(page);
  await page.context().close();
});

await test('Yazdırma: baskı kökü yalnızca şartnameyi gösterir', async () => {
  const page = await newPage();
  await openWizard(page);
  await goStep(page, 'ozet');
  await page.evaluate(() => { window.__printed = 0; window.print = () => { window.__printed++; }; });
  await page.locator('[data-act="print"]').click();
  await page.waitForSelector('#print-root .spec', { state: 'attached' });
  await page.waitForTimeout(200);
  assert((await page.evaluate(() => window.__printed)) === 1, 'window.print çağrılmalı');
  await page.emulateMedia({ media: 'print' });
  const vis = await page.evaluate(() => {
    const out = [];
    for (const el of document.body.children) out.push([el.tagName + (el.id ? '#' + el.id : ''), getComputedStyle(el).display]);
    return out;
  });
  const shown = vis.filter(([, d]) => d !== 'none').map(([n]) => n);
  assert(shown.length === 1 && shown[0] === 'DIV#print-root', 'baskıda sadece print-root görünmeli: ' + JSON.stringify(vis));
  await page.screenshot({ path: path.join(OUT, 'print-preview.png'), fullPage: true });
  await page.pdf({ path: path.join(OUT, 'sartname.pdf'), format: 'A4' });
  noErrs(page);
  await page.context().close();
});

await test('Mobil: sihirbaz kullanılabilir (sabit önizleme, gezinme, taşma yok)', async () => {
  const page = await newPage({ viewport: { width: 375, height: 700 }, mobile: true });
  await openWizard(page, '?urun=totem');
  const box = await page.locator('.wz-stage').boundingBox();
  assert(box.height < 360, 'mobil önizleme yüksekliği ' + box.height);
  await page.locator('[data-act="next"]').tap();
  await page.waitForTimeout(300);
  await page.evaluate(() => window.scrollBy(0, 500));
  await page.waitForTimeout(150);
  const box2 = await page.locator('.wz-stage').boundingBox();
  assert(box2.y >= 55 && box2.y <= 70, 'önizleme sabit kalmalı: y=' + box2.y);
  for (let i = 0; i < 5; i++) { await page.locator('[data-act="next"]').tap(); await page.waitForTimeout(150); }
  assert(await page.locator('#spec-sheet').isVisible(), 'son adımda şartname');
  await checkSvg(page, 'mobil');
  await page.screenshot({ path: path.join(OUT, 'mobile-final.png') });
  noErrs(page);
  await page.context().close();
});

await test('Erişilebilirlik: etiketler, odak, odak halkası, odak yönetimi', async () => {
  const page = await newPage();
  await openWizard(page);
  const unlabeled = await page.$$eval('#wizard input, #wizard textarea, #wizard select', (els) =>
    els.filter((e) => e.type !== 'hidden' && !e.closest('label') && !e.getAttribute('aria-label') && !(e.id && document.querySelector(`label[for="${e.id}"]`))).map((e) => e.outerHTML.slice(0, 80)));
  assert(unlabeled.length === 0, 'etiketsiz alanlar: ' + unlabeled.join('\n'));
  await page.locator('[data-act="next"]').click();
  const focusId = await page.evaluate(() => document.activeElement && document.activeElement.id);
  assert(focusId === 'wz-step', 'adım değişince odak içeriğe taşınmalı: ' + focusId);
  const cur = await page.locator('.wz-steps [aria-current="step"]').count();
  assert(cur === 1, 'aria-current');
  await page.context().close();
});

// ---------------------------------------------------------------------------
await browser.close();
server.close();
server2.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} test geçti${failed.length ? `, ${failed.length} başarısız` : ''}`);
await writeFile(path.join(OUT, 'results.json'), JSON.stringify(results.map((r) => ({ name: r.name, ok: r.ok, err: r.err ? String(r.err) : undefined })), null, 1));
process.exit(failed.length ? 1 : 0);
