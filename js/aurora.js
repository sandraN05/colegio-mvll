/* ============================================================
   FONDOS ANIMADOS — crea sola las capas. No toca tu HTML.
   Va con css/aurora.css. Reemplaza a decor.js
   (borra la línea de decor.js en index.html).
   INICIO: fondo azul con aurora y estrellas + menú transparente.
   Alterna BLANCO / AZUL: blanca = trazos azules gruesos que cruzan de derecha a izquierda,
   azul = aurora suave + lluvia de estrellas.
   ============================================================ */
(function () {
  // [selector, tipo]  tipo: 'blanca' | 'azul'
  var SECCIONES = [
    ['.hero',        'inicio'],
    ['#niveles',     'blanca'],
    ['#actividades', 'azul'],
    ['#revistas',    'blanca'],
    ['#anuncios',    'azul'],
    ['#contacto',    'blanca']
  ];
  var COLORES = ['#ffd166', '#F0A500', '#ffffff', '#ffd166', '#ffffff'];
  var N_ESTRELLAS = 34, N_TRAZOS = 14;
  var NS = 'http://www.w3.org/2000/svg';

  function el(clase, estilo) {
    var d = document.createElement('div');
    d.className = clase;
    if (estilo) d.style.cssText = estilo;
    return d;
  }
  function r(a, b) { return a + Math.random() * (b - a); }


  // Trazos gruesos que cruzan de derecha a izquierda, se desvanecen y
  // aparecen otros atravesándolos (como estrellas fugaces / una fiesta de luces).
  var TONOS = ['59,107,255', '95,168,255', '26,58,124', '47,168,216', '59,107,255'];
  function trazos() {
    var frag = document.createDocumentFragment();
    for (var i = 0; i < N_TRAZOS; i++) {
      var rgb = TONOS[i % TONOS.length];
      var alto = Math.round(r(7, 16));
      var ancho = Math.round(r(220, 480));
      var dur = r(3.6, 7.5);
      frag.appendChild(el('fx-trazo',
        'top:' + r(4, 92).toFixed(1) + '%;width:' + ancho + 'px;height:' + alto + 'px;' +
        '--rot:' + r(-14, 14).toFixed(1) + 'deg;' +
        'background:linear-gradient(90deg,rgba(' + rgb + ',.95) 0%,rgba(' + rgb + ',.45) 40%,rgba(' + rgb + ',0) 100%);' +
        'animation-duration:' + dur.toFixed(1) + 's;animation-delay:-' + r(0, dur).toFixed(1) + 's'));
    }
    return frag;
  }

  function construir(sec, tipo) {
    var capa = el('fx-layer');
    capa.setAttribute('aria-hidden', 'true');
    var i;

    if (tipo === 'azul' || tipo === 'inicio') {
      for (i = 0; i < 4; i++) capa.appendChild(el('fx-aurora'));
      for (i = 0; i < N_ESTRELLAS; i++) {
        var s = Math.round(r(12, 30));
        var c = COLORES[i % COLORES.length];
        capa.appendChild(el('fx-estrella',
          'left:' + Math.round(r(-5, 115)) + '%;width:' + s + 'px;height:' + s + 'px;' +
          'background:radial-gradient(circle,#fff 0%,' + c + ' 65%);' +
          'animation-duration:' + r(6, 14).toFixed(1) + 's;' +
          'animation-delay:-' + r(0, 14).toFixed(1) + 's'));
      }
    } else {
      capa.appendChild(trazos());
    }
    if (tipo === 'inicio') capa.classList.add('fx-libre');
    sec.classList.add('fx-sec');
    sec.insertBefore(capa, sec.firstChild);
    return capa;
  }

  function init() {
    var capas = [];
    SECCIONES.forEach(function (par) {
      var sec = document.querySelector(par[0]);
      if (!sec) return;
      capas.push({ sec: sec, capa: construir(sec, par[1]) });
    });

    // altura de caída = alto de la sección
    function medir() {
      capas.forEach(function (o) {
        o.capa.style.setProperty('--alto', (o.sec.offsetHeight + 160) + 'px');
        o.capa.style.setProperty('--ancho', (o.sec.offsetWidth + 700) + 'px');
      });
    }
    // menú transparente sobre el inicio; se vuelve sólido al bajar
    var nav = document.querySelector('nav');
    if (nav) {
      var ajustarNav = function () { nav.classList.toggle('nav-solido', (window.pageYOffset || document.documentElement.scrollTop) > 40); };
      ajustarNav();
      window.addEventListener('scroll', ajustarNav, { passive: true });
    }

    medir();
    window.addEventListener('resize', medir);
    window.addEventListener('load', medir);
    setTimeout(medir, 1500); // por si las tarjetas cargan después

    // pausar lo que no se ve
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) {
          e.target.classList.toggle('fx-quieto', !e.isIntersecting);
          var sv = e.target.querySelector('.fx-cintas');
          if (sv && sv.pauseAnimations) { e.isIntersecting ? sv.unpauseAnimations() : sv.pauseAnimations(); }
        });
      }, { rootMargin: '80px' });
      capas.forEach(function (o) { io.observe(o.sec); });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
