#!/usr/bin/env node
// Statik site derleyici: sayfalar, CSS/JS paketleri, sitemap, robots, llms.txt, manifest.
// Çıktı depo köküne yazılır (GitHub Pages "master / root" ile doğrudan yayınlanır).
import { build as esbuild, transform } from 'esbuild';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import cfg from '../src/site.config.mjs';
import { services, hubs } from '../src/data/services.mjs';
import { guides } from '../src/data/guides.mjs';
import { makeCtx, renderPage, links } from '../src/lib/layout.mjs';
import { allPages, notFoundPage, WIZARD_FAQ } from '../src/pages/pages.mjs';
import { HOME_FAQ } from '../src/pages/home.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = (...p) => path.join(ROOT, ...p);
const manifestPath = out('.build-manifest.json');

const written = new Set();
async function put(rel, data) {
  const file = out(rel);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, data);
  written.add(rel.split(path.sep).join('/'));
}

const hash = (s) => createHash('sha1').update(s).digest('hex').slice(0, 8);
const trimHtml = (h) => h.replace(/\n[ \t]+/g, '\n').replace(/\n{2,}/g, '\n');
const today = new Date().toISOString().slice(0, 10);

async function main() {
  // ---- varlıklar (CSS/JS)
  const assetHash = {};
  async function css(name, src) {
    const code = await readFile(out('src/css', src), 'utf8');
    const r = await transform(code, { loader: 'css', minify: true });
    assetHash[name] = hash(r.code);
    await put(`assets/${name}`, r.code);
  }
  await css('site.css', 'site.css');
  await css('wizard.css', 'wizard.css');

  const siteJs = await transform(await readFile(out('src/site.js'), 'utf8'), { minify: true, target: 'es2017' });
  assetHash['site.js'] = hash(siteJs.code);
  await put('assets/site.js', siteJs.code);

  const wz = await esbuild({
    entryPoints: [out('src/wizard/main.js')],
    bundle: true, minify: true, format: 'iife', target: ['es2019'], write: false, legalComments: 'none',
  });
  const wzCode = wz.outputFiles[0].text;
  assetHash['wizard.js'] = hash(wzCode);
  await put('assets/wizard.js', wzCode);

  if (cfg.gaId) {
    const ga = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config',${JSON.stringify(cfg.gaId)});`;
    assetHash['ga.js'] = hash(ga);
    await put('assets/ga.js', ga);
  }

  // ---- sayfalar
  const pages = allPages();
  for (const p of pages) {
    const ctx = makeCtx(p.slug, assetHash);
    const page = p.build(ctx);
    const html = trimHtml(renderPage(ctx, { ...page, slug: p.slug }));
    await put(p.slug === '' ? 'index.html' : `${p.slug}/index.html`, html);
  }

  // 404: kök tabanlı (mutlak yol) bağlantılar kullanır
  {
    const basePath = new URL(cfg.siteUrl).pathname.replace(/\/$/, '');
    const ctx = makeCtx('404', assetHash);
    ctx.up = `${basePath}/`;
    ctx.href = (t, h = '') => (t === '' ? ctx.up : `${ctx.up}${t}/`) + h;
    ctx.asset = (n, withHash = true) => `${ctx.up}assets/${n}${withHash && assetHash[n] ? `?v=${assetHash[n]}` : ''}`;
    const page = notFoundPage(ctx);
    await put('404.html', trimHtml(renderPage(ctx, { ...page, slug: '404' }).replaceAll(`href="${ctx.up}assets/img/`, `href="${ctx.up}assets/img/`)));
  }

  // ---- sitemap
  const urls = pages
    .map((p) => {
      const loc = p.slug === '' ? `${cfg.siteUrl}/` : `${cfg.siteUrl}/${p.slug}/`;
      return `<url><loc>${loc}</loc><lastmod>${today}</lastmod><changefreq>${p.freq}</changefreq><priority>${p.priority}</priority></url>`;
    })
    .join('\n');
  await put('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);

  // ---- robots.txt (yapay zekâ tarayıcılarına açıkça izin)
  const bots = [
    'GPTBot', 'ChatGPT-User', 'OAI-SearchBot', 'ClaudeBot', 'Claude-Web', 'Claude-User', 'Claude-SearchBot', 'anthropic-ai',
    'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot', 'Applebot-Extended', 'Bingbot', 'DuckDuckBot',
    'YandexBot', 'CCBot', 'Amazonbot', 'Meta-ExternalAgent', 'cohere-ai', 'MistralAI-User', 'DuckAssistBot', 'YouBot',
  ];
  await put(
    'robots.txt',
    `# ${cfg.brand} — tüm arama ve yapay zekâ tarayıcılarına açıktır\nUser-agent: *\nAllow: /\n\n${bots
      .map((b) => `User-agent: ${b}\nAllow: /\n`)
      .join('\n')}\nSitemap: ${cfg.siteUrl}/sitemap.xml\n`,
  );

  // ---- llms.txt ve llms-full.txt
  const abs = (s) => (s === '' ? `${cfg.siteUrl}/` : `${cfg.siteUrl}/${s}/`);
  const ctxText = makeCtx('', assetHash);
  const T = (html) => links(html, ctxText, { text: true }).replace(/<[^>]+>/g, '').replace(/&amp;/g, '&');
  const a = cfg.address;
  const llms = [
    `# ${cfg.brand}`,
    '',
    `> ${cfg.brand}, Ankara Altındağ İskitler’de (${a.street}) ${cfg.experienceYears} deneyimle kendi atölyesinde tabela imalatı yapan bir reklam atölyesidir: ışıklı ve ışıksız pleksi kutu harf, krom harf, germe tabela, totem tabela, kapı ve ofis tabelaları, CNC router kesim, CNC lazer kesim, dijital baskı, tabela montajı ve reklamcılara fason imalat. Ücretsiz çevrimiçi tabela sihirbazıyla ürün, ölçü, malzeme, renk ve LED seçilip paylaşılabilir şartname oluşturulur.`,
    '',
    '## Hizmetler',
    ...[...hubs, ...services].map((s) => `- [${s.name}](${abs(s.slug)}): ${T(s.tldr).slice(0, 220)}…`),
    '',
    '## Araçlar',
    `- [Tabela Sihirbazı](${abs('tabela-sihirbazi')}): Cephe tabelası, totem, kapı tabelası ve germe tabela için önizlemeli, gündüz/gece görünümlü, fiyat etkisi gösteren ve WhatsApp/PNG/PDF olarak paylaşılabilen ücretsiz tasarım sihirbazı.`,
    '',
    '## Rehber',
    ...guides.map((g) => `- [${T(g.title)}](${abs('rehber/' + g.slug)}): ${g.desc}`),
    '',
    '## İletişim',
    `- Adres: ${a.street}, ${a.neighborhood}, ${a.district} / ${a.city}`,
    `- Telefon / WhatsApp: ${cfg.phoneDisplay} (${cfg.phone})`,
    `- [İletişim sayfası](${abs('iletisim')})`,
    `- [İskitler tabelacı](${abs('iskitler-tabela')})`,
    '',
    '## Önemli bilgiler',
    '- Pleksi kalınlıkları: 2,8, 4,5, 5,8, 7,8, 9,8, 12, 14, 18 mm (2,8 mm en uygun; kalın pleksi fiyatı oldukça artırır).',
    '- Dekota: 4,5, 7, 8, 10, 14, 18 mm. Aynalı dekota (gümüş/gold): 4, 8, 13, 18 mm.',
    '- Kutu harf yan derinliği: 6, 7, 8, 10 cm. Yan bant: antrasit, siyah, beyaz, altın, gümüş veya pleksi ışıklı bant.',
    '- LED: Standart, Epistar, Samsung; renkler: beyaz, günışığı, amber, kırmızı, mavi, yeşil. Standart dışı tercihlerde fiyat yukarı yönlü değişebilir.',
    '- Pleksi paleti Akpolimer, kompozit paleti Sistem markasıdır.',
    '- Krom harf: fileli, filesiz veya tam krom; yanlar gümüş ya da altın.',
    '',
    '## Optional',
    `- [Sık sorulan sorular](${abs('sss')})`,
    `- [Hakkımızda](${abs('hakkimizda')})`,
    `- [Tam metin (llms-full.txt)](${cfg.siteUrl}/llms-full.txt)`,
    '',
  ].join('\n');
  await put('llms.txt', llms);

  const full = [`# ${cfg.brand} — tam içerik özeti`, '', llms.split('\n').slice(2, 3).join('\n'), ''];
  for (const s of [...hubs, ...services]) {
    full.push(`## ${s.name}`, `URL: ${abs(s.slug)}`, '', T(s.tldr), '', ...s.facts.map(([k, v]) => `- ${k}: ${v}`), '');
    for (const sec of s.sections) full.push(`### ${sec.h}`, T(sec.html), '');
    full.push('### Sık sorulan sorular');
    for (const [q, ans] of s.faq) full.push(`**${q}** ${T(ans)}`);
    full.push('');
  }
  for (const g of guides) full.push(`## ${T(g.title)}`, `URL: ${abs('rehber/' + g.slug)}`, '', T(g.tldr), '', T(g.body), '');
  full.push('## Genel sorular');
  for (const [q, ans] of [...HOME_FAQ, ...WIZARD_FAQ]) full.push(`**${q}** ${T(ans)}`);
  await put('llms-full.txt', full.join('\n') + '\n');

  // ---- manifest
  await put(
    'site.webmanifest',
    JSON.stringify(
      {
        name: cfg.brandFull, short_name: cfg.brand, lang: 'tr', start_url: './', scope: './', display: 'standalone',
        background_color: '#f7f4ee', theme_color: cfg.themeColor,
        icons: [
          { src: 'assets/img/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'assets/img/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'assets/img/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      null, 2,
    ) + '\n',
  );

  // ---- eski çıktıları temizle
  let prev = [];
  try { prev = JSON.parse(await readFile(manifestPath, 'utf8')); } catch { /* ilk derleme */ }
  for (const f of prev) {
    if (!written.has(f) && existsSync(out(f))) await rm(out(f));
  }
  await writeFile(manifestPath, JSON.stringify([...written].sort(), null, 1) + '\n');
  console.log(`Derleme tamam: ${pages.length + 1} sayfa, ${written.size} dosya · ${cfg.siteUrl}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
