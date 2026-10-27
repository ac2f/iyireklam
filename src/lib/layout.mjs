// Ortak sayfa iskeleti: <head> (SEO, sosyal, JSON-LD), üst bar, alt bilgi, mobil çubuk.
import cfg from '../site.config.mjs';
import { services, hubs } from '../data/services.mjs';
import { icon } from './icons.mjs';

export const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const PHONE_INTL = '+90 531 520 90 01';

export function makeCtx(slug, assetHash) {
  const depth = slug === '' ? 0 : slug.split('/').length;
  const up = '../'.repeat(depth) || './';
  const ctx = {
    cfg,
    slug,
    depth,
    up,
    href: (target, hash = '') => (target === '' ? up : `${up}${target}/`) + hash,
    asset: (name, withHash = true) => `${up}assets/${name}${withHash && assetHash[name] ? `?v=${assetHash[name]}` : ''}`,
    abs: (target) => (target === '' ? `${cfg.siteUrl}/` : `${cfg.siteUrl}/${target}/`),
    absAsset: (name) => `${cfg.siteUrl}/assets/${name}`,
  };
  return ctx;
}

/** {{l:slug|metin}} → <a href="göreli">metin</a>  (text:true ise yalnızca metin) */
export function links(html, ctx, { text = false } = {}) {
  return html.replace(/\{\{l:([^|}]+)\|([^}]+)\}\}/g, (_, slug, label) =>
    text ? label : `<a href="${ctx.href(slug)}">${label}</a>`,
  );
}

export function breadcrumbs(ctx, trail) {
  // trail: [{name, slug}] (ana sayfa otomatik eklenir)
  const items = [{ name: 'Ana Sayfa', slug: '' }, ...trail];
  const html =
    `<nav class="crumbs" aria-label="Sayfa yolu"><div class="wrap"><ol>` +
    items
      .map((it, i) =>
        i === items.length - 1
          ? `<li aria-current="page">${esc(it.name)}</li>`
          : `<li><a href="${ctx.href(it.slug)}">${esc(it.name)}</a></li>`,
      )
      .join('') +
    `</ol></div></nav>`;
  const ld = {
    '@type': 'BreadcrumbList',
    '@id': `${ctx.abs(ctx.slug)}#breadcrumb`,
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: ctx.abs(it.slug),
    })),
  };
  return { html, ld };
}

export function businessLD(full = true) {
  const id = `${cfg.siteUrl}/#business`;
  if (!full) return { '@id': id };
  return {
    '@type': ['LocalBusiness'],
    '@id': id,
    name: cfg.brand,
    alternateName: cfg.brandFull,
    url: `${cfg.siteUrl}/`,
    logo: `${cfg.siteUrl}/assets/img/logo-512.png`,
    image: `${cfg.siteUrl}/assets/img/og.png`,
    description:
      'Ankara İskitler’de kendi atölyesinde tabela imalatı, ışıklı ve ışıksız pleksi kutu harf, krom harf, germe tabela, totem, kapı tabelası, CNC router kesim, CNC lazer kesim, dijital baskı, reklamcılara fason imalat ve tabela montajı yapan firma.',
    telephone: PHONE_INTL,
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${cfg.address.street}, ${cfg.address.neighborhood}`,
      addressLocality: cfg.address.district,
      addressRegion: cfg.address.city,
      addressCountry: cfg.address.country,
    },
    areaServed: [{ '@type': 'City', name: 'Ankara' }],
    knowsAbout: [
      'Tabela imalatı', 'Kutu harf', 'Işıklı tabela', 'Krom harf', 'Germe tabela', 'Totem tabela',
      'Kapı tabelası', 'CNC router kesim', 'CNC lazer kesim', 'Dijital baskı', 'Fason tabela imalatı', 'Tabela montajı',
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Tabela ve kesim hizmetleri',
      itemListElement: [...hubs, ...services].map((s) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: s.name, url: `${cfg.siteUrl}/${s.slug}/` },
      })),
    },
    contactPoint: [
      { '@type': 'ContactPoint', telephone: PHONE_INTL, contactType: 'customer service', areaServed: 'TR', availableLanguage: ['tr'] },
    ],
  };
}

function navHTML(ctx) {
  const cur = ctx.slug;
  const a = (slug, text, extra = '') =>
    `<a href="${ctx.href(slug)}"${cur === slug ? ' aria-current="page"' : ''}${extra}>${text}</a>`;
  const dd = [...hubs, ...services]
    .map((s) => `<a href="${ctx.href(s.slug)}"${cur === s.slug ? ' aria-current="page"' : ''}>${esc(s.nav)}<small>${esc(s.navDesc)}</small></a>`)
    .join('');
  return (
    `<nav class="nav" id="nav" aria-label="Ana menü">` +
    `<div class="dd"><button type="button" aria-haspopup="true">Hizmetler</button><div class="dd-m">${dd}</div></div>` +
    a('fason-tabela-imalati', 'Reklamcılara Fason') +
    a('rehber', 'Rehber') +
    a('hakkimizda', 'Hakkımızda') +
    a('iletisim', 'İletişim') +
    `<a class="nav-wiz" href="${ctx.href('tabela-sihirbazi')}">${icon('spark')}Tabela Sihirbazı</a>` +
    `</nav>`
  );
}

export const logoSVG = () =>
  `<svg viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="11" fill="#0e1116"/><circle cx="20" cy="9.5" r="3.6" fill="#e7c878"/><circle cx="20" cy="9.5" r="6" fill="#e7c878" opacity=".22"/><path d="M20 17v14" stroke="#fff" stroke-width="4.6" stroke-linecap="round"/></svg>`;

function header(ctx) {
  return (
    `<header class="hdr"><div class="wrap hdr-in">` +
    `<a class="brand" href="${ctx.href('')}" aria-label="${esc(cfg.brand)} ana sayfa">${logoSVG()}<span>İyi <b>Reklam</b></span></a>` +
    navHTML(ctx) +
    `<button class="burger" type="button" aria-expanded="false" aria-controls="nav" aria-label="Menüyü aç"><span></span></button>` +
    `</div></header>`
  );
}

function footer(ctx) {
  const svc = [...hubs, ...services].map((s) => `<li><a href="${ctx.href(s.slug)}">${esc(s.name)}</a></li>`).join('');
  return (
    `<footer class="ftr"><div class="wrap"><div class="ftr-g">` +
    `<div><a class="brand" href="${ctx.href('')}">${logoSVG()}<span>İyi <b>Reklam</b></span></a>` +
    `<p>Ankara İskitler’de kendi atölyemizde tabela imalatı, kutu harf, CNC router ve lazer kesim. ${cfg.experienceYears} deneyim.</p></div>` +
    `<div><h2>Hizmetler</h2><ul>${svc}</ul></div>` +
    `<div><h2>Keşfet</h2><ul>` +
    `<li><a href="${ctx.href('tabela-sihirbazi')}">Tabela Sihirbazı</a></li>` +
    `<li><a href="${ctx.href('rehber')}">Rehber</a></li>` +
    `<li><a href="${ctx.href('iskitler-tabela')}">İskitler Tabelacı</a></li>` +
    `<li><a href="${ctx.href('sss')}">Sık Sorulan Sorular</a></li>` +
    `<li><a href="${ctx.href('hakkimizda')}">Hakkımızda</a></li>` +
    `<li><a href="${ctx.href('gizlilik')}">Gizlilik</a></li></ul></div>` +
    `<div><h2>İletişim</h2><address class="addr" style="font-style:normal">` +
    `<p>${esc(cfg.address.street)}<br>${esc(cfg.address.neighborhood)}, ${esc(cfg.address.district)} / ${esc(cfg.address.city)}</p>` +
    `<p><a href="tel:${cfg.phone}"><strong>${cfg.phoneHtml}</strong></a><br><a href="https://wa.me/${cfg.whatsapp}" rel="noopener">WhatsApp ile yazın</a></p></address></div>` +
    `</div><div class="ftr-b"><span>© ${new Date().getFullYear()} ${esc(cfg.brand)}. Tüm hakları saklıdır.</span><span>Ankara · Altındağ · İskitler</span></div></div></footer>`
  );
}

function mobileBar(ctx) {
  return (
    `<div class="mbar" role="navigation" aria-label="Hızlı iletişim">` +
    `<a href="tel:${cfg.phone}">${icon('phone')}Ara</a>` +
    `<a class="m-wa" href="https://wa.me/${cfg.whatsapp}" rel="noopener">${icon('whatsapp')}WhatsApp</a>` +
    `<a class="m-wz" href="${ctx.href('tabela-sihirbazi')}">${icon('spark')}Tasarla</a>` +
    `</div>`
  );
}

function csp() {
  const ga = cfg.gaId ? ' https://www.googletagmanager.com https://www.google-analytics.com' : '';
  return [
    "default-src 'self'",
    `script-src 'self'${ga}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:" + (cfg.gaId ? ' https://www.google-analytics.com' : ''),
    "font-src 'self' data:",
    "connect-src 'self'" + (cfg.gaId ? ' https://www.google-analytics.com https://*.analytics.google.com' : ''),
    'frame-src https://www.google.com',
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ');
}

/**
 * page: { slug, title, desc, body, ld: [objects], bodyClass, extraCss: [], extraJs: [], ogType, noindex, preloadFonts }
 */
export function renderPage(ctx, page) {
  const url = ctx.abs(page.slug);
  const title = page.title;
  const og = page.ogImage || ctx.absAsset('img/og.png');
  const graph = [
    page.slug === '' || page.fullBusiness ? businessLD(true) : null,
    ...(page.ld || []),
  ].filter(Boolean);
  const ldJSON = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph.map((g) => ({ ...g })) }).replace(/</g, '\\u003c');

  const css = ['site.css', ...(page.extraCss || [])].map((n) => `<link rel="stylesheet" href="${ctx.asset(n)}">`).join('');
  const preload = ['inter-lat', 'inter-tr', 'cormorant-600-lat', 'cormorant-600-tr', 'cormorant-600i-lat', 'cormorant-600i-tr']
    .map((f) => `<link rel="preload" href="${ctx.up}assets/fonts/${f}.woff2" as="font" type="font/woff2" crossorigin>`)
    .join('');
  const js = ['site.js', ...(page.extraJs || [])].map((n) => `<script src="${ctx.asset(n)}" defer></script>`).join('');
  const verif = [
    cfg.googleSiteVerification && `<meta name="google-site-verification" content="${esc(cfg.googleSiteVerification)}">`,
    cfg.bingSiteVerification && `<meta name="msvalidate.01" content="${esc(cfg.bingSiteVerification)}">`,
    cfg.yandexVerification && `<meta name="yandex-verification" content="${esc(cfg.yandexVerification)}">`,
  ].filter(Boolean).join('');
  const ga = cfg.gaId
    ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${esc(cfg.gaId)}"></script><script src="${ctx.asset('ga.js')}" data-id="${esc(cfg.gaId)}" defer></script>`
    : '';

  return (
    `<!DOCTYPE html><html lang="${cfg.lang}"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">` +
    `<title>${esc(title)}</title>` +
    `<meta name="description" content="${esc(page.desc)}">` +
    `<link rel="canonical" href="${url}">` +
    `<meta name="robots" content="${page.noindex ? 'noindex,follow' : 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'}">` +
    `<meta name="theme-color" content="${cfg.themeColor}">` +
    `<meta name="referrer" content="strict-origin-when-cross-origin">` +
    `<meta http-equiv="Content-Security-Policy" content="${esc(csp())}">` +
    `<meta name="format-detection" content="telephone=yes">` +
    `<meta name="geo.region" content="TR-06"><meta name="geo.placename" content="Altındağ, Ankara">` +
    `<meta property="og:type" content="${page.ogType || 'website'}">` +
    `<meta property="og:site_name" content="${esc(cfg.brand)}">` +
    `<meta property="og:locale" content="${cfg.locale}">` +
    `<meta property="og:title" content="${esc(title)}">` +
    `<meta property="og:description" content="${esc(page.desc)}">` +
    `<meta property="og:url" content="${url}">` +
    `<meta property="og:image" content="${og}">` +
    `<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">` +
    `<meta property="og:image:alt" content="${esc(cfg.brand)} — Ankara tabela imalatı">` +
    `<meta name="twitter:card" content="summary_large_image">` +
    `<meta name="twitter:title" content="${esc(title)}">` +
    `<meta name="twitter:description" content="${esc(page.desc)}">` +
    `<meta name="twitter:image" content="${og}">` +
    verif +
    `<link rel="icon" href="${ctx.up}assets/img/favicon.svg" type="image/svg+xml">` +
    `<link rel="icon" href="${ctx.up}assets/img/favicon-48.png" type="image/png" sizes="48x48">` +
    `<link rel="apple-touch-icon" href="${ctx.up}assets/img/apple-touch-icon.png">` +
    `<link rel="manifest" href="${ctx.up}site.webmanifest">` +
    `<link rel="alternate" type="text/plain" href="${cfg.siteUrl}/llms.txt" title="LLM özeti">` +
    preload + css +
    `<script type="application/ld+json">${ldJSON}</script>` +
    `</head><body class="${page.bodyClass || ''}">` +
    `<a class="skip" href="#main">İçeriğe geç</a>` +
    header(ctx) +
    `<main id="main">${page.body}</main>` +
    footer(ctx) +
    mobileBar(ctx) +
    js + ga +
    `</body></html>`
  );
}

export function ctaBand(ctx, { title = 'Tabelanızı birlikte planlayalım', text = 'Sihirbazla şartnamenizi oluşturun, WhatsApp’tan gönderin; ölçü ve fiyatı birlikte netleştirelim.' } = {}) {
  return (
    `<section class="sec" aria-labelledby="cta-h"><div class="wrap"><div class="cta-band"><div><h2 id="cta-h">${esc(title)}</h2><p>${esc(text)}</p></div>` +
    `<div class="btns"><a class="btn btn-gold btn-lg" href="${ctx.href('tabela-sihirbazi')}">${icon('spark')}Sihirbazı Başlat</a>` +
    `<a class="btn btn-wa btn-lg" href="https://wa.me/${cfg.whatsapp}" rel="noopener">${icon('whatsapp')}WhatsApp</a>` +
    `<a class="btn btn-light btn-lg" href="tel:${cfg.phone}">${icon('phone')}${cfg.phoneHtml}</a></div></div></div></section>`
  );
}

export function faqHTML(items, ctx) {
  return (
    `<div class="faq">` +
    items.map(([q, a]) => `<details><summary>${esc(q)}</summary><div class="ans"><p>${links(esc(a), ctx)}</p></div></details>`).join('') +
    `</div>`
  );
}

export function faqLD(items, ctx, pageSlug) {
  return {
    '@type': 'FAQPage',
    '@id': `${ctx.abs(pageSlug)}#faq`,
    mainEntity: items.map(([q, a]) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: links(a, ctx, { text: true }) },
    })),
  };
}
