/* ============================================================
   FRASE MOTIVACIONAL — reemplaza la franja de contadores.
   Muestra 1 de 4 frases y cambia automáticamente cada 24h
   (se calcula según el día del año, así que es igual para
   todos los visitantes ese mismo día, sin necesitar backend).
   Para editar las frases, solo cambia el arreglo FRASES.
   ============================================================ */
(function(){
  const FRASES = [
    "Formamos personas con valores, educación y visión de futuro.",
    "La educación es el arma más poderosa para cambiar el mundo.",
    "Cada día es una nueva oportunidad para aprender y crecer juntos.",
    "El conocimiento se construye entre familia, docentes y estudiantes."
  ];

  function diaDelAnio(fecha){
    const inicio = new Date(fecha.getFullYear(), 0, 0);
    const diferencia = fecha - inicio;
    return Math.floor(diferencia / 86400000); // ms en un día
  }

  document.addEventListener('DOMContentLoaded', function(){
    const el = document.getElementById('frase-motiv-texto');
    if(!el) return;
    const indice = diaDelAnio(new Date()) % FRASES.length;
    el.textContent = FRASES[indice];
  });
})();
