/* ============================================================
   FRASE MOTIVACIONAL — se escribe letra por letra, dura 1 minuto,
   se borra y se escribe la siguiente. Así va rotando todas.
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

  function diaDelAnio(fecha){
    const inicio = new Date(fecha.getFullYear(), 0, 0);
    return Math.floor((fecha - inicio) / 86400000);
  }

  document.addEventListener('DOMContentLoaded', function(){
    const el = document.getElementById('frase-motiv-texto');
    if(!el) return;

    let indice = diaDelAnio(new Date()) % FRASES.length;

    // Si la persona prefiere menos movimiento: texto fijo, cambia cada minuto sin animar
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = FRASES[indice];
      setInterval(function(){
        indice = (indice + 1) % FRASES.length;
        el.textContent = FRASES[indice];
      }, MS_POR_FRASE);
      return;
    }

    function escribir(){
      const frase = FRASES[indice];
      let n = 0;
      el.classList.add('fm-escribiendo');
      (function paso(){
        n++;
        el.textContent = frase.slice(0, n);
        if (n < frase.length) {
          setTimeout(paso, MS_ESCRIBIR);
        } else {
          const gastado = frase.length * (MS_ESCRIBIR + MS_BORRAR);
          setTimeout(borrar, Math.max(1000, MS_POR_FRASE - gastado));
        }
      })();
    }

    function borrar(){
      let n = el.textContent.length;
      (function paso(){
        n--;
        el.textContent = el.textContent.slice(0, Math.max(n, 0));
        if (n > 0) {
          setTimeout(paso, MS_BORRAR);
        } else {
          indice = (indice + 1) % FRASES.length;
          setTimeout(escribir, 400);
        }
      })();
    }

    escribir();
  });
})();
