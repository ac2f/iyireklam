// Hafif site betiği: mobil menü, hizmetler menüsü (dokunmatik), haritayı isteğe bağlı yükleme.
(function () {
  var body = document.body;
  var burger = document.querySelector('.burger');
  var nav = document.getElementById('nav');

  function closeNav() {
    body.classList.remove('nav-open');
    if (burger) {
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Menüyü aç');
    }
  }

  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = body.classList.toggle('nav-open');
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Menüyü kapat' : 'Menüyü aç');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('a')) closeNav();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeNav();
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 980) closeNav();
    });
  }

  var dd = document.querySelector('.dd');
  if (dd) {
    var btn = dd.querySelector('button');
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      dd.classList.toggle('open');
    });
    document.addEventListener('click', function (e) {
      if (!dd.contains(e.target)) dd.classList.remove('open');
    });
  }

  var maps = document.querySelectorAll('[data-map]');
  for (var i = 0; i < maps.length; i++) {
    (function (m) {
      var b = m.querySelector('[data-map-load]');
      if (!b) return;
      b.addEventListener('click', function () {
        var f = document.createElement('iframe');
        f.src = m.getAttribute('data-map');
        f.loading = 'lazy';
        f.title = 'İyi Reklam konum haritası';
        f.referrerPolicy = 'no-referrer-when-downgrade';
        f.setAttribute('allowfullscreen', '');
        m.innerHTML = '';
        m.appendChild(f);
      });
    })(maps[i]);
  }
})();
