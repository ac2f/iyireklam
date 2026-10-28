# İyi Reklam — Ankara Tabela Sitesi ve Tabela Sihirbazı

Ankara Altındağ İskitler’deki tabela / kutu harf / CNC atölyesi için hazırlanmış, **bağımlılıksız, çok hafif** statik web sitesi ve etkileşimli **tabela tasarım sihirbazı**.

- **Adres:** Sebze Bahçeleri Caddesi No: 107/22, İskitler, Altındağ / Ankara
- **Telefon / WhatsApp:** 0531 520 90 01
- 26 sayfa: ana sayfa, 11 hizmet sayfası, tabela sihirbazı, 6 rehber, İskitler, hakkımızda, iletişim, SSS, gizlilik, 404
- Sayfa başına ~110–140 KB (yazı tipleri dahil), Lighthouse: Performans 96–100 · Erişilebilirlik 98–100 · En iyi uygulamalar 100 · SEO 100

## Yayına alma (GitHub Pages)

1. GitHub → **Settings → Pages → Build and deployment**
2. **Source:** *Deploy from a branch* → **Branch: `master` / `(root)`** → Save
3. Birkaç dakika içinde site `https://ac2f.github.io/iyireklam/` adresinde yayına girer.

Depodaki dosyalar **derlenmiş hâlde** olduğundan ek bir derleme ayarı gerekmez (Netlify, Cloudflare Pages, Vercel veya herhangi bir statik sunucuya da klasörün kendisi yüklenebilir).

### Kendi alan adınızı bağlayınca (önemli — SEO için)

`canonical`, site haritası, JSON-LD ve `llms.txt` adresleri tek bir yerden gelir:

1. `src/site.config.mjs` içinde `siteUrl` değerini yazın (örn. `https://www.iyireklam.com`)  
   *(ya da derlerken `SITE_URL=https://www.iyireklam.com npm run build`)*
2. `npm install && npm run build` → değişen dosyaları commit edip `master`’a gönderin.
3. Alan adı için depo köküne `CNAME` dosyası ekleyin (içine yalnızca alan adı) ve DNS kayıtlarını yönlendirin.
4. `robots.txt` ve `sitemap.xml` yalnızca **alan adının kökünde** tarayıcılarca okunur; bu yüzden alt yol (`/iyireklam/`) yerine alan adı kullanmak önerilir.

## Sık yapılacak değişiklikler

| Ne? | Nerede? |
|---|---|
| Telefon, adres, **marka adı**, alan adı, Google Analytics / Search Console kodu | `src/site.config.mjs` |
| Pleksi / dekota / kompozit renkleri, kalınlıklar, LED seçenekleri, fiyat etkisi seviyeleri, **Kolay mod türleri/renkleri** | `src/data/catalog.mjs` |
| Kolay modun bütçeye göre otomatik seçtiği kalınlık, derinlik, LED vb. | `src/wizard/easy.js` (`deriveEasy`) |
| Hizmet sayfası metinleri, SSS | `src/data/services.mjs` |
| Rehber yazıları | `src/data/guides.mjs` |
| Ana sayfa | `src/pages/home.mjs` |
| Diğer sayfalar (sihirbaz sayfası, iletişim, hakkımızda…) | `src/pages/pages.mjs` |
| Renkler / tipografi | `src/css/site.css` (`:root` değişkenleri) |

Her değişiklikten sonra:

```bash
npm install        # ilk seferde (yalnızca esbuild)
npm run build      # sayfaları, CSS/JS paketlerini, sitemap, robots, llms.txt dosyalarını üretir
npm run serve      # http://localhost:4173 (yerel önizleme)
```

> **Not (firma adı):** Depo adından yola çıkarak marka adı “İyi Reklam” olarak kullanıldı. Resmî ticari adınız farklıysa `src/site.config.mjs` içindeki `brand` değerini değiştirip `npm run build` ve `node scripts/make-images.mjs` çalıştırmanız yeterlidir (metinler, logo yazısı, paylaşım görseli ve şartname başlığı otomatik güncellenir).

> **Not (renkler):** Üretici kartelalarına internet üzerinden ulaşılamadığı için Akpolimer (pleksi) ve Sistem (kompozit) paletleri bilinen renk aileleriyle ve yaklaşık ekran renkleriyle hazırlanmıştır. Gerçek kartela adı/rengi farklıysa `src/data/catalog.mjs` içindeki ilgili satırı düzeltmeniz yeterlidir; sihirbaz, şartname ve sayfalar otomatik güncellenir.

## Tabela sihirbazı nasıl çalışır?

`src/wizard/` altındaki modüller tek bir paket olarak (`assets/wizard.js`, ~32 KB gzip) yüklenir:

- `state.js` — seçimlerin durumu, doğrulama, paylaşılabilir bağlantı kodlaması (`#d=…`)
- `easy.js` — **Kolay mod**: tür/bütçe/renk/ışık seçimlerinden tüm teknik ayrıntıları (pleksi kalınlığı, derinlik, LED markası, zemin, sabitleme…) otomatik üretir; “Bana öner” soruları
- `model.js` — şartname satırları, fiyat etkisi seviyesi, bütçe ipuçları, WhatsApp/metin çıktıları
- `render.js` — SVG önizleme motoru (gündüz/gece, parlama, dokular, otomatik satır yerleşimi)
- `ui.js`, `app.js` — adımlar, notlar, olaylar, erişilebilirlik
- `share.js` — PNG şartname kartı, panoya kopyalama

**İki mod vardır:** *Kolay mod* (varsayılan) teknik bilgisi olmayanlar içindir — 3 soruyla tabela türü önerilir (ışıklı harf, ışıklı oyma yazı/dekupe, germe, krom, kabartma harf, totem, kapı tabelası); kullanıcı yalnızca ölçü, yazı, bütçe (Ekonomik/Dengeli/Gösterişli), renk ve ışık seçer. *Detaylı mod* tüm malzeme ayrıntılarını tek tek ayarlatır. İki mod arasında istenildiği an geçiş yapılır. Bağlantılar: `?tur=isikli_harf|dekupe|germe|krom|kabartma|totem|kapi`, `?mod=detayli|kolay`.

Ürünler: cephe tabelası, totem, kapı/ofis tabelası, germe tabela.  
Harf sistemleri: ışıklı / ışıksız kutu harf, krom harf (fileli/filesiz/tam krom), kabartma düz harf, dekupe, lazer kesim metal harf, baskı/folyo.  
**Küçük yazılar:** kutu harf / krom harf tasarımlarında harf yüksekliği 10 cm’nin altındaki satırlar (slogan, telefon vb.) otomatik olarak **dekupe** (panelden oyma, ışıklıysa arkadan LED) çizilir; önizlemede etiketle gösterilir, şartnameye yazılır. Detaylı modda yöntem (dekupe / kabartma / folyo / hepsi kutu harf) ve dekupe arkası değiştirilebilir. Sınır `SMALL_TEXT_CM` ile `src/data/catalog.mjs` içinde ayarlanır.  
Her seçenek grubunda **not alanı**, **fiyat etkisi etiketi** ve “**en uygun seçenek**” ipucu bulunur; fiyat rakamı gösterilmez.

Şartname: WhatsApp (`wa.me/905315209001`), PNG, yazdır/PDF, metin kopyala, bağlantı kopyala. Veriler yalnızca tarayıcıda tutulur.

## SEO ve yapay zekâ görünürlüğü (GEO)

Kodla yapılanlar:

- Her sayfada tekil `title`/`description`, `canonical`, Open Graph/Twitter, `lang="tr"`
- JSON-LD: `LocalBusiness` (+ hizmet kataloğu), `Service`, `FAQPage`, `Article`, `BreadcrumbList`, `WebApplication`, `HowTo`
- Her hizmet/rehber sayfasında “Kısaca” özeti, olgu tablosu ve SSS (yapay zekâ alıntılarına uygun)
- `sitemap.xml`, `robots.txt` (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, Applebot vb. açıkça izinli), `llms.txt`, `llms-full.txt`
- Çok hızlı yükleme (Core Web Vitals), erişilebilir ve mobil uyumlu arayüz, kendi barındırdığımız yazı tipleri

**Sizin yapmanız gerekenler (kodla yapılamaz, en çok etkili olanlar):**

1. **Google İşletme Profili** oluşturun/doğrulayın: ad, adres (Sebze Bahçeleri Cad. No: 107/22 İskitler, Altındağ/Ankara) ve telefon **siteyle birebir aynı** olsun; kategori “Tabela imalatçısı / Reklam ajansı”; fotoğraf ve ürün/hizmet ekleyin; müşterilerden yorum isteyin.
2. **Google Search Console** ve **Bing Webmaster**’a siteyi ekleyin, `sitemap.xml` gönderin. Doğrulama kodunu `src/site.config.mjs` içine yazıp yeniden derleyin.
3. Bing Places, Yandex Haritalar, Apple Haritalar, Yandex İşletme ve yerel firma rehberlerine **aynı bilgilerle** kaydolun (NAP tutarlılığı).
4. Tamamlanan işlerin fotoğraflarını (önce/sonra, gece görünümü) Google profiline ve ileride siteye ekleyin.
5. Alan adını edinip `siteUrl`’i güncelleyin (yukarıya bakın).
6. İsterseniz `gaId` alanına Google Analytics kimliği girin (boşsa hiçbir üçüncü taraf betik yüklenmez).

## Mobilde test etme

1. **En kolayı — yayındaki adres:** GitHub Pages açıldıktan sonra `https://ac2f.github.io/iyireklam/` adresini telefonda açın (kamera ile QR okutmak için adresi bir QR üretici sitesine yapıştırabilirsiniz). Her `master` güncellemesinden 1–2 dakika sonra yeni sürüm görünür; eski görünüm kalırsa sayfayı yenileyin.
2. **Bilgisayardan canlı önizleme:** `npm install && npm run serve` komutu hem `http://localhost:4173` hem de `http://192.168.x.x:4173` gibi bir *telefon adresi* yazar. Telefon ve bilgisayar **aynı Wi-Fi ağındaysa** bu adresi telefonda açın (bilgisayar güvenlik duvarı gelen bağlantıyı engelliyorsa 4173 portuna izin verin).
3. **Telefonsuz hızlı kontrol:** Chrome/Edge’de siteyi açıp `F12` → `Ctrl+Shift+M` (cihaz çubuğu) → iPhone/Pixel seçin; **Fast 4G** ağ kısıtlamasıyla hız, **Lighthouse → Mobile** ile puan ölçün. Safari’de *Geliştir → Duyarlı Tasarım Modu*.
4. **Gerçek cihazda hata ayıklama:** Android: Chrome’da `chrome://inspect`; iPhone: iPhone *Ayarlar → Safari → Gelişmiş → Web Inspector*, Mac Safari’de *Geliştir → (iPhone adı)*.

**Telefonda mutlaka deneyin:** sihirbazda Kolay mod → 3 soru → tür → ölçü/yazı → görünüm → şartname; Gündüz/Gece anahtarı; “Büyüt”; yazı yazarken klavyenin önizlemeyi kapatmaması; “WhatsApp ile gönder” (WhatsApp açılmalı); “Görseli paylaş” (paylaşım menüsü); yatay/dikey döndürme; menü, “Ara” ve “WhatsApp” düğmeleri.

## Test

```bash
npm test
```

- `scripts/build.mjs` — derleme
- `tests/check-site.mjs` — kırık bağlantı, yinelenen id, SEO etiketleri, JSON-LD, sitemap/llms tutarlılığı, içerik derinliği
- `tests/e2e.mjs` — Playwright/Chromium: tüm sayfalar (masaüstü + mobil), alt yol yayını, her ürün ve her seçeneğin denenmesi (gündüz/gece), paylaşım bağlantısı geri yükleme, bozuk veri, WhatsApp/PNG/yazdırma, erişilebilirlik

`tests/e2e.mjs` için Playwright gerekir: `npm i --no-save playwright && npx playwright install chromium`.

## Yazı tipleri ve lisans

Yazı tipleri (Inter, Cormorant Garamond, Montserrat, Playfair Display, Oswald, Nunito, Dancing Script) SIL Open Font License 1.1 kapsamındadır; Türkçe karakterlere göre altkümelenip `assets/fonts/` altında barındırılır (`scripts/make-fonts.py`).
