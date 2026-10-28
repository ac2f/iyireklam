import cfg from '../site.config.mjs';
import { services, hubs, serviceBySlug } from '../data/services.mjs';
import { guides, guideBySlug } from '../data/guides.mjs';
import { PRODUCTS, THICKNESS, DEPTHS, fmtMm } from '../data/catalog.mjs';
import { icon } from '../lib/icons.mjs';
import { esc, links, breadcrumbs, ctaBand, faqHTML, faqLD } from '../lib/layout.mjs';
import { homePage, HOME_FAQ, mapBlock } from './home.mjs';

const BIZ = { '@id': `${cfg.siteUrl}/#business` };
const phoneLink = () => `<a href="tel:${cfg.phone}"><strong>${cfg.phoneHtml}</strong></a>`;

function webPageLD(ctx, name, desc, type = 'WebPage') {
  return {
    '@type': type,
    '@id': `${ctx.abs(ctx.slug)}#webpage`,
    url: ctx.abs(ctx.slug),
    name,
    description: desc,
    inLanguage: 'tr-TR',
    isPartOf: { '@id': `${cfg.siteUrl}/#website` },
    about: BIZ,
    breadcrumb: { '@id': `${ctx.abs(ctx.slug)}#breadcrumb` },
  };
}

const plain = (html) => html.replace(/<[^>]+>/g, '');

// ---------------------------------------------------------------------------
// Hizmet sayfası
// ---------------------------------------------------------------------------
function servicePage(s, ctx) {
  const bc = breadcrumbs(ctx, [{ name: s.name, slug: s.slug }]);
  const facts = `<dl class="facts">${s.facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`;
  const sections = s.sections.map((sec) => `<h2>${esc(sec.h)}</h2>${links(sec.html, ctx)}`).join('');
  const rel = s.related
    .map((r) => serviceBySlug[r])
    .filter(Boolean)
    .map((r) => `<a class="pill" href="${ctx.href(r.slug)}">${esc(r.nav)}</a>`)
    .join('');
  const guideLinks = guides
    .slice(0, 3)
    .map((g) => `<a class="pill" href="${ctx.href('rehber/' + g.slug)}">${esc(g.title.split(':')[0].split('(')[0].trim())}</a>`)
    .join('');
  const body = `${bc.html}
<header class="phead"><div class="wrap"><h1 class="h1">${s.h1}</h1><p class="lead">${esc(s.lead)}</p>
<p style="margin-top:22px;display:flex;flex-wrap:wrap;gap:10px"><a class="btn btn-gold" href="${ctx.href('tabela-sihirbazi')}?tur=${s.tur}">${icon('spark')}Sihirbazla Tasarla</a><a class="btn btn-wa" href="https://wa.me/${cfg.whatsapp}" rel="noopener">${icon('whatsapp')}WhatsApp</a></p></div></header>
<div class="sec" style="padding-top:20px"><div class="wrap layout-2">
<article class="prose">
<div class="tldr"><b>Kısaca</b><p>${esc(s.tldr)}</p></div>
${facts}
${sections}
<h2>Sık sorulan sorular</h2>
${faqHTML(s.faq, ctx)}
</article>
<aside class="side" aria-label="Hızlı işlemler">
<div class="card"><h3>Online tasarlayın</h3><p>Ölçü, malzeme, renk ve LED seçimlerinizi önizlemede görün; şartnameyi paylaşın.</p><p style="margin-top:14px"><a class="btn btn-gold btn-sm" href="${ctx.href('tabela-sihirbazi')}?tur=${s.tur}">Sihirbazı Aç</a></p></div>
<div class="card"><h3>İletişim</h3><p>${phoneLink()}<br>${esc(cfg.address.street)}, ${esc(cfg.address.neighborhood)}, ${esc(cfg.address.district)} / ${esc(cfg.address.city)}</p><p style="margin-top:14px"><a class="btn btn-wa btn-sm" href="https://wa.me/${cfg.whatsapp}" rel="noopener">WhatsApp</a></p></div>
<div class="card"><h3>İlgili hizmetler</h3><div class="rel">${rel}</div></div>
<div class="card"><h3>Rehberler</h3><div class="rel">${guideLinks}</div><p style="margin-top:12px"><a class="more" href="${ctx.href('rehber')}" style="font-size:14px;font-weight:600;color:var(--gold3)">Tüm rehberler</a></p></div>
</aside>
</div></div>
${ctaBand(ctx)}`;
  return {
    title: s.title,
    desc: s.desc,
    body,
    ld: [
      webPageLD(ctx, s.title, s.desc),
      bc.ld,
      {
        '@type': 'Service',
        '@id': `${ctx.abs(s.slug)}#service`,
        name: s.name,
        serviceType: s.name,
        description: s.tldr,
        url: ctx.abs(s.slug),
        provider: BIZ,
        areaServed: { '@type': 'City', name: 'Ankara' },
        availableChannel: { '@type': 'ServiceChannel', serviceUrl: ctx.abs('tabela-sihirbazi') },
      },
      faqLD(s.faq, ctx, s.slug),
    ],
  };
}

// ---------------------------------------------------------------------------
// Rehber
// ---------------------------------------------------------------------------
function guidePage(g, ctx) {
  const bc = breadcrumbs(ctx, [{ name: 'Rehber', slug: 'rehber' }, { name: g.title.split(':')[0].split('(')[0].trim(), slug: ctx.slug }]);
  const rel = g.related
    .map((r) => guideBySlug[r])
    .filter(Boolean)
    .map((r) => `<a class="card" href="${ctx.href('rehber/' + r.slug)}"><h3 style="margin-top:0">${esc(r.title)}</h3><span class="more">Oku ${icon('arrow')}</span></a>`)
    .join('');
  const body = `${bc.html}
<header class="phead"><div class="wrap narrow"><h1 class="h1">${g.h1}</h1><p class="lead">${esc(g.lead)}</p><p style="color:var(--muted2);font-size:14px;margin-top:14px">Güncelleme: ${new Date(g.updated).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })} · İyi Reklam, Ankara</p></div></header>
<div class="sec" style="padding-top:10px"><div class="wrap narrow"><article class="prose">
<div class="tldr"><b>Kısaca</b><p>${esc(g.tldr)}</p></div>
${links(g.body, ctx)}
</article>
<h2 class="h2" style="font-size:32px;margin:50px 0 20px">Diğer rehberler</h2>
<div class="grid g2">${rel}</div></div></div>
${ctaBand(ctx, { title: 'Seçimlerinizi önizlemede görün', text: 'Tabela sihirbazıyla malzeme, kalınlık ve renkleri deneyin; şartnameyi WhatsApp’tan gönderin.' })}`;
  return {
    title: `${g.title} | İyi Reklam`,
    desc: g.desc,
    body,
    ogType: 'article',
    ld: [
      webPageLD(ctx, g.title, g.desc),
      bc.ld,
      {
        '@type': 'Article',
        '@id': `${ctx.abs(ctx.slug)}#article`,
        headline: plain(g.title),
        description: g.desc,
        datePublished: g.updated,
        dateModified: g.updated,
        inLanguage: 'tr-TR',
        mainEntityOfPage: { '@id': `${ctx.abs(ctx.slug)}#webpage` },
        image: ctx.absAsset('img/og.png'),
        author: BIZ,
        publisher: BIZ,
      },
    ],
  };
}

function guideIndex(ctx) {
  const bc = breadcrumbs(ctx, [{ name: 'Rehber', slug: 'rehber' }]);
  const cards = guides
    .map((g) => `<a class="card" href="${ctx.href('rehber/' + g.slug)}"><span class="ico">${icon('book')}</span><h2>${esc(g.title)}</h2><p>${esc(g.desc)}</p><span class="more">Oku ${icon('arrow')}</span></a>`)
    .join('');
  const title = 'Tabela Rehberi | Kutu Harf, Pleksi, LED ve Malzeme Seçimi – İyi Reklam';
  const desc = 'Pleksi kalınlığı, LED seçimi, zemin malzemesi, yan bant ve fiyat etkenleri: Ankara tabela atölyesinden pratik, anlaşılır tabela rehberleri.';
  return {
    title,
    desc,
    body: `${bc.html}<header class="phead"><div class="wrap"><h1 class="h1">Tabela <em>Rehberi</em></h1><p class="lead">Malzeme, kalınlık, LED ve fiyat konularında doğru karar vermeniz için hazırladığımız kısa rehberler.</p></div></header>
<div class="sec" style="padding-top:10px"><div class="wrap"><div class="grid g3">${cards}</div></div></div>${ctaBand(ctx)}`,
    ld: [
      webPageLD(ctx, title, desc, 'CollectionPage'),
      bc.ld,
      {
        '@type': 'ItemList',
        itemListElement: guides.map((g, i) => ({ '@type': 'ListItem', position: i + 1, url: ctx.abs('rehber/' + g.slug), name: plain(g.title) })),
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Sihirbaz sayfası
// ---------------------------------------------------------------------------
const WIZARD_FAQ = [
  ['Hangi tabelayı seçeceğimi bilmiyorum, ne yapmalıyım?', 'Sihirbazın Kolay modunu kullanın. Tabelanın nereye yapılacağını, geceleri ışık verip vermeyeceğini ve nasıl bir görünüm istediğinizi seçmeniz yeterli; ışıklı harf, dekupe, germe, krom, kabartma harf, totem veya kapı tabelasından size uygun olanı önerir. Kalınlık, derinlik ve LED gibi teknik ayrıntıları da sizin için otomatik belirler.'],
  ['Kolay mod ile Detaylı mod arasındaki fark nedir?', 'Kolay modda yalnızca tür, ölçü, yazı, bütçe, renk ve ışık seçersiniz; malzeme ayrıntılarını sistem belirler. Detaylı modda zemin malzemesi, pleksi kalınlığı, yan yüzey, derinlik, LED markası gibi her şeyi kendiniz seçersiniz. İstediğiniz an iki mod arasında geçiş yapabilirsiniz.'],
  ['Tabela sihirbazı ücretsiz mi?', 'Evet, tabela sihirbazı ücretsizdir ve üyelik gerektirmez. Seçimlerinizi önizlemede görür, şartnameyi dilediğiniz gibi paylaşırsınız.'],
  ['Sihirbaz kesin fiyat gösteriyor mu?', 'Hayır. Sihirbaz her seçeneğin fiyat etkisini (En uygun, Hafif fark, Fiyatı artırır, Belirgin artış) gösterir ve genel bir fiyat seviyesi verir. Kesin fiyat ölçü ve keşif sonrası, şartnameye göre bildirilir.'],
  ['Verilerim saklanıyor mu?', 'Tasarımınız yalnızca tarayıcınızda (bu cihazda) saklanır; sunucuya gönderilmez. Paylaşmak istediğinizde WhatsApp, PNG veya PDF ile siz iletirsiniz.'],
  ['Şartnameyi nasıl paylaşırım?', 'Son adımda WhatsApp ile gönder, görseli paylaş/indir (PNG), yazdır/PDF, metni kopyala ve bağlantıyı kopyala seçenekleri bulunur. Bağlantıyı açan kişi aynı tasarımı görür.'],
  ['Her seçeneğe not ekleyebilir miyim?', 'Evet. Her seçenek grubunun altındaki “+ Not ekle” bağlantısıyla özel isteklerinizi (farklı kalınlık, renk, ölçü vb.) yazabilirsiniz; notlar şartnamede ilgili satırın altında görünür.'],
  ['Telefondan kullanılabilir mi?', 'Evet. Sihirbaz mobil uyumludur; önizleme ekranın üstünde sabit kalır, seçenekler altta kaydırılır.'],
];

function wizardPage(ctx) {
  const bc = breadcrumbs(ctx, [{ name: 'Tabela Sihirbazı', slug: 'tabela-sihirbazi' }]);
  const prodCards = PRODUCTS.map(
    (p) => `<div class="card"><h3 style="margin-top:0">${esc(p.name)}</h3><p>${esc(p.desc)}.</p></div>`,
  ).join('');
  const body = `${bc.html}
<header class="phead"><div class="wrap"><h1 class="h1">Online Tabela <em>Tasarım Sihirbazı</em></h1><p class="lead"><strong>Kolay mod:</strong> 3 soruyla size uygun tabelayı biz seçelim. <strong>Detaylı mod:</strong> tüm malzeme ayrıntılarını siz belirleyin. Gündüz/gece önizleyin, şartnameyi paylaşın.</p></div></header>
<div class="wrap"><div id="wizard" data-base="${ctx.up}assets/"><p class="wz-loading">Sihirbaz yükleniyor…</p>
<noscript><div class="noscript">Tabela sihirbazı için JavaScript gereklidir. Dilerseniz bizi arayın: <a href="tel:${cfg.phone}">${cfg.phoneHtml}</a> veya <a href="https://wa.me/${cfg.whatsapp}">WhatsApp</a>’tan yazın.</div></noscript></div></div>

<section class="sec"><div class="wrap">
<div class="sec-head"><span class="eyebrow">Sihirbazla neler yapabilirsiniz?</span><h2 class="h2">Dört ürün, <em>yüzlerce kombinasyon</em></h2></div>
<div class="grid g4">${prodCards}</div>
</div></section>

<section class="sec alt"><div class="wrap narrow"><article class="prose">
<h2>Seçilebilen ayrıntılar</h2>
<div class="tbl"><table>
<thead><tr><th>Konu</th><th>Seçenekler</th></tr></thead>
<tbody>
<tr><td>Harf sistemi</td><td>Işıklı kutu harf, ışıksız kutu harf, krom kutu harf (fileli/filesiz/tam krom), kabartma düz harf, dekupe, lazer kesim metal harf, baskı/folyo</td></tr>
<tr><td>Zemin</td><td>Alüminyum kompozit (Sistem paleti), dekota, aynalı dekota (gümüş/gold), pleksi; zeminsiz uygulama</td></tr>
<tr><td>Pleksi (Akpolimer)</td><td>${THICKNESS.pleksi.map((t) => fmtMm(t.v)).join(' · ')}; her renk</td></tr>
<tr><td>Dekota</td><td>${THICKNESS.dekota.map((t) => fmtMm(t.v)).join(' · ')}</td></tr>
<tr><td>Aynalı dekota</td><td>Gümüş ve gold; ${THICKNESS.aynali.map((t) => fmtMm(t.v)).join(' · ')}</td></tr>
<tr><td>Yan yüzey</td><td>Antrasit, siyah, beyaz, altın, gümüş veya pleksi ışıklı bant; ${DEPTHS.map((d) => d.v + ' cm').join(' · ')} derinlik</td></tr>
<tr><td>LED</td><td>Standart, Epistar, Samsung; beyaz, günışığı, amber, kırmızı, mavi, yeşil</td></tr>
<tr><td>Germe tabela</td><td>Çerçeve rengi, tek/çift yüz, baskı zemin ve yazı rengi</td></tr>
<tr><td>Montaj</td><td>Ankara içi montaj, atölyeden teslim, sevkiyat; kapı tabelasında sabitleme şekli</td></tr>
</tbody></table></div>
<div class="callout"><strong>Fiyat hakkında:</strong> Standart dışı seçimlerde (kalın pleksi, Samsung/Epistar LED, aynalı malzeme, derin harf vb.) fiyat yukarı yönlü değişebilir. Sihirbaz her adımda <em>en uygun</em> seçeneği belirtir.</div>
<h2>Sık sorulan sorular</h2>
${faqHTML(WIZARD_FAQ, ctx)}
</article></div></section>
${ctaBand(ctx, { title: 'Takıldığınız yer mi var?', text: 'Sihirbazı kullanırken yardım ister ya da listede olmayan bir ürün sormak isterseniz bizi arayın.' })}`;

  const title = 'Online Tabela Tasarım Sihirbazı | İyi Reklam Ankara';
  const desc = 'Tabelanızı online tasarlayın: kutu harf, krom harf, totem, germe, kapı tabelası. Pleksi, renk, LED, zemin seçin; gündüz/gece önizleyin, şartnameyi paylaşın.';
  return {
    title,
    desc,
    body,
    bodyClass: 'wz-page',
    extraCss: ['wizard.css'],
    extraJs: ['wizard.js'],
    ld: [
      webPageLD(ctx, title, desc),
      bc.ld,
      {
        '@type': 'WebApplication',
        '@id': `${ctx.abs(ctx.slug)}#app`,
        name: 'İyi Reklam Tabela Sihirbazı',
        url: ctx.abs(ctx.slug),
        applicationCategory: 'DesignApplication',
        operatingSystem: 'Web (tüm modern tarayıcılar, mobil ve masaüstü)',
        inLanguage: 'tr-TR',
        isAccessibleForFree: true,
        description: desc,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'TRY' },
        provider: BIZ,
        featureList: [
          'Cephe, totem, kapı ve germe tabela tasarımı',
          'Gündüz ve gece önizleme',
          'Pleksi, dekota, aynalı dekota ve kompozit seçenekleri',
          'LED markası ve rengi seçimi',
          'Her seçenek için not alanı',
          'WhatsApp, PNG ve PDF olarak paylaşılabilir şartname',
        ],
      },
      {
        '@type': 'HowTo',
        '@id': `${ctx.abs(ctx.slug)}#howto`,
        name: 'Online tabela nasıl tasarlanır ve şartname nasıl paylaşılır?',
        totalTime: 'PT5M',
        step: [
          { '@type': 'HowToStep', name: 'Ürünü seçin', text: 'Cephe tabelası, totem, kapı tabelası veya germe tabela seçin.' },
          { '@type': 'HowToStep', name: 'Ölçü ve yazıyı girin', text: 'Genişlik, yükseklik, metin ve yazı tipini belirleyin.' },
          { '@type': 'HowToStep', name: 'Zemin ve harf sistemini seçin', text: 'Zemin malzemesi, kalınlık, renk ve harf işleme yöntemini seçin.' },
          { '@type': 'HowToStep', name: 'Detayları ayarlayın', text: 'Pleksi kalınlığı ve rengi, yan yüzey, derinlik, LED markası ve rengini seçin.' },
          { '@type': 'HowToStep', name: 'Şartnameyi paylaşın', text: 'Şartnameyi WhatsApp ile gönderin, PNG olarak indirin veya PDF olarak yazdırın.' },
        ],
      },
      faqLD(WIZARD_FAQ, ctx, ctx.slug),
    ],
  };
}

// ---------------------------------------------------------------------------
// Diğer sayfalar
// ---------------------------------------------------------------------------
function aboutPage(ctx) {
  const bc = breadcrumbs(ctx, [{ name: 'Hakkımızda', slug: 'hakkimizda' }]);
  const title = 'Hakkımızda | İyi Reklam – Ankara Tabela ve CNC Atölyesi';
  const desc = 'İyi Reklam: Ankara İskitler’de 20 yılı aşkın deneyimle kendi atölyesinde tabela, kutu harf, CNC router ve lazer kesim üreten reklam atölyesi.';
  return {
    title, desc, fullBusiness: true,
    body: `${bc.html}<header class="phead"><div class="wrap"><h1 class="h1">Hakkımızda: <em>İyi Reklam</em></h1><p class="lead">Ankara İskitler’de, ${cfg.experienceYears} deneyimle tabela ve reklam imalatı yapan bir atölyeyiz.</p></div></header>
<div class="sec" style="padding-top:10px"><div class="wrap narrow"><article class="prose">
<p>İyi Reklam; ışıklı ve ışıksız pleksi kutu harf, krom harf, germe tabela, totem ve kapı tabelaları gibi her türlü tabelayı <strong>kendi atölyesinde, kendi makinalarıyla</strong> üretir. CNC router kesim, CNC lazer kesim, dijital baskı ve tabela montajı hizmetlerimizle işi baştan sona tek elden yönetiriz. Reklam ajansları ve tabelacılar için <a href="${ctx.href('fason-tabela-imalati')}">fason tabela ve fason kutu harf imalatı</a> yaparız.</p>
<h2>Yaklaşımımız</h2>
<ul>
<li><strong>Doğru malzeme:</strong> Her iş için en uygun ve kaliteli malzemeyi seçeriz; gereksiz maliyet önermeyiz.</li>
<li><strong>Şeffaflık:</strong> Pleksi kalınlığı, LED markası, zemin malzemesi gibi seçimlerin fiyata etkisini baştan söyleriz.</li>
<li><strong>Yazılı netlik:</strong> Tüm tercihleri şartnamede toplar, yanlış anlaşılmayı önleriz.</li>
<li><strong>Kalıcı sonuç:</strong> Müşterilerimizin bir kez yaptırdıktan sonra arkalarına bakmayacakları çözümler üretmeyi hedefleriz.</li>
</ul>
<h2>Atölyemiz</h2>
<p>Atölyemiz Ankara Altındağ İskitler’de, ${esc(cfg.address.street)} adresindedir. CNC router ve lazer kesim makinalarımızla pleksi, dekota, aynalı dekota, kompozit, ahşap ve metal malzemeleri işliyoruz. Daha fazla bilgi için <a href="${ctx.href('iskitler-tabela')}">İskitler sayfamıza</a> göz atabilir ya da bizi arayabilirsiniz: ${phoneLink()}.</p>
<h2>Online tabela sihirbazı</h2>
<p>Müşterilerimizin ne istediğini daha net anlayabilmek için ücretsiz bir <a href="${ctx.href('tabela-sihirbazi')}">tabela tasarım sihirbazı</a> geliştirdik. Ürünü, ölçüyü, malzemeyi ve renkleri seçip önizlemede görebilir, şartnameyi doğrudan bize gönderebilirsiniz.</p>
</article></div></div>${ctaBand(ctx)}`,
    ld: [webPageLD(ctx, title, desc, 'AboutPage'), bc.ld],
  };
}

function contactPage(ctx) {
  const bc = breadcrumbs(ctx, [{ name: 'İletişim', slug: 'iletisim' }]);
  const title = 'İletişim | İyi Reklam – İskitler, Altındağ / Ankara Tabela Atölyesi';
  const desc = 'İyi Reklam iletişim: Sebze Bahçeleri Caddesi No: 107/22 İskitler, Altındağ / Ankara. Telefon ve WhatsApp: 0531 520 90 01. Tabela fiyat teklifi için arayın.';
  return {
    title, desc, fullBusiness: true,
    body: `${bc.html}<header class="phead"><div class="wrap"><h1 class="h1">İletişim <em>ve Adres</em></h1><p class="lead">Tabela, kutu harf ve CNC kesim işleriniz için bizi arayın, WhatsApp’tan yazın ya da atölyemize uğrayın.</p></div></header>
<div class="sec" style="padding-top:10px"><div class="wrap split">
<div>
<div class="grid" style="gap:14px">
<div class="card"><span class="ico">${icon('phone')}</span><h2>Telefon &amp; WhatsApp</h2><p style="font-size:20px;color:var(--text)">${phoneLink()}</p><p style="margin-top:14px;display:flex;flex-wrap:wrap;gap:10px"><a class="btn btn-primary btn-sm" href="tel:${cfg.phone}">Ara</a><a class="btn btn-wa btn-sm" href="https://wa.me/${cfg.whatsapp}" rel="noopener">WhatsApp</a></p></div>
<div class="card"><span class="ico">${icon('pin')}</span><h2>Adres</h2><address class="addr" style="font-style:normal;color:var(--text)">${esc(cfg.address.street)}<br>${esc(cfg.address.neighborhood)}, ${esc(cfg.address.district)} / ${esc(cfg.address.city)}</address></div>
<div class="card"><span class="ico">${icon('spark')}</span><h2>Fiyat teklifi için</h2><p>Ölçü, fotoğraf ve istediğiniz malzemeyi bize iletin. En hızlı yol: <a href="${ctx.href('tabela-sihirbazi')}" style="color:var(--gold3);font-weight:600">tabela sihirbazı</a> ile şartname oluşturup WhatsApp’tan göndermek.</p></div>
</div></div>
${mapBlock(ctx)}
</div></div>
<div class="wrap narrow"><article class="prose"><h2>Teklif için hazırlıklı gelin</h2><ul>
<li>Tabela yerinin fotoğrafı ve yaklaşık ölçüsü</li>
<li>Varsa logonuzun vektörel dosyası (AI, PDF, SVG, CDR)</li>
<li>Işıklı/ışıksız tercihiniz ve renk beklentiniz</li>
<li>Montaj adresi (Ankara içi montaj için)</li>
</ul></article></div>${ctaBand(ctx)}`,
    ld: [
      webPageLD(ctx, title, desc, 'ContactPage'),
      bc.ld,
    ],
  };
}

function faqPage(ctx) {
  const bc = breadcrumbs(ctx, [{ name: 'Sık Sorulan Sorular', slug: 'sss' }]);
  const title = 'Sık Sorulan Sorular | Tabela, Kutu Harf, CNC Kesim – İyi Reklam';
  const desc = 'Tabela imalatı, kutu harf, pleksi kalınlığı, LED, zemin malzemesi, CNC router/lazer kesim, montaj ve fason üretim hakkında sık sorulan sorular ve yanıtları.';
  const groups = [{ name: 'Genel', items: HOME_FAQ }, { name: 'Tabela sihirbazı', items: WIZARD_FAQ }, ...[...hubs, ...services].map((s) => ({ name: s.name, items: s.faq }))];
  const all = groups.flatMap((g) => g.items);
  return {
    title, desc,
    body: `${bc.html}<header class="phead"><div class="wrap"><h1 class="h1">Sık Sorulan <em>Sorular</em></h1><p class="lead">Tabela, malzeme, fiyat, montaj ve fason üretim hakkında en çok sorulanlar.</p></div></header>
<div class="sec" style="padding-top:10px"><div class="wrap narrow">${groups.map((g) => `<h2 class="h2" style="font-size:30px;margin:38px 0 16px">${esc(g.name)}</h2>${faqHTML(g.items, ctx)}`).join('')}</div></div>${ctaBand(ctx, { title: 'Aradığınız yanıt yok mu?', text: 'Bize telefondan veya WhatsApp’tan sorun; ölçü ve ihtiyacınıza göre yönlendirelim.' })}`,
    ld: [webPageLD(ctx, title, desc), bc.ld, faqLD(all, ctx, ctx.slug)],
  };
}

function privacyPage(ctx) {
  const bc = breadcrumbs(ctx, [{ name: 'Gizlilik', slug: 'gizlilik' }]);
  const title = 'Gizlilik ve Çerez Bilgilendirmesi | İyi Reklam';
  const desc = 'İyi Reklam web sitesi ve tabela sihirbazında verilerinizin nasıl işlendiği: çerez kullanılmaz, tasarımlar yalnızca cihazınızda saklanır.';
  return {
    title, desc,
    body: `${bc.html}<header class="phead"><div class="wrap"><h1 class="h1">Gizlilik <em>Bilgilendirmesi</em></h1></div></header>
<div class="sec" style="padding-top:10px"><div class="wrap narrow"><article class="prose">
<h2>Kısaca</h2>
<ul>
<li>Bu sitede <strong>reklam veya takip çerezi kullanılmaz</strong>.</li>
<li>Tabela sihirbazında oluşturduğunuz tasarım ve girdiğiniz iletişim bilgileri <strong>yalnızca tarayıcınızda (cihazınızda)</strong> saklanır; sunucuya gönderilmez.</li>
<li>Şartnameyi WhatsApp, PNG, PDF veya bağlantı ile <strong>siz paylaştığınızda</strong> bilgiler bize ulaşır.</li>
</ul>
<h2>Üçüncü taraf hizmetler</h2>
<p><strong>WhatsApp:</strong> “WhatsApp ile gönder” bağlantısı WhatsApp uygulamasını/sitesini açar; mesajınız WhatsApp’ın gizlilik politikasına tabidir.</p>
<p><strong>Google Haritalar:</strong> Harita, yalnızca “Haritayı yükle” düğmesine bastığınızda yüklenir; bu durumda Google’ın hizmet koşulları geçerli olur.</p>
<h2>Tarayıcıda saklanan veriler</h2>
<p>Sihirbaz, tasarımınızı kaldığınız yerden devam edebilmeniz için tarayıcınızın yerel depolama alanında tutar. Bu veriyi tarayıcı ayarlarından veya sihirbazdaki “Sıfırla” düğmesiyle silebilirsiniz.</p>
<h2>İletişim</h2>
<p>Sorularınız için ${phoneLink()} numarasını arayabilirsiniz.</p>
</article></div></div>`,
    ld: [webPageLD(ctx, title, desc), bc.ld],
  };
}

function iskitlerPage(ctx) {
  const bc = breadcrumbs(ctx, [{ name: 'İskitler Tabelacı', slug: 'iskitler-tabela' }]);
  const title = 'İskitler Tabelacı | Altındağ Ankara Tabela ve Kutu Harf Atölyesi';
  const desc = 'İskitler’de tabelacı arıyorsanız: İyi Reklam, Sebze Bahçeleri Caddesi No: 107/22 İskitler Altındağ Ankara. Kutu harf, CNC router, lazer kesim, germe, totem.';
  const ld2 = {
    '@type': 'FAQPage',
    '@id': `${ctx.abs(ctx.slug)}#faq`,
    mainEntity: [
      { '@type': 'Question', name: 'İskitler’de tabelacı nerede?', acceptedAnswer: { '@type': 'Answer', text: `İyi Reklam, İskitler’de Sebze Bahçeleri Caddesi No: 107/22 adresinde, Altındağ / Ankara’dadır. Telefon: ${cfg.phoneDisplay}.` } },
    ],
  };
  return {
    title, desc, fullBusiness: true,
    body: `${bc.html}<header class="phead"><div class="wrap"><h1 class="h1">İskitler <em>Tabelacı</em></h1><p class="lead">Altındağ İskitler’de kendi atölyemizde kutu harf, tabela, CNC router ve lazer kesim işleri yapıyoruz.</p></div></header>
<div class="sec" style="padding-top:10px"><div class="wrap layout-2"><article class="prose">
<div class="tldr"><b>Kısaca</b><p>İyi Reklam, Ankara Altındağ İskitler Sebze Bahçeleri Caddesi No: 107/22 adresindeki atölyesinde ışıklı ve ışıksız kutu harf, krom harf, germe tabela, totem, kapı tabelası, CNC router kesim, CNC lazer kesim ve dijital baskı işleri yapar; Ankara içi montaj hizmeti verir.</p></div>
<h2>Atölyemiz nerede?</h2>
<p><strong>${esc(cfg.address.street)}, ${esc(cfg.address.neighborhood)}, ${esc(cfg.address.district)} / ${esc(cfg.address.city)}</strong></p>
<p>İskitler, Ankara’da tabela ve reklam atölyelerinin bulunduğu bilinen bir bölgedir. Gelmeden önce ${phoneLink()} numarasını arayarak randevu alırsanız malzeme numunelerini ve kartelaları birlikte inceleyebiliriz.</p>
<h2>İskitler’de neler yapıyoruz?</h2>
<ul>
${[...hubs, ...services].map((s) => `<li><a href="${ctx.href(s.slug)}">${esc(s.name)}</a> — ${esc(s.navDesc)}</li>`).join('')}
</ul>
<h2>Atölyeye gelirken yanınızda olsun</h2>
<ul>
<li>Tabela yerinin fotoğrafı ve ölçüsü</li>
<li>Logo dosyası (mümkünse vektörel)</li>
<li>Işıklı/ışıksız ve renk tercihiniz</li>
</ul>
<h2>Ankara geneli montaj</h2>
<p>Ankara’nın farklı ilçeleri (Altındağ, Çankaya, Keçiören, Yenimahalle, Mamak, Etimesgut, Sincan ve diğerleri) için montaj taleplerinizi telefonla iletebilirsiniz; keşifte uygun planı yaparız. Ayrıntı: <a href="${ctx.href('tabela-montaj')}">Tabela montaj</a>.</p>
</article>
<aside class="side"><div class="card"><h3>Harita</h3>${mapBlock(ctx)}</div><div class="card"><h3>İletişim</h3><p>${phoneLink()}</p><p style="margin-top:12px"><a class="btn btn-wa btn-sm" href="https://wa.me/${cfg.whatsapp}" rel="noopener">WhatsApp</a></p></div></aside>
</div></div>${ctaBand(ctx)}`,
    ld: [webPageLD(ctx, title, desc), bc.ld, ld2],
  };
}

export function notFoundPage(ctx) {
  return {
    title: 'Sayfa bulunamadı | İyi Reklam',
    desc: 'Aradığınız sayfa bulunamadı. Ana sayfaya dönebilir veya tabela sihirbazını kullanabilirsiniz.',
    noindex: true,
    body: `<section class="sec"><div class="wrap narrow" style="text-align:center"><span class="eyebrow">404</span><h1 class="h2">Bu sayfa <em>bulunamadı</em></h1><p class="lead" style="margin-inline:auto">Adres değişmiş ya da yanlış yazılmış olabilir. Ana sayfaya dönebilir veya doğrudan tabelanızı tasarlamaya başlayabilirsiniz.</p><p style="margin-top:26px;display:flex;flex-wrap:wrap;gap:10px;justify-content:center"><a class="btn btn-primary" href="${ctx.href('')}">Ana Sayfa</a><a class="btn btn-gold" href="${ctx.href('tabela-sihirbazi')}">Tabela Sihirbazı</a><a class="btn btn-ghost" href="tel:${cfg.phone}">${cfg.phoneHtml}</a></p></div></section>`,
    ld: [],
  };
}

// ---------------------------------------------------------------------------
export function allPages() {
  const list = [
    { slug: '', build: homePage, priority: '1.0', freq: 'weekly' },
    { slug: 'tabela-sihirbazi', build: wizardPage, priority: '0.9', freq: 'monthly' },
    ...[...hubs, ...services].map((s) => ({ slug: s.slug, build: (ctx) => servicePage(s, ctx), priority: '0.9', freq: 'monthly' })),
    { slug: 'iskitler-tabela', build: iskitlerPage, priority: '0.8', freq: 'monthly' },
    { slug: 'rehber', build: guideIndex, priority: '0.7', freq: 'weekly' },
    ...guides.map((g) => ({ slug: 'rehber/' + g.slug, build: (ctx) => guidePage(g, ctx), priority: '0.7', freq: 'monthly' })),
    { slug: 'hakkimizda', build: aboutPage, priority: '0.6', freq: 'yearly' },
    { slug: 'iletisim', build: contactPage, priority: '0.8', freq: 'yearly' },
    { slug: 'sss', build: faqPage, priority: '0.7', freq: 'monthly' },
    { slug: 'gizlilik', build: privacyPage, priority: '0.2', freq: 'yearly' },
  ];
  return list;
}

export { WIZARD_FAQ };
