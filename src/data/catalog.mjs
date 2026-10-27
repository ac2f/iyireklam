// Tabela sihirbazı ve içerik sayfalarının ortak katalog verisi.
//
// NOT: Renk değerleri (hex) ekran üzerinde yaklaşık gösterim içindir. Kesin renk,
// üreticinin güncel kartelasından atölyede teyit edilir. Yeni renk/kalınlık eklemek için
// ilgili listeye bir satır eklemek yeterlidir; sihirbaz ve şartname otomatik güncellenir.

/** Fiyat etkisi seviyeleri: 0 = en uygun ... 3 = belirgin artış */
export const COST_LEVELS = [
  { id: 0, label: 'En uygun', cls: 'c0' },
  { id: 1, label: 'Hafif fark', cls: 'c1' },
  { id: 2, label: 'Fiyatı artırır', cls: 'c2' },
  { id: 3, label: 'Fiyatı belirgin artırır', cls: 'c3' },
];

// ---------------------------------------------------------------------------
// Kalınlıklar (mm)
// ---------------------------------------------------------------------------
export const THICKNESS = {
  // Akpolimer pleksi kalınlıkları
  pleksi: [
    { v: 2.8, cost: 0 }, { v: 4.5, cost: 1 }, { v: 5.8, cost: 1 }, { v: 7.8, cost: 2 },
    { v: 9.8, cost: 2 }, { v: 12, cost: 3 }, { v: 14, cost: 3 }, { v: 18, cost: 3 },
  ],
  // Düz dekota
  dekota: [
    { v: 4.5, cost: 0 }, { v: 7, cost: 1 }, { v: 8, cost: 1 }, { v: 10, cost: 2 },
    { v: 14, cost: 2 }, { v: 18, cost: 3 },
  ],
  // Aynalı dekota (gümüş / gold)
  aynali: [
    { v: 4, cost: 0 }, { v: 8, cost: 1 }, { v: 13, cost: 2 }, { v: 18, cost: 3 },
  ],
  // Alüminyum kompozit panel
  kompozit: [
    { v: 3, cost: 0 }, { v: 4, cost: 1 },
  ],
  // Lazer kesim metal levha
  metal: [
    { v: 2, cost: 0 }, { v: 3, cost: 1 }, { v: 4, cost: 2 }, { v: 5, cost: 3 },
  ],
};

/** Kutu harf yan yüzey derinliği (cm) */
export const DEPTHS = [
  { v: 6, cost: 0 }, { v: 7, cost: 1 }, { v: 8, cost: 1 }, { v: 10, cost: 2 },
];

// ---------------------------------------------------------------------------
// Renk paletleri
// ---------------------------------------------------------------------------

/** Akpolimer pleksi paleti (ekran renkleri yaklaşıktır) */
export const PLEXI_COLORS = [
  { id: 'opal', name: 'Opal Beyaz', hex: '#f5f4ef', grp: 'Beyaz & Şeffaf', lit: true },
  { id: 'sutbeyaz', name: 'Süt Beyazı (Opak)', hex: '#fafaf7', grp: 'Beyaz & Şeffaf' },
  { id: 'raki', name: 'Rakı Beyazı', hex: '#ecebe4', grp: 'Beyaz & Şeffaf', lit: true },
  { id: 'buzlu', name: 'Buzlu', hex: '#e3ecef', grp: 'Beyaz & Şeffaf', lit: true },
  { id: 'seffaf', name: 'Şeffaf', hex: '#d6e6ee', grp: 'Beyaz & Şeffaf', clear: true },
  { id: 'siyah', name: 'Siyah', hex: '#14161a', grp: 'Siyah & Gri' },
  { id: 'antrasit', name: 'Antrasit', hex: '#3a3e45', grp: 'Siyah & Gri' },
  { id: 'gri', name: 'Gri', hex: '#8b9097', grp: 'Siyah & Gri' },
  { id: 'fume', name: 'Füme', hex: '#52565c', grp: 'Siyah & Gri', clear: true },
  { id: 'kirmizi', name: 'Kırmızı', hex: '#d3202a', grp: 'Sıcak Tonlar' },
  { id: 'bordo', name: 'Bordo', hex: '#7b1226', grp: 'Sıcak Tonlar' },
  { id: 'turuncu', name: 'Turuncu', hex: '#f26a1b', grp: 'Sıcak Tonlar' },
  { id: 'amber', name: 'Amber', hex: '#f0a92b', grp: 'Sıcak Tonlar' },
  { id: 'sari', name: 'Sarı', hex: '#f6d216', grp: 'Sıcak Tonlar' },
  { id: 'limon', name: 'Limon Sarısı', hex: '#e7e43c', grp: 'Sıcak Tonlar' },
  { id: 'pembe', name: 'Pembe', hex: '#f06fa2', grp: 'Pembe & Mor' },
  { id: 'fusya', name: 'Fuşya', hex: '#c2188a', grp: 'Pembe & Mor' },
  { id: 'mor', name: 'Mor', hex: '#6b2f93', grp: 'Pembe & Mor' },
  { id: 'lila', name: 'Lila', hex: '#a58bd0', grp: 'Pembe & Mor' },
  { id: 'fistik', name: 'Fıstık Yeşili', hex: '#8dc63f', grp: 'Yeşil & Mavi' },
  { id: 'yesil', name: 'Yeşil', hex: '#1f9d55', grp: 'Yeşil & Mavi' },
  { id: 'kyesil', name: 'Koyu Yeşil', hex: '#0f5b3a', grp: 'Yeşil & Mavi' },
  { id: 'turkuaz', name: 'Turkuaz', hex: '#17b7c4', grp: 'Yeşil & Mavi' },
  { id: 'acikmavi', name: 'Açık Mavi', hex: '#5ec0ec', grp: 'Yeşil & Mavi' },
  { id: 'mavi', name: 'Mavi', hex: '#1c6fd1', grp: 'Yeşil & Mavi' },
  { id: 'royal', name: 'Royal Mavi', hex: '#1647b8', grp: 'Yeşil & Mavi' },
  { id: 'lacivert', name: 'Lacivert', hex: '#14275c', grp: 'Yeşil & Mavi' },
  { id: 'krem', name: 'Bej / Krem', hex: '#e6d3a8', grp: 'Toprak Tonları' },
  { id: 'kahve', name: 'Kahverengi', hex: '#6a4129', grp: 'Toprak Tonları' },
  { id: 'bronz', name: 'Bronz', hex: '#9a6a35', grp: 'Toprak Tonları' },
  { id: 'ayna-gumus', name: 'Ayna Gümüş', hex: '#cfd5db', grp: 'Aynalı', mirror: 'silver' },
  { id: 'ayna-altin', name: 'Ayna Altın', hex: '#d8b457', grp: 'Aynalı', mirror: 'gold' },
];

/** Sistem marka alüminyum kompozit paleti (ekran renkleri yaklaşıktır) */
export const COMPOSITE_COLORS = [
  // Düz renkler
  { id: 'k-beyaz', name: 'Parlak Beyaz', hex: '#f6f6f3', grp: 'Düz Renkler' },
  { id: 'k-matbeyaz', name: 'Mat Beyaz', hex: '#ededea', grp: 'Düz Renkler' },
  { id: 'k-krem', name: 'Krem', hex: '#e8dcc0', grp: 'Düz Renkler' },
  { id: 'k-bej', name: 'Bej', hex: '#cbb892', grp: 'Düz Renkler' },
  { id: 'k-acikgri', name: 'Açık Gri', hex: '#c4c7cb', grp: 'Düz Renkler' },
  { id: 'k-gri', name: 'Gri', hex: '#8b9096', grp: 'Düz Renkler' },
  { id: 'k-antrasit', name: 'Antrasit', hex: '#383d44', grp: 'Düz Renkler' },
  { id: 'k-siyah', name: 'Parlak Siyah', hex: '#15171b', grp: 'Düz Renkler' },
  { id: 'k-matsiyah', name: 'Mat Siyah', hex: '#202226', grp: 'Düz Renkler' },
  { id: 'k-kirmizi', name: 'Kırmızı', hex: '#c8202b', grp: 'Düz Renkler' },
  { id: 'k-bordo', name: 'Bordo', hex: '#6f1a2c', grp: 'Düz Renkler' },
  { id: 'k-turuncu', name: 'Turuncu', hex: '#ee6a1c', grp: 'Düz Renkler' },
  { id: 'k-sari', name: 'Sarı', hex: '#f1c40f', grp: 'Düz Renkler' },
  { id: 'k-yesil', name: 'Yeşil', hex: '#2a8a4f', grp: 'Düz Renkler' },
  { id: 'k-kyesil', name: 'Koyu Yeşil', hex: '#16422f', grp: 'Düz Renkler' },
  { id: 'k-turkuaz', name: 'Turkuaz', hex: '#1ba3b2', grp: 'Düz Renkler' },
  { id: 'k-mavi', name: 'Mavi', hex: '#1f6cc4', grp: 'Düz Renkler' },
  { id: 'k-lacivert', name: 'Lacivert', hex: '#16295e', grp: 'Düz Renkler' },
  { id: 'k-mor', name: 'Mor', hex: '#5b2a86', grp: 'Düz Renkler' },
  { id: 'k-pembe', name: 'Pembe', hex: '#e1679b', grp: 'Düz Renkler' },
  { id: 'k-kahve', name: 'Kahverengi', hex: '#5c3a26', grp: 'Düz Renkler' },
  // Metalik
  { id: 'k-gumusmet', name: 'Gümüş Metalik', hex: '#b9bec4', grp: 'Metalik', pat: 'metal' },
  { id: 'k-sampanya', name: 'Şampanya', hex: '#d8c7a1', grp: 'Metalik', pat: 'metal' },
  { id: 'k-bronzmet', name: 'Bronz Metalik', hex: '#8a6b45', grp: 'Metalik', pat: 'metal' },
  { id: 'k-bakir', name: 'Bakır', hex: '#b4693f', grp: 'Metalik', pat: 'metal' },
  { id: 'k-titan', name: 'Titanyum Gri', hex: '#6d737b', grp: 'Metalik', pat: 'metal' },
  { id: 'k-goldmet', name: 'Gold Metalik', hex: '#c9a24b', grp: 'Metalik', pat: 'metal' },
  // Aynalı & Fırçalı
  { id: 'k-ayna-gumus', name: 'Aynalı Gümüş', hex: '#cdd2d8', grp: 'Aynalı & Fırçalı', mirror: 'silver' },
  { id: 'k-ayna-gold', name: 'Aynalı Gold', hex: '#d7b255', grp: 'Aynalı & Fırçalı', mirror: 'gold' },
  { id: 'k-firca-gumus', name: 'Fırçalı Gümüş', hex: '#bfc4ca', grp: 'Aynalı & Fırçalı', pat: 'brushed' },
  { id: 'k-firca-gold', name: 'Fırçalı Gold', hex: '#c8a85a', grp: 'Aynalı & Fırçalı', pat: 'brushed' },
  // Ahşap desenler
  { id: 'k-mese', name: 'Meşe', hex: '#b98a55', hex2: '#8d6236', grp: 'Ahşap Desenler', pat: 'wood' },
  { id: 'k-acikmese', name: 'Açık Meşe', hex: '#d4b384', hex2: '#a98255', grp: 'Ahşap Desenler', pat: 'wood' },
  { id: 'k-ceviz', name: 'Ceviz', hex: '#7a4e32', hex2: '#4f2f1c', grp: 'Ahşap Desenler', pat: 'wood' },
  { id: 'k-venge', name: 'Venge', hex: '#3e2c24', hex2: '#241812', grp: 'Ahşap Desenler', pat: 'wood' },
  { id: 'k-maun', name: 'Maun', hex: '#8a3f2a', hex2: '#5d2417', grp: 'Ahşap Desenler', pat: 'wood' },
  { id: 'k-kiraz', name: 'Kiraz', hex: '#a95a38', hex2: '#7a3a20', grp: 'Ahşap Desenler', pat: 'wood' },
  { id: 'k-tik', name: 'Tik', hex: '#a37a45', hex2: '#76532a', grp: 'Ahşap Desenler', pat: 'wood' },
  { id: 'k-grisahsap', name: 'Gri Ahşap', hex: '#9c9890', hex2: '#76726a', grp: 'Ahşap Desenler', pat: 'wood' },
  { id: 'k-beyazahsap', name: 'Beyaz Ahşap', hex: '#e2d9c8', hex2: '#bdb29c', grp: 'Ahşap Desenler', pat: 'wood' },
  // Taş & Mermer
  { id: 'k-beyazmermer', name: 'Beyaz Mermer', hex: '#eeeeec', hex2: '#a9acb2', grp: 'Taş & Mermer', pat: 'marble' },
  { id: 'k-siyahmermer', name: 'Siyah Mermer', hex: '#1d1f23', hex2: '#d8d4c8', grp: 'Taş & Mermer', pat: 'marble' },
  { id: 'k-granit', name: 'Granit Gri', hex: '#7e8187', hex2: '#3e4147', grp: 'Taş & Mermer', pat: 'stone' },
  { id: 'k-beton', name: 'Beton Gri', hex: '#a3a5a6', hex2: '#6d7072', grp: 'Taş & Mermer', pat: 'stone' },
  { id: 'k-traverten', name: 'Traverten', hex: '#d9c8a4', hex2: '#b39f78', grp: 'Taş & Mermer', pat: 'stone' },
];

/** Düz dekota renkleri */
export const DEKOTA_COLORS = [
  { id: 'd-beyaz', name: 'Beyaz', hex: '#f4f4f1' },
  { id: 'd-krem', name: 'Krem', hex: '#e9deba' },
  { id: 'd-siyah', name: 'Siyah', hex: '#17181c' },
  { id: 'd-gri', name: 'Gri', hex: '#8d9298' },
  { id: 'd-antrasit', name: 'Antrasit', hex: '#3c4047' },
  { id: 'd-kirmizi', name: 'Kırmızı', hex: '#cf2430' },
  { id: 'd-bordo', name: 'Bordo', hex: '#7a1a2d' },
  { id: 'd-turuncu', name: 'Turuncu', hex: '#f06c1d' },
  { id: 'd-sari', name: 'Sarı', hex: '#f4cc16' },
  { id: 'd-yesil', name: 'Yeşil', hex: '#2b9556' },
  { id: 'd-mavi', name: 'Mavi', hex: '#2169c9' },
  { id: 'd-lacivert', name: 'Lacivert', hex: '#17295f' },
];

/** Aynalı dekota (yalnızca iki renk) */
export const MIRROR_DEKOTA_COLORS = [
  { id: 'ad-gumus', name: 'Gümüş', hex: '#cfd4da', mirror: 'silver' },
  { id: 'ad-gold', name: 'Gold', hex: '#d8b457', mirror: 'gold' },
];

/** Folyo / baskı harf renkleri */
export const FOIL_COLORS = [
  { id: 'f-beyaz', name: 'Beyaz', hex: '#f6f6f3' },
  { id: 'f-siyah', name: 'Siyah', hex: '#16171b' },
  { id: 'f-antrasit', name: 'Antrasit', hex: '#3b3f46' },
  { id: 'f-kirmizi', name: 'Kırmızı', hex: '#d2222d' },
  { id: 'f-turuncu', name: 'Turuncu', hex: '#f26b1d' },
  { id: 'f-sari', name: 'Sarı', hex: '#f6d216' },
  { id: 'f-yesil', name: 'Yeşil', hex: '#219e57' },
  { id: 'f-mavi', name: 'Mavi', hex: '#1f6fd1' },
  { id: 'f-lacivert', name: 'Lacivert', hex: '#16285e' },
  { id: 'f-gumus', name: 'Gümüş Folyo', hex: '#cfd4da', mirror: 'silver' },
  { id: 'f-altin', name: 'Altın Folyo', hex: '#d8b457', mirror: 'gold' },
];

/** Germe tabela kumaş zemin renkleri (baskı arka planı) */
export const GERME_COLORS = [
  { id: 'g-beyaz', name: 'Beyaz', hex: '#f7f7f4', ink: '#14161a' },
  { id: 'g-siyah', name: 'Siyah', hex: '#15171b', ink: '#ffffff' },
  { id: 'g-kirmizi', name: 'Kırmızı', hex: '#d2222d', ink: '#ffffff' },
  { id: 'g-turuncu', name: 'Turuncu', hex: '#f26b1d', ink: '#ffffff' },
  { id: 'g-sari', name: 'Sarı', hex: '#f6d216', ink: '#14161a' },
  { id: 'g-yesil', name: 'Yeşil', hex: '#219e57', ink: '#ffffff' },
  { id: 'g-turkuaz', name: 'Turkuaz', hex: '#17b7c4', ink: '#ffffff' },
  { id: 'g-mavi', name: 'Mavi', hex: '#1f6fd1', ink: '#ffffff' },
  { id: 'g-lacivert', name: 'Lacivert', hex: '#16285e', ink: '#ffffff' },
  { id: 'g-bordo', name: 'Bordo', hex: '#7b1226', ink: '#ffffff' },
  { id: 'g-gri', name: 'Gri', hex: '#8b9097', ink: '#ffffff' },
  { id: 'g-krem', name: 'Krem', hex: '#eadfc2', ink: '#2a2118' },
];

export const GERME_INK = [
  { id: 'auto', name: 'Otomatik (zıt renk)', hex: null },
  { id: 'i-beyaz', name: 'Beyaz', hex: '#ffffff' },
  { id: 'i-siyah', name: 'Siyah', hex: '#14161a' },
  { id: 'i-sari', name: 'Sarı', hex: '#f6d216' },
  { id: 'i-kirmizi', name: 'Kırmızı', hex: '#d2222d' },
  { id: 'i-lacivert', name: 'Lacivert', hex: '#16285e' },
];

// ---------------------------------------------------------------------------
// Yan yüzey (bant) renkleri, krom, LED
// ---------------------------------------------------------------------------
export const SIDE_COLORS = [
  { id: 'antrasit', name: 'Antrasit', hex: '#3a3e45', cost: 0 },
  { id: 'siyah', name: 'Siyah', hex: '#15171b', cost: 0 },
  { id: 'beyaz', name: 'Beyaz', hex: '#f4f4f1', cost: 0 },
  { id: 'altin', name: 'Altın', hex: '#d1a640', cost: 1, metal: 'gold' },
  { id: 'gumus', name: 'Gümüş', hex: '#c3c8ce', cost: 1, metal: 'silver' },
];

export const KROM_SIDES = [
  { id: 'gumus', name: 'Gümüş (parlak krom)', hex: '#c9ced4', cost: 0, metal: 'silver' },
  { id: 'altin', name: 'Altın (gold krom)', hex: '#d8b04a', cost: 1, metal: 'gold' },
];

export const LED_BRANDS = [
  { id: 'standart', name: 'Standart LED', desc: 'Atölye standardı LED modül', cost: 0 },
  { id: 'epistar', name: 'Epistar', desc: 'Epistar çipli LED modül', cost: 1 },
  { id: 'samsung', name: 'Samsung', desc: 'Samsung çipli LED modül', cost: 2 },
];

export const LED_COLORS = [
  { id: 'beyaz', name: 'Beyaz (soğuk)', hex: '#f3f8ff', glow: '#cfe4ff' },
  { id: 'gunisigi', name: 'Günışığı (sıcak)', hex: '#fff0c7', glow: '#ffd27d' },
  { id: 'amber', name: 'Amber', hex: '#ffbf4d', glow: '#ff9d1c' },
  { id: 'kirmizi', name: 'Kırmızı', hex: '#ff4d4d', glow: '#ff2a2a' },
  { id: 'mavi', name: 'Mavi', hex: '#4d8dff', glow: '#2a6dff' },
  { id: 'yesil', name: 'Yeşil', hex: '#4dff8a', glow: '#1fe86a' },
];

export const FRAME_COLORS = [
  { id: 'beyaz', name: 'Beyaz', hex: '#f1f1ee', cost: 0 },
  { id: 'antrasit', name: 'Antrasit', hex: '#3a3e45', cost: 0 },
  { id: 'siyah', name: 'Siyah', hex: '#17181c', cost: 0 },
  { id: 'eloksal', name: 'Eloksal (Gümüş)', hex: '#c3c8ce', cost: 1 },
];

// ---------------------------------------------------------------------------
// Yazı tipleri (önizleme + şartname)
// ---------------------------------------------------------------------------
export const FONTS = [
  { id: 'montserrat', file: 'montserrat-700', name: 'Modern Sans', family: 'Montserrat', stack: "'Montserrat', 'Segoe UI', Arial, sans-serif", weight: 700, sample: 'Aa' },
  { id: 'oswald', file: 'oswald-600', name: 'Dar & Güçlü', family: 'Oswald', stack: "'Oswald', 'Arial Narrow', Impact, sans-serif", weight: 600, sample: 'Aa' },
  { id: 'nunito', file: 'nunito-800', name: 'Yuvarlak', family: 'Nunito', stack: "'Nunito', 'Trebuchet MS', Arial, sans-serif", weight: 800, sample: 'Aa' },
  { id: 'playfair', file: 'playfair-700', name: 'Klasik Serif', family: 'Playfair Display', stack: "'Playfair Display', Georgia, 'Times New Roman', serif", weight: 700, sample: 'Aa' },
  { id: 'cormorant', file: 'cormorant-600', name: 'İnce Serif', family: 'Cormorant Garamond', stack: "'Cormorant Garamond', Georgia, serif", weight: 600, sample: 'Aa' },
  { id: 'dancing', file: 'dancing-700', name: 'El Yazısı', family: 'Dancing Script', stack: "'Dancing Script', 'Brush Script MT', cursive", weight: 700, sample: 'Aa' },
];

// ---------------------------------------------------------------------------
// Ürünler ve harf sistemleri
// ---------------------------------------------------------------------------
export const PRODUCTS = [
  {
    id: 'cephe',
    name: 'Cephe Tabelası',
    desc: 'Dükkan, işyeri ve bina cepheleri için yatay tabela',
    size: { w: [30, 1500, 300], h: [10, 500, 80] },
    presets: [[200, 60], [300, 80], [400, 100], [600, 120]],
    zemin: 'optional',
    strategies: ['kutu_isikli', 'kutu_isiksiz', 'krom', 'kabartma', 'dekupe', 'lazer', 'baski'],
    defaultStrategy: 'kutu_isikli',
    maxLines: 3,
  },
  {
    id: 'totem',
    name: 'Totem Tabela',
    desc: 'Yol kenarı, site ve iş merkezi girişleri için dikey tabela',
    size: { w: [40, 400, 100], h: [100, 1000, 300] },
    presets: [[80, 250], [100, 300], [120, 400], [150, 500]],
    zemin: 'required',
    strategies: ['kutu_isikli', 'kutu_isiksiz', 'krom', 'kabartma', 'dekupe', 'lazer', 'baski'],
    defaultStrategy: 'kutu_isikli',
    maxLines: 4,
  },
  {
    id: 'kapi',
    name: 'Kapı & Ofis Tabelası',
    desc: 'Kapı, oda, ofis, muayenehane ve plaza tabelaları',
    size: { w: [8, 150, 30], h: [5, 100, 20] },
    presets: [[20, 10], [30, 20], [40, 30], [60, 20]],
    zemin: 'required',
    strategies: ['kabartma', 'dekupe', 'lazer', 'krom', 'baski'],
    defaultStrategy: 'kabartma',
    maxLines: 3,
  },
  {
    id: 'germe',
    name: 'Germe Tabela',
    desc: 'Alüminyum çerçeveli, baskılı kumaş yüzeyli ışıklı kutu tabela',
    size: { w: [30, 1000, 200], h: [20, 500, 80] },
    presets: [[150, 50], [200, 80], [300, 100], [100, 200]],
    zemin: 'none',
    strategies: ['baski'],
    defaultStrategy: 'baski',
    maxLines: 3,
  },
];

export const STRATEGIES = {
  kutu_isikli: {
    id: 'kutu_isikli',
    name: 'Işıklı Pleksi Kutu Harf',
    short: 'Işıklı kutu harf',
    desc: 'Ön yüzü pleksi, içi LED aydınlatmalı kutu harf. Gece gündüz en çok öne çıkan klasik çözüm.',
    cost: 2,
    lit: true,
  },
  kutu_isiksiz: {
    id: 'kutu_isiksiz',
    name: 'Işıksız Pleksi Kutu Harf',
    short: 'Işıksız kutu harf',
    desc: 'Hacimli, pleksi ön yüzlü ve yan bantlı kutu harf. LED ve trafo maliyeti yok.',
    cost: 1,
  },
  krom: {
    id: 'krom',
    name: 'Krom Kutu Harf (Fileli / Filesiz)',
    short: 'Krom kutu harf',
    desc: 'Gümüş veya altın krom yan yüzeyli prestijli harf. Fileli modelde pleksi ön yüzün çevresinde ince krom çizgi bulunur.',
    cost: 3,
  },
  kabartma: {
    id: 'kabartma',
    name: 'Kabartma Düz Harf (Işıksız, Yapıştırma)',
    short: 'Kabartma düz harf',
    desc: 'Pleksi, dekota, aynalı dekota veya kompozitten CNC ile kesilip zemine yapıştırılan ışıksız harfler.',
    cost: 0,
  },
  dekupe: {
    id: 'dekupe',
    name: 'Dekupe (Zeminden Kesim)',
    short: 'Dekupe',
    desc: 'Harfler zeminin kendisinden CNC ile oyularak çıkarılır. İsterseniz arkaya renkli pleksi veya LED eklenir.',
    cost: 1,
  },
  lazer: {
    id: 'lazer',
    name: 'Lazer Kesim Metal Harf',
    short: 'Lazer kesim metal harf',
    desc: 'Paslanmaz çelik, alüminyum veya sacdan hassas lazer kesim harf ve logo.',
    cost: 2,
  },
  baski: {
    id: 'baski',
    name: 'Dijital Baskı / Folyo Uygulama',
    short: 'Baskı / folyo',
    desc: 'Harfler kesim folyo veya dijital baskı ile yüzeye uygulanır. Hacim yoktur, en ekonomik yöntemdir.',
    cost: 0,
  },
};

export const ZEMIN_MATERIALS = [
  {
    id: 'kompozit', name: 'Alüminyum Kompozit', brand: 'Sistem', thick: 'kompozit', palette: 'composite',
    desc: 'Dayanıklı, düz ve hafif; düz renk, metalik, aynalı, fırçalı, ahşap ve taş desen seçenekleri.', cost: 1,
  },
  {
    id: 'dekota', name: 'Dekota', thick: 'dekota', palette: 'dekota',
    desc: 'Hafif ve kolay işlenen levha; iç mekân ve ekonomik çözümler için.', cost: 0,
  },
  {
    id: 'aynali', name: 'Aynalı Dekota', thick: 'aynali', palette: 'mirrorDekota',
    desc: 'Gümüş veya gold aynalı yüzey; gösterişli iç mekân ve ofis tabelaları.', cost: 2,
  },
  {
    id: 'pleksi', name: 'Pleksi', brand: 'Akpolimer', thick: 'pleksi', palette: 'plexi',
    desc: 'Akpolimer pleksi paleti ile her renkte zemin; kapı ve iç mekân tabelaları için şık.', cost: 2,
  },
];

export const CORNERS = [
  { id: 'duz', name: 'Düz köşe', cost: 0 },
  { id: 'yuvarlak', name: 'Yuvarlatılmış köşe', cost: 1 },
];

export const LASER_MATERIALS = [
  { id: 'inox', name: 'Paslanmaz Çelik', cost: 2 },
  { id: 'alu', name: 'Alüminyum', cost: 1 },
  { id: 'sac', name: 'Sac (boyalı)', cost: 0 },
];

export const LASER_FINISH = [
  { id: 'firca', name: 'Fırçalı Gümüş', hex: '#b9bec4', pat: 'brushed' },
  { id: 'ayna', name: 'Ayna Parlak', hex: '#d3d8de', mirror: 'silver' },
  { id: 'altin', name: 'Altın Kaplama', hex: '#d8b04a', mirror: 'gold' },
  { id: 'siyah', name: 'Siyah Boya', hex: '#17181c' },
  { id: 'antrasit', name: 'Antrasit Boya', hex: '#3a3e45' },
  { id: 'beyaz', name: 'Beyaz Boya', hex: '#f4f4f1' },
];

export const FIX_TYPES = [
  { id: 'distans', name: 'Distanslı vida (paslanmaz)', desc: 'Panel duvardan hafif açık, şık görünür.', cost: 1 },
  { id: 'bant', name: 'Güçlü çift taraflı bant', desc: 'Delik açmadan, düz yüzeylere pratik uygulama.', cost: 0 },
  { id: 'gizli', name: 'Gizli montaj', desc: 'Vida görünmez, temiz görünüm.', cost: 2 },
];

export const SERVICE_OPTIONS = [
  { id: 'montaj', name: 'Ankara içi montaj istiyorum', desc: 'Üretim ve montaj tek elden.', cost: 1 },
  { id: 'atolye', name: 'Atölyeden teslim alacağım', desc: 'İskitler atölyemizden teslim.', cost: 0 },
  { id: 'sevkiyat', name: 'Sevkiyat / kargo', desc: 'Sevkiyat seçeneklerini birlikte planlarız.', cost: 1 },
];

// ---------------------------------------------------------------------------
// Yardımcılar (hem derleyici hem tarayıcı kullanır)
// ---------------------------------------------------------------------------
export const PALETTES = {
  plexi: PLEXI_COLORS,
  composite: COMPOSITE_COLORS,
  dekota: DEKOTA_COLORS,
  mirrorDekota: MIRROR_DEKOTA_COLORS,
  foil: FOIL_COLORS,
};

export function fmtMm(v) {
  return String(v).replace('.', ',') + ' mm';
}

export function byId(list, id) {
  return list.find((x) => x.id === id) || list[0];
}

export const PLEXI_THICKNESS_NOTE =
  'Pleksi kalınlığı arttıkça malzeme ve işçilik maliyeti hızla yükselir. Kutu harf ön yüzü için en uygun seçenek 2,8 mm\'dir.';

/** Hazır başlangıç şablonları: sihirbazın ilk adımında tek tıkla uygulanır */
export const PRESETS = [
  {
    id: 'magaza', name: 'Işıklı mağaza tabelası', desc: 'Antrasit zemin, ışıklı pleksi kutu harf',
    patch: { p: 'cephe', w: 300, h: 80, zc: 'k-antrasit', s: 'kutu_isikli', o: { pc: 'opal', pt: 2.8, side: 'solid', sc: 'antrasit', dp: 6, lb: 'standart', lc: 'beyaz' }, L: [{ t: 'MAĞAZA ADI', s: 'L' }, { t: 'Slogan veya alt başlık', s: 'M' }] },
  },
  {
    id: 'kuyumcu', name: 'Altın yanlı krom harf', desc: 'Siyah zemin, fileli krom, sıcak ışık',
    patch: { p: 'cephe', w: 250, h: 70, zc: 'k-siyah', s: 'krom', o: { kt: 'fileli', ks: 'altin', kl: 1, pc: 'bordo', pt: 2.8, dp: 6, lb: 'standart', lc: 'gunisigi' }, L: [{ t: 'KUYUMCU', s: 'L' }, { t: 'Altın & Mücevher', s: 'M' }] },
  },
  {
    id: 'klinik', name: 'Klinik / ofis kapı tabelası', desc: 'Aynalı gümüş dekota, siyah kabartma harf',
    patch: { p: 'kapi', w: 40, h: 30, zm: 'aynali', zt: 4, zc: 'ad-gumus', s: 'kabartma', o: { km: 'pleksi', kk: 2.8, kr: 'siyah' }, L: [{ t: 'DR. AD SOYAD', s: 'L' }, { t: 'Uzman Doktor', s: 'M' }] },
  },
  {
    id: 'avukat', name: 'Altın plaka kapı tabelası', desc: 'Aynalı gold dekota, antrasit kabartma harf',
    patch: { p: 'kapi', w: 40, h: 30, zm: 'aynali', zt: 4, zc: 'ad-gold', cr: 'yuvarlak', s: 'kabartma', o: { km: 'dekota', kk: 4.5, kr: 'd-antrasit' }, L: [{ t: 'AV. AD SOYAD', s: 'L' }, { t: 'Hukuk Bürosu', s: 'M' }] },
  },
  {
    id: 'site', name: 'Site girişi totemi', desc: 'Antrasit kompozit gövde, ışıklı kutu harf',
    patch: { p: 'totem', w: 100, h: 300, zc: 'k-antrasit', s: 'kutu_isikli', o: { pc: 'opal', pt: 2.8, side: 'solid', sc: 'antrasit', dp: 8, lb: 'standart', lc: 'gunisigi' }, L: [{ t: 'SİTE ADI', s: 'L' }, { t: 'Yönetim Ofisi', s: 'M' }] },
  },
  {
    id: 'germe', name: 'Işıklı germe tabela', desc: 'Kırmızı zeminli, baskılı germe kumaş',
    patch: { p: 'germe', w: 300, h: 100, gc: 'g-kirmizi', fr: 'beyaz', sd: 'tek', L: [{ t: 'İŞLETME ADI', s: 'L' }, { t: 'Kısa tanıtım yazısı', s: 'M' }] },
  },
  {
    id: 'dekupe', name: 'Işıklı dekupe', desc: 'Siyah zeminden oyma harf, arkadan LED',
    patch: { p: 'cephe', w: 200, h: 60, zm: 'kompozit', zt: 4, zc: 'k-siyah', s: 'dekupe', o: { df: 'led', pc: 'opal', pt: 2.8, lb: 'standart', lc: 'gunisigi' }, L: [{ t: 'FİRMA ADI', s: 'L' }] },
  },
  {
    id: 'ahsap', name: 'Ahşap desenli cephe', desc: 'Meşe kompozit zemin, aynalı gold düz harf',
    patch: { p: 'cephe', w: 250, h: 70, zm: 'kompozit', zt: 4, zc: 'k-ceviz', s: 'kabartma', o: { km: 'aynali', kk: 8, kr: 'ad-gold' }, L: [{ t: 'KAFE ADI', s: 'L' }, { t: 'Kahve & Tatlı', s: 'M' }] },
  },
];
