
(function () {
  var FORMAS = {
    estrella: '<svg viewBox="0 0 24 24"><path fill="#F0A500" d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 20.9l1.6-7L2 9.2l7.1-.6z"/></svg>',
    nube:     '<svg viewBox="0 0 64 40"><path fill="#fff" d="M16 38a12 12 0 01-1-24 16 16 0 0130-3 13 13 0 013 26z"/></svg>',
    burbuja:  '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="#ffd166" stroke-width="2"/><circle cx="8" cy="8" r="2.2" fill="#ffd166"/></svg>',
    lapiz:    '<svg viewBox="0 0 24 24"><path fill="#F0A500" d="M3 17.3V21h3.7L18 9.7 14.3 6zM20.7 7a1 1 0 000-1.4l-2.3-2.3a1 1 0 00-1.4 0l-1.8 1.8L18.9 8.8z"/></svg>',
    libro:    '<svg viewBox="0 0 24 24"><path fill="#fff" d="M4 4h7a3 3 0 013 3v13a3 3 0 00-3-3H4zM20 4h-3a3 3 0 00-3 3v13a3 3 0 013-3h3z"/></svg>'
  };

  var PLANTILLAS = [
    [['nube',6,4,90,11,0,0],['estrella',18,90,34,8,1,10],['burbuja',70,6,46,10,2,0],['lapiz',82,92,38,9,.5,25]],
    [['estrella',10,8,30,9,0,0],['nube',20,86,100,12,1.5,0],['libro',76,5,44,10,.8,-12],['burbuja',84,88,40,8,2,0]],
    [['burbuja',8,92,50,10,0,0],['estrella',30,4,36,8,1.2,15],['nube',74,88,84,13,.4,0],['lapiz',88,10,40,9,2,-20]]
  ];

  var SECCIONES = ['#nosotros', '.niveles', '#actividades', '.direccion-sec',
                   '.revistas-sec', '.anuncios-sec', '#contacto'];

  function init() {
    SECCIONES.forEach(function (sel, i) {
      var sec = document.querySelector(sel);
      if (!sec) return;
      var capa = document.createElement('div');
      capa.className = 'decor-layer';
      capa.setAttribute('aria-hidden', 'true');
      PLANTILLAS[i % PLANTILLAS.length].forEach(function (p) {
        var d = document.createElement('div');
        d.className = 'decor-item';
        d.style.cssText =
          'top:' + p[1] + '%;left:' + p[2] + '%;width:' + p[3] + 'px;height:' + p[3] + 'px;' +
          '--dur:' + p[4] + 's;--del:' + p[5] + 's;--rot:' + p[6] + 'deg;';
        d.innerHTML = FORMAS[p[0]];
        capa.appendChild(d);
      });
      sec.insertBefore(capa, sec.firstChild);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
