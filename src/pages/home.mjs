import cfg from '../site.config.mjs';
import { services } from '../data/services.mjs';
import { guides } from '../data/guides.mjs';
import { THICKNESS, DEPTHS, LED_BRANDS, LED_COLORS, SIDE_COLORS, fmtMm } from '../data/catalog.mjs';
import { icon } from '../lib/icons.mjs';
import { esc, ctaBand, faqHTML, faqLD } from '../lib/layout.mjs';

const BLURB = {
  'kutu-harf-tabela': 'Işıklı ve ışıksız pleksi kutu harf; kalınlık, yan bant, derinlik ve LED seçimiyle.',
  'krom-harf-tabela': 'Fileli ve filesiz krom kutu harf; altın veya gümüş yan, renkli pleksi ön yüz.',
  'germe-tabela': 'Alüminyum çerçeve, baskılı germe kumaş ve arkadan LED ile ışıklı kutu tabela.',
  'totem-tabela': 'Yol kenarı, site ve iş merkezi girişleri için dikey ışıklı veya ışıksız totem.',
  'kapi-tabelasi': 'Ofis, klinik ve plaza kapıları için aynalı, kompozit ve pleksi tabelalar.',
  'cnc-router-kesim': 'Pleksi, dekota, aynalı dekota, kompozit ve ahşap için hassas CNC router kesim.',
  'cnc-lazer-kesim': 'Paslanmaz, alüminyum ve sac için hassas lazer kesim; metal harf ve logo.',
  'dijital-baski': 'Germe kumaş baskısı, folyo uygulama ve kesim folyo; renkleriniz birebir yansır.',
  'fason-tabela-imalati': 'Reklamcılar için fason kutu harf, tabela ve kesim; şartname usulü düzenli üretim.',
  'tabela-montaj': 'Ankara içi keşif ve montaj; üretimden montaja tek elden hizmet.',
};

export const HOME_FAQ = [
  ['Ankara’da tabela imalatı için nereye gelmeliyim?', 'Atölyemiz Ankara Altındağ İskitler, Sebze Bahçeleri Caddesi No: 107/22 adresindedir. Gelmeden önce 0531 520 90 01 numaralı telefondan bilgi alabilir veya WhatsApp’tan yazabilirsiniz.'],
  ['Hangi tabela türlerini üretiyorsunuz?', 'Işıklı ve ışıksız pleksi kutu harf, krom harf, germe tabela, totem tabela, kapı ve ofis tabelaları üretiyoruz. Ayrıca CNC router kesim, CNC lazer kesim, dijital baskı ve tabela montajı yapıyoruz.'],
  ['Online tabela sihirbazı ücretli mi?', 'Hayır, tabela sihirbazı ücretsizdir. Ürünü, ölçüyü, malzemeyi ve renkleri seçip önizlemede görür, sonunda şartnameyi WhatsApp, PNG veya PDF olarak paylaşabilirsiniz.'],
  ['Tabela fiyatı nasıl belirleniyor?', 'Fiyat; ölçü, harf sistemi, pleksi kalınlığı, yan yüzey ve derinlik, LED markası, zemin malzemesi ve montaj koşullarına göre değişir. Sihirbaz her seçeneğin fiyat etkisini gösterir; kesin fiyat şartname ve ölçü/keşif sonrası verilir.'],
  ['Reklamcılara fason üretim yapıyor musunuz?', 'Evet. Reklam ajansları ve tabelacılar için fason kutu harf, fason tabela imalatı, CNC router ve lazer kesim yapıyoruz. Şartname usulüyle sipariş alıyoruz.'],
  ['Montaj hizmeti veriyor musunuz?', 'Evet, Ankara içinde tabela montajı yapıyoruz. Keşifte cephe ve elektrik durumuna göre en uygun sabitleme yöntemini planlıyoruz.'],
  ['Pleksi kalınlığı ve LED markası fiyatı etkiler mi?', 'Evet. Kalın pleksi tercihleri fiyatı oldukça artırır; Samsung ve Epistar gibi standart dışı LED tercihleri de fiyatı yukarı taşıyabilir. Sihirbazda en uygun seçenek her adımda belirtilir.'],
];

function heroArt() {
  return `<svg viewBox="0 0 500 400" role="img" aria-label="Işıklı kutu harf tabela, totem ve kapı tabelası çizimi" preserveAspectRatio="xMidYMid slice">
<defs>
<linearGradient id="hw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#171d28"/><stop offset="1" stop-color="#0a0d12"/></linearGradient>
<linearGradient id="hp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#232b39"/><stop offset="1" stop-color="#171d28"/></linearGradient>
<linearGradient id="hg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3c9"/><stop offset=".5" stop-color="#e7c878"/><stop offset="1" stop-color="#b8913a"/></linearGradient>
<filter id="hb1" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="3"/></filter>
<filter id="hb2" x="-30%" y="-100%" width="160%" height="300%"><feGaussianBlur stdDeviation="11"/></filter>
<filter id="hs"><feDropShadow dx="2" dy="5" stdDeviation="4" flood-color="#000" flood-opacity=".55"/></filter>
</defs>
<rect width="500" height="400" fill="url(#hw)"/>
<g stroke="#ffffff" stroke-opacity=".035"><path d="M0 70h500M0 140h500M0 210h500M0 280h500M0 350h500"/><path d="M60 0v400M140 0v400M220 0v400M300 0v400M380 0v400M460 0v400"/></g>
<g filter="url(#hs)"><rect x="40" y="48" width="420" height="132" rx="10" fill="url(#hp)" stroke="#ffffff" stroke-opacity=".08"/></g>
<g class="glow-a" font-family="Inter,Arial,sans-serif" font-weight="700" text-anchor="middle" letter-spacing="3">
<text x="250" y="124" font-size="58" fill="#ffd88a" filter="url(#hb2)" opacity=".85">İYİ REKLAM</text>
<text x="250" y="124" font-size="58" fill="#ffd88a" filter="url(#hb1)">İYİ REKLAM</text>
<text x="250" y="124" font-size="58" fill="#fff6dc">İYİ REKLAM</text>
<text x="250" y="156" font-size="14.5" fill="#e7c878" letter-spacing="6.5">TABELA · KUTU HARF · CNC</text>
</g>
<g filter="url(#hs)"><rect x="330" y="206" width="112" height="170" rx="8" fill="url(#hp)" stroke="#ffffff" stroke-opacity=".08"/><rect x="316" y="372" width="140" height="10" rx="4" fill="#0a0d12"/></g>
<g class="glow-a" font-family="Inter,Arial,sans-serif" font-weight="700" text-anchor="middle">
<circle cx="386" cy="244" r="17" fill="none" stroke="#e7c878" stroke-width="3" filter="url(#hb1)"/><circle cx="386" cy="244" r="17" fill="none" stroke="#fff6dc" stroke-width="2"/>
<path d="M356 290h60M360 312h52M366 334h40" stroke="#ffd88a" stroke-width="5" stroke-linecap="round" filter="url(#hb1)"/><path d="M356 290h60M360 312h52M366 334h40" stroke="#fff6dc" stroke-width="3" stroke-linecap="round"/>
</g>
<g filter="url(#hs)"><rect x="60" y="226" width="200" height="130" rx="6" fill="url(#hg)" opacity=".92"/></g>
<rect x="60" y="226" width="200" height="130" rx="6" fill="none" stroke="#fff" stroke-opacity=".5"/>
<g fill="#1a1405" font-family="Inter,Arial,sans-serif" font-weight="700"><circle cx="72" cy="238" r="3"/><circle cx="248" cy="238" r="3"/><circle cx="72" cy="344" r="3"/><circle cx="248" cy="344" r="3"/>
<text x="160" y="288" font-size="21" text-anchor="middle" letter-spacing="1.5">DR. AD SOYAD</text><text x="160" y="316" font-size="13" text-anchor="middle" letter-spacing="3" opacity=".75">UZMAN · KLİNİK</text></g>
</svg>`;
}

export function homePage(ctx) {
  const a = ctx.href;
  const svcCards = services
    .map(
      (s) =>
        `<a class="card" href="${a(s.slug)}"><span class="ico">${icon(s.icon)}</span><h3>${esc(s.name)}</h3><p>${esc(BLURB[s.slug])}</p><span class="more">Detaylar ${icon('arrow')}</span></a>`,
    )
    .join('');
  const chips = (arr) => arr.map((t) => `<span class="tag">${esc(t)}</span>`).join('');
  const guideCards = guides
    .slice(0, 3)
    .map(
      (g) =>
        `<a class="card" href="${a('rehber/' + g.slug)}"><span class="ico">${icon('book')}</span><h3>${esc(g.title)}</h3><p>${esc(g.desc.slice(0, 120))}…</p><span class="more">Oku ${icon('arrow')}</span></a>`,
    )
    .join('');

  const body = `
<section class="hero"><div class="wrap hero-in">
  <div>
    <span class="eyebrow">Ankara · İskitler · ${cfg.experienceYears} deneyim</span>
    <h1 class="h1">Ankara Tabela İmalatı <em>ve Kutu Harf Atölyesi</em></h1>
    <p class="lead">Işıklı ve ışıksız pleksi kutu harf, krom harf, germe tabela, totem ve kapı tabelaları; CNC router ve lazer kesim. Hepsi kendi atölyemizde, kendi makinalarımızla ve doğru malzeme seçimiyle.</p>
    <div class="hero-cta">
      <a class="btn btn-gold btn-lg" href="${a('tabela-sihirbazi')}">${icon('spark')}Tabelanı Tasarla</a>
      <a class="btn btn-light btn-lg" href="https://wa.me/${cfg.whatsapp}" rel="noopener">${icon('whatsapp')}WhatsApp’tan Yaz</a>
    </div>
    <ul class="hero-pts">
      <li>${icon('check')}Kendi atölyemiz</li><li>${icon('check')}CNC router + lazer kesim</li><li>${icon('check')}Reklamcılara fason</li><li>${icon('check')}Ankara içi montaj</li>
    </ul>
  </div>
  <div class="hero-art">${heroArt()}</div>
</div></section>

<div class="trust-bar"><div class="wrap trust" role="list" aria-label="Güven göstergeleri">
  <div role="listitem"><b>20+ yıl</b><span>tabela ve reklam imalatı deneyimi</span></div>
  <div role="listitem"><b>Kendi atölye</b><span>üretim, kesim ve montaj tek çatı altında</span></div>
  <div role="listitem"><b>CNC &amp; Lazer</b><span>router ve lazer kesim makinaları</span></div>
  <div role="listitem"><b>İskitler</b><span>Altındağ / Ankara</span></div>
</div></div>

<section class="sec" id="hizmetler"><div class="wrap">
  <div class="sec-head"><span class="eyebrow">Hizmetlerimiz</span><h2 class="h2">Tabeladan kesime, <em>her şey</em> tek atölyede</h2>
  <p class="lead">Işıklı veya ışıksız her türlü tabelayı; makinalarımız ve ${cfg.experienceYears} deneyimimizle en uygun ve kaliteli malzeme seçimiyle üretiyoruz.</p></div>
  <div class="grid g5">${svcCards}</div>
</div></section>

<section class="sec dark" id="sihirbaz"><div class="wrap split">
  <div>
    <span class="eyebrow">Tabela Sihirbazı</span>
    <h2 class="h2">Tabelanı <em>kendin tasarla</em>, şartnamesini paylaş</h2>
    <p class="lead">Ürünü seç; zemin, harf sistemi, pleksi rengi ve kalınlığı, yan yüzey, LED markası ve rengini belirle. Gündüz ve gece önizlemeyi gör, şartnameni WhatsApp’tan gönder.</p>
    <ul class="check">
      <li>${icon('check')}<span><strong>Her seçeneğe not ekleyin:</strong> farklı kalınlık, renk veya istek.</span></li>
      <li>${icon('check')}<span><strong>Fiyat etkisi görünür:</strong> en uygun seçenek her adımda işaretli.</span></li>
      <li>${icon('check')}<span><strong>Paylaşılabilir şartname:</strong> WhatsApp, PNG ve PDF.</span></li>
      <li>${icon('check')}<span><strong>Mobil ve masaüstü uyumlu,</strong> hızlı ve hafif.</span></li>
    </ul>
    <p style="margin-top:26px"><a class="btn btn-gold btn-lg" href="${a('tabela-sihirbazi')}">${icon('spark')}Sihirbazı Başlat</a></p>
  </div>
  <div class="grid two" style="gap:14px">
    <a class="card" href="${a('tabela-sihirbazi')}?urun=cephe"><span class="ico">${icon('letters')}</span><h3>Cephe Tabelası</h3><p>Kutu harf, krom, dekupe, kabartma</p></a>
    <a class="card" href="${a('tabela-sihirbazi')}?urun=totem"><span class="ico">${icon('totem')}</span><h3>Totem Tabela</h3><p>Yol kenarı ve site girişi</p></a>
    <a class="card" href="${a('tabela-sihirbazi')}?urun=kapi"><span class="ico">${icon('door')}</span><h3>Kapı Tabelası</h3><p>Ofis, klinik, plaza</p></a>
    <a class="card" href="${a('tabela-sihirbazi')}?urun=germe"><span class="ico">${icon('lightbox')}</span><h3>Germe Tabela</h3><p>Işıklı kutu, baskılı kumaş</p></a>
  </div>
</div></section>

<section class="sec" id="malzemeler"><div class="wrap">
  <div class="sec-head"><span class="eyebrow">Seçenekler</span><h2 class="h2">Malzeme, kalınlık ve renkte <em>geniş seçim</em></h2>
  <p class="lead">Sihirbazda gördüğünüz seçeneklerin tamamı atölyemizde karşılığı olan gerçek seçeneklerdir. Farklı bir isteğiniz varsa not olarak ekleyebilirsiniz.</p></div>
  <div class="grid g3">
    <div class="card"><h3>Pleksi (Akpolimer paleti)</h3><p>Her renkte; kutu harf ön yüzü ve düz harf için.</p><div class="chips-row" style="margin-top:14px">${chips(THICKNESS.pleksi.map((t) => fmtMm(t.v)))}</div><p style="margin-top:12px;font-size:13.5px">Kalın pleksi fiyatı oldukça artırır; en uygun seçenek 2,8 mm.</p></div>
    <div class="card"><h3>Dekota & aynalı dekota</h3><p>Düz dekota ve gümüş/gold aynalı dekota.</p><div class="chips-row" style="margin-top:14px">${chips(THICKNESS.dekota.map((t) => 'Dekota ' + fmtMm(t.v)))}${chips(THICKNESS.aynali.map((t) => 'Aynalı ' + fmtMm(t.v)))}</div></div>
    <div class="card"><h3>Alüminyum kompozit (Sistem)</h3><p>Düz, metalik, aynalı gold/gümüş, fırçalı, ahşap ve taş desen paleti.</p><div class="chips-row" style="margin-top:14px">${chips(['Aynalı gold', 'Aynalı gümüş', 'Ahşap desenler', 'Mermer & taş', 'Metalik', 'Fırçalı'])}</div></div>
    <div class="card"><h3>Yan yüzey ve derinlik</h3><p>Işıksız yan bant veya pleksi ışıklı bant.</p><div class="chips-row" style="margin-top:14px">${chips(SIDE_COLORS.map((c) => c.name))}${chips(DEPTHS.map((d) => d.v + ' cm'))}</div></div>
    <div class="card"><h3>LED markası ve rengi</h3><p>Standart, Epistar ve Samsung. Standart dışı tercihlerde fiyat yukarı yönlü değişebilir.</p><div class="chips-row" style="margin-top:14px">${chips(LED_BRANDS.map((b) => b.name))}${chips(LED_COLORS.map((c) => c.name))}</div></div>
    <div class="card"><h3>Krom harf seçenekleri</h3><p>Fileli, filesiz ve tam krom; yanlar gümüş veya altın, ön pleksi rengi seçilebilir.</p><div class="chips-row" style="margin-top:14px">${chips(['Fileli', 'Filesiz', 'Tam krom', 'Gümüş yan', 'Altın yan'])}</div></div>
  </div>
</div></section>

<section class="sec alt"><div class="wrap">
  <div class="sec-head center"><span class="eyebrow">Nasıl çalışıyoruz?</span><h2 class="h2">Fikirden <em>montaja</em> beş adım</h2></div>
  <ol class="steps">
    <li><h3>Sihirbazla tasarlayın</h3><p>Ürünü, ölçüyü ve malzemeleri seçin; gündüz ve gece önizlemeyi görün.</p></li>
    <li><h3>Şartnameyi gönderin</h3><p>WhatsApp, PNG veya PDF olarak paylaşın; notlarınız dahil.</p></li>
    <li><h3>Keşif ve fiyat</h3><p>Ölçüyü netleştirir, kesin fiyatı ve termini bildiririz.</p></li>
    <li><h3>Üretim</h3><p>CNC router ve lazer ile kendi atölyemizde üretim.</p></li>
    <li><h3>Montaj ve teslim</h3><p>Ankara içi montaj veya atölyeden teslim.</p></li>
  </ol>
</div></section>

<section class="sec" id="fason"><div class="wrap split">
  <div>
    <span class="eyebrow">Reklamcılara</span>
    <h2 class="h2">Fason <em>tabela ve kutu harf</em> üretim ortağınız</h2>
    <p class="lead">Reklam ajansları ve tabelacılar için fason kutu harf, fason tabela imalatı, CNC router ve lazer kesim; şartname usulüyle düzenli ve hatasız sipariş akışı.</p>
    <ul class="check">
      <li>${icon('check')}<span>Işıklı/ışıksız kutu harf ve krom harf</span></li>
      <li>${icon('check')}<span>CNC router ve lazer kesim (dosyanıza göre)</span></li>
      <li>${icon('check')}<span>Tabela montajı (Ankara içi)</span></li>
    </ul>
    <p style="margin-top:24px"><a class="btn btn-primary" href="${a('fason-tabela-imalati')}">Fason imalat detayları ${icon('arrow')}</a></p>
  </div>
  <div class="card" style="padding:30px"><h3 style="margin-top:0;font-size:22px">Neden şartname?</h3><p>Pleksi kalınlığı, yan derinlik, LED markası gibi ayrıntılar sözlü aktarımda karışır. Sihirbaz çıktısı; tüm malzeme, renk ve notları tek sayfada toplayarak hatalı üretimi önler.</p></div>
</div></section>

<section class="sec alt"><div class="wrap">
  <div class="sec-head"><span class="eyebrow">Neden İyi Reklam?</span><h2 class="h2">Bir kez yaptırın, <em>arkanıza bakmayın</em></h2></div>
  <div class="grid g4">
    <div class="card"><span class="ico">${icon('clock')}</span><h3>${cfg.experienceYears} yıl</h3><p>Sektörde biriken deneyim; doğru malzeme ve doğru işçilik.</p></div>
    <div class="card"><span class="ico">${icon('layers')}</span><h3>Kendi atölyemiz</h3><p>Kesim, imalat ve montaj tek elde; süreç şeffaf ve kontrollü.</p></div>
    <div class="card"><span class="ico">${icon('shield')}</span><h3>Doğru malzeme</h3><p>Uygun ve kaliteli malzeme seçimi; gereksiz maliyet önerilmez.</p></div>
    <div class="card"><span class="ico">${icon('spark')}</span><h3>Şeffaf seçenekler</h3><p>Her seçeneğin fiyat etkisi ve en uygun alternatifi gösterilir.</p></div>
  </div>
</div></section>

<section class="sec"><div class="wrap">
  <div class="sec-head"><span class="eyebrow">Rehber</span><h2 class="h2">Doğru tabela için <em>kısa rehberler</em></h2></div>
  <div class="grid g3">${guideCards}</div>
  <p style="margin-top:22px"><a class="btn btn-ghost" href="${a('rehber')}">Tüm rehberler ${icon('arrow')}</a></p>
</div></section>

<section class="sec alt" id="sss"><div class="wrap narrow">
  <div class="sec-head"><span class="eyebrow">Sık sorulan sorular</span><h2 class="h2">Merak <em>edilenler</em></h2></div>
  ${faqHTML(HOME_FAQ, ctx)}
  <p style="margin-top:20px"><a class="btn btn-ghost" href="${a('sss')}">Tüm sorular ${icon('arrow')}</a></p>
</div></section>

<section class="sec"><div class="wrap split">
  <div>
    <span class="eyebrow">Atölyemiz</span>
    <h2 class="h2">İskitler’de <em>sizi bekliyoruz</em></h2>
    <address class="addr lead" style="font-style:normal;color:var(--text)">${esc(cfg.address.street)}<br>${esc(cfg.address.neighborhood)}, ${esc(cfg.address.district)} / ${esc(cfg.address.city)}</address>
    <p style="margin-top:20px;display:flex;flex-wrap:wrap;gap:10px"><a class="btn btn-primary" href="tel:${cfg.phone}">${icon('phone')}${cfg.phoneDisplay}</a><a class="btn btn-wa" href="https://wa.me/${cfg.whatsapp}" rel="noopener">${icon('whatsapp')}WhatsApp</a></p>
  </div>
  ${mapBlock(ctx)}
</div></section>
${ctaBand(ctx)}`;

  return {
    title: 'Ankara Tabela İmalatı | Kutu Harf, Krom Harf, Totem, CNC Kesim – İyi Reklam',
    desc: 'Ankara İskitler’de kendi atölyemizde tabela imalatı: ışıklı/ışıksız kutu harf, krom harf, germe, totem, kapı tabelası, CNC router ve lazer kesim. Online tabela sihirbazı.',
    body,
    ld: [
      {
        '@type': 'WebSite',
        '@id': `${cfg.siteUrl}/#website`,
        url: `${cfg.siteUrl}/`,
        name: cfg.brand,
        inLanguage: 'tr-TR',
        publisher: { '@id': `${cfg.siteUrl}/#business` },
      },
      {
        '@type': 'WebPage',
        '@id': `${cfg.siteUrl}/#webpage`,
        url: `${cfg.siteUrl}/`,
        name: 'Ankara Tabela İmalatı | İyi Reklam',
        isPartOf: { '@id': `${cfg.siteUrl}/#website` },
        about: { '@id': `${cfg.siteUrl}/#business` },
        inLanguage: 'tr-TR',
      },
      faqLD(HOME_FAQ, ctx, ''),
    ],
  };
}

export function mapBlock(ctx) {
  const q = encodeURIComponent(`${cfg.address.street.replace('No: ', '')}, ${cfg.address.neighborhood}, ${cfg.address.district}, ${cfg.address.city}`);
  return (
    `<div class="map" data-map="https://www.google.com/maps?q=${q}&output=embed"><div class="map-in"><span class="map-pin"><i></i></span>` +
    `<strong>${esc(cfg.address.neighborhood)}, ${esc(cfg.address.district)} / ${esc(cfg.address.city)}</strong>` +
    `<span style="color:var(--muted);font-size:14.5px">${esc(cfg.address.street)}</span>` +
    `<button type="button" class="btn btn-primary btn-sm" data-map-load>Haritayı yükle</button>` +
    `<a class="pill" href="https://www.google.com/maps/search/?api=1&query=${q}" rel="noopener" target="_blank">Google Haritalar’da aç</a></div></div>`
  );
}
