/* ============================================================
   FRASE MOTIVACIONAL — se escribe letra por letra siguiendo una CURVA ONDULADA.
   Cada frase dura 1 minuto, se borra y se escribe la siguiente.
   Para editar las frases, solo cambia el arreglo FRASES.
   Para cambiar el tiempo de cada frase, cambia MS_POR_FRASE.
   ============================================================ */
(function(){
  const FRASES = [
    "Formamos personas con valores, educación y visión de futuro.",
    "La educación es el arma más poderosa para cambiar el mundo.",
    "Cada día es una nueva oportunidad para aprender y crecer juntos.",
    "El conocimiento se construye entre familia, docentes y estudiantes."
  ];

  const MS_POR_FRASE = 60000;  // cuánto dura cada frase (1 minuto)
  const MS_ESCRIBIR  = 45;     // velocidad al escribir (ms por letra)
  const MS_BORRAR    = 20;     // velocidad al borrar (ms por letra)

  const NS = 'http://www.w3.org/2000/svg';
  // la curva: dos olas suaves de lado a lado
  const CURVA = 'M0,48 Q125,-4 250,48 T500,48 T750,48 T1000,48';

  function diaDelAnio(fecha){
    const inicio = new Date(fecha.getFullYear(), 0, 0);
    return Math.floor((fecha - inicio) / 86400000);
  }

  document.addEventListener('DOMContentLoaded', function(){
    const cont = document.getElementById('frase-motiv-texto');
    if(!cont) return;

    // SVG con el texto pegado a la curva
    cont.innerHTML =
      '<svg class="fm-svg" viewBox="0 0 1000 96" aria-hidden="true" xmlns="' + NS + '">' +
        '<path id="fm-curva" d="' + CURVA + '" fill="none"/>' +
        '<text class="fm-text"><textPath href="#fm-curva" startOffset="50%" text-anchor="middle">' +
          '<tspan id="fm-t"></tspan><tspan class="fm-cur">|</tspan>' +
        '</textPath></text>' +
      '</svg>';
    cont.setAttribute('aria-label', FRASES[0]);

    const textoEl = cont.querySelector('.fm-text');
    const tp      = cont.querySelector('textPath');
    const t       = cont.querySelector('#fm-t');
    const curva   = cont.querySelector('#fm-curva');
    let indice = diaDelAnio(new Date()) % FRASES.length;

    // Coloca la frase centrada sobre la curva, midiendo su ancho completo (así no se mueve al escribir)
    function centrar(frase){
      t.textContent = frase;
      try {
        const L = textoEl.getComputedTextLength();
        const total = curva.getTotalLength();
        if (L > 0) {
          tp.setAttribute('text-anchor', 'start');
          tp.setAttribute('startOffset', Math.max(0, (total - L) / 2));
        }
      } catch(e) {}
      t.textContent = '';
    }

    // Menos movimiento: frase completa y quieta, cambia cada minuto
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const mostrar = function(){ centrar(FRASES[indice]); t.textContent = FRASES[indice]; cont.setAttribute('aria-label', FRASES[indice]); };
      mostrar();
      setInterval(function(){ indice = (indice + 1) % FRASES.length; mostrar(); }, MS_POR_FRASE);
      return;
    }

    function escribir(){
      const frase = FRASES[indice];
      cont.setAttribute('aria-label', frase);
      centrar(frase);
      let n = 0;
      (function paso(){
        n++;
        t.textContent = frase.slice(0, n);
        if (n < frase.length) {
          setTimeout(paso, MS_ESCRIBIR);
        } else {
          const gastado = frase.length * (MS_ESCRIBIR + MS_BORRAR);
          setTimeout(borrar, Math.max(1000, MS_POR_FRASE - gastado));
        }
      })();
    }

    function borrar(){
      let n = t.textContent.length;
      (function paso(){
        n--;
        t.textContent = t.textContent.slice(0, Math.max(n, 0));
        if (n > 0) {
          setTimeout(paso, MS_BORRAR);
        } else {
          indice = (indice + 1) % FRASES.length;
          setTimeout(escribir, 400);
        }
      })();
    }

    // espera a que carguen las fuentes para medir bien el ancho
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(escribir);
  });
})();
