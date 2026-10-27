// Tek yerden yönetilen site bilgileri. Alan adı değişirse sadece `siteUrl` güncellenir
// (veya derleme sırasında SITE_URL ortam değişkeni verilir) ve `npm run build` çalıştırılır.

export default {
  brand: 'İyi Reklam',
  brandFull: 'İyi Reklam Tabela & CNC Atölyesi',
  tagline: 'Ankara tabela imalatı, kutu harf, CNC router ve lazer kesim',
  // Alan adı alınınca bunu değiştirin (örn. https://www.alanadiniz.com)
  siteUrl: (process.env.SITE_URL || 'https://ac2f.github.io/iyireklam').replace(/\/+$/, ''),
  lang: 'tr',
  locale: 'tr_TR',

  phone: '+905315209001',
  phoneDisplay: '0531 520 90 01',
  phoneHtml: '0531&nbsp;520&nbsp;90&nbsp;01',
  whatsapp: '905315209001',

  address: {
    street: 'Sebze Bahçeleri Caddesi No: 107/22',
    neighborhood: 'İskitler',
    district: 'Altındağ',
    city: 'Ankara',
    country: 'TR',
  },

  experienceYears: '20 yılı aşkın',

  // İsteğe bağlı entegrasyonlar (boş bırakılırsa hiçbir üçüncü taraf kod yüklenmez)
  gaId: '', // örn. G-XXXXXXXXXX
  googleSiteVerification: '',
  bingSiteVerification: '',
  yandexVerification: '',

  themeColor: '#0e1116',
};
