#!/usr/bin/env node
// Statik denetim: bağlantılar, kimlikler, SEO etiketleri, JSON-LD, site haritası, içerik kalitesi.
// Çalıştırma: node tests/check-site.mjs   (önce `npm run build`)
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await readFile(path.join(ROOT, '.build-manifest.json'), 'utf8'));
const pages = manifest.filter((f) => f.endsWith('.html'));
const problems = [];
const warn = (file, msg) => problems.push(`${file}: ${msg}`);

const exists = async (rel) => {
  try { const s = await stat(path.join(ROOT, rel)); return s.isFile() || s.isDirectory(); } catch { return false; }
};
const urlToFile = async (fromFile, ref) => {
  const clean = ref.split('#')[0].split('?')[0];
  if (clean === '') return fromFile;
  const dir = path.posix.dirname(fromFile);
  let target = path.posix.normalize(path.posix.join(dir, clean));
  if (clean.endsWith('/') || !path.posix.extname(target)) target = path.posix.join(target, 'index.html');
  return target;
};

const siteUrl = (await import('../src/site.config.mjs')).default.siteUrl;
const sitemap = await readFile(path.join(ROOT, 'sitemap.xml'), 'utf8');
const sitemapLocs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

for (const file of pages) {
  const html = await readFile(path.join(ROOT, file), 'utf8');
  const is404 = file === '404.html';
  const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ');

  // ---- temel etiketler
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
  if (!title) warn(file, 'title yok');
  if (title.length > 75) warn(file, `title çok uzun (${title.length}): ${title}`);
  if (desc.length < 70 || desc.length > 175) warn(file, `description uzunluğu uygun değil (${desc.length})`);
  if (!/<html lang="tr"/.test(html)) warn(file, 'html lang="tr" yok');
  if (!/<meta name="viewport"/.test(html)) warn(file, 'viewport yok');
  const h1 = (html.match(/<h1[ >]/g) || []).length;
  if (h1 !== 1) warn(file, `h1 sayısı ${h1}`);
  const canon = (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
  if (!canon) warn(file, 'canonical yok');
  else if (!is404) {
    const expected = file === 'index.html' ? `${siteUrl}/` : `${siteUrl}/${file.replace(/index\.html$/, '')}`;
    if (canon !== expected) warn(file, `canonical ${canon} != ${expected}`);
    if (!sitemapLocs.includes(canon)) warn(file, 'sitemap.xml içinde yok');
  }
  for (const og of ['og:title', 'og:description', 'og:image', 'og:url']) {
    if (!html.includes(`property="${og}"`)) warn(file, `${og} yok`);
  }

  // ---- kalıntı/şablon hataları
  for (const bad of ['undefined', '[object', '{{', '}}', 'NaN', 'lorem', 'TODO']) {
    if (text.includes(bad) || (bad !== 'NaN' && html.replace(/<script[\s\S]*?<\/script>/g, '').includes(bad))) {
      warn(file, `metinde "${bad}" geçiyor`);
    }
  }

  // ---- kimlikler
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
  if (dup.length) warn(file, `yinelenen id: ${[...new Set(dup)].join(', ')}`);

  // ---- bağlantılar / kaynaklar
  const refs = [...html.matchAll(/\s(?:href|src)="([^"]+)"/g)].map((m) => m[1]);
  for (const ref of refs) {
    if (/^(https?:|tel:|mailto:|data:|javascript:)/.test(ref)) continue;
    if (ref.startsWith('#')) {
      if (ref.length > 1 && !ids.includes(ref.slice(1))) warn(file, `sayfa içi bağlantı hedefi yok: ${ref}`);
      continue;
    }
    if (ref.startsWith('/')) {
      if (!is404) warn(file, `kök tabanlı bağlantı (alt yolda kırılır): ${ref}`);
      continue;
    }
    const target = await urlToFile(file, ref);
    if (!(await exists(target))) warn(file, `kırık bağlantı: ${ref} -> ${target}`);
    const hash = ref.split('#')[1];
    if (hash && target.endsWith('.html')) {
      const th = await readFile(path.join(ROOT, target), 'utf8');
      if (!th.includes(`id="${hash}"`)) warn(file, `hedefte id yok: ${ref}`);
    }
  }
  // dış bağlantılar güvenli mi?
  for (const m of html.matchAll(/<a [^>]*target="_blank"[^>]*>/g)) {
    if (!/rel="[^"]*noopener/.test(m[0])) warn(file, `target=_blank noopener yok: ${m[0].slice(0, 80)}`);
  }
  for (const m of html.matchAll(/<img [^>]*>/g)) if (!/ alt=/.test(m[0])) warn(file, 'img alt yok');

  // ---- JSON-LD
  const lds = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (!lds.length && !is404) warn(file, 'JSON-LD yok');
  for (const m of lds) {
    try {
      const j = JSON.parse(m[1]);
      if (j['@context'] !== 'https://schema.org') warn(file, 'JSON-LD @context');
      const gids = (j['@graph'] || []).map((g) => g['@id']).filter(Boolean);
      const dupg = gids.filter((x, i) => gids.indexOf(x) !== i);
      if (dupg.length) warn(file, `JSON-LD yinelenen @id: ${dupg.join(',')}`);
      for (const g of j['@graph'] || []) {
        if (g['@type'] === 'FAQPage' && !(g.mainEntity || []).length) warn(file, 'FAQPage boş');
      }
    } catch (e) {
      warn(file, 'JSON-LD ayrıştırılamadı: ' + e.message);
    }
  }

  // ---- içerik derinliği
  const words = text.split(/\s+/).filter(Boolean).length;
  const thinOk = ['404.html', 'gizlilik/index.html'];
  if (!thinOk.includes(file) && words < 280) warn(file, `içerik az (${words} kelime)`);
}

// ---- site haritası / robots / llms
const robots = await readFile(path.join(ROOT, 'robots.txt'), 'utf8');
if (!robots.includes(`Sitemap: ${siteUrl}/sitemap.xml`)) problems.push('robots.txt: Sitemap satırı yok');
for (const loc of sitemapLocs) {
  const rel = loc.replace(siteUrl + '/', '');
  if (!(await exists(path.posix.join(rel, 'index.html')))) problems.push(`sitemap: ${loc} dosyası yok`);
}
const llms = await readFile(path.join(ROOT, 'llms.txt'), 'utf8');
for (const m of llms.matchAll(/\]\((https?:[^)]+)\)/g)) {
  const u = m[1];
  if (!u.startsWith(siteUrl)) { problems.push(`llms.txt: dış bağlantı ${u}`); continue; }
  const rel = u.replace(siteUrl + '/', '');
  const f = rel === '' ? 'index.html' : rel.endsWith('/') ? rel + 'index.html' : rel;
  if (!(await exists(f))) problems.push(`llms.txt: ${u} bulunamadı`);
}
for (const must of ['0531 520 90 01', 'Sebze Bahçeleri', 'İskitler', 'Altındağ']) {
  if (!llms.includes(must)) problems.push(`llms.txt: "${must}" yok`);
}

// ---- NAP tutarlılığı (ad-adres-telefon)
for (const file of ['index.html', 'iletisim/index.html', 'iskitler-tabela/index.html']) {
  const html = await readFile(path.join(ROOT, file), 'utf8');
  if (!html.includes('tel:+905315209001')) problems.push(`${file}: telefon bağlantısı yok`);
  if (!html.includes('wa.me/905315209001')) problems.push(`${file}: WhatsApp bağlantısı yok`);
  if (!/Sebze Bahçeleri Caddesi No: 107\/22/.test(html)) problems.push(`${file}: adres yok`);
}

if (problems.length) {
  console.error(`✗ ${problems.length} sorun bulundu:\n` + problems.map((p) => '  - ' + p).join('\n'));
  process.exit(1);
}
console.log(`✓ Statik denetim temiz: ${pages.length} sayfa, ${sitemapLocs.length} sitemap URL`);
