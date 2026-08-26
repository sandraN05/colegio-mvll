/* ============================================================
   JUEGO: Letras escondidas — Colegio Mario Vargas Llosa
   Frase objetivo: COLEGIO MARIO VARGAS LLOSA (23 letras)
   Repartidas en 6 páginas del sitio. El progreso se guarda en
   localStorage y se mantiene aunque el usuario navegue entre
   páginas. No requiere HTML adicional: este script crea toda
   la interfaz (cinta, pill, mensaje final) por su cuenta.
   ============================================================ */
(function(){
  const PALABRAS = ["COLEGIO","MARIO","VARGAS","LLOSA"];
  const PALABRA_PLANA = PALABRAS.join("");   // 23 letras, sin espacios
  const TOTAL = PALABRA_PLANA.length;

  // índices globales donde termina cada palabra (para separar visualmente los slots)
  const FIN_PALABRA = (() => {
    const set = new Set();
    let acc = -1;
    PALABRAS.forEach(p => { acc += p.length; set.add(acc); });
    return set;
  })();

  // en qué página empieza a esconderse cada tramo de letras, y cuántas letras tiene
  const PAGINAS = {
    "index.html":          { desde: 0,  largo: 4 }, // C O L E
    "anuario.html":        { desde: 4,  largo: 3 }, // G I O
    "promotores.html":     { desde: 7,  largo: 5 }, // M A R I O
    "investigadores.html": { desde: 12, largo: 3 }, // V A R
    "escuela.html":        { desde: 15, largo: 3 }, // G A S
    "profesores.html":     { desde: 18, largo: 5 }  // L L O S A
  };

  const CLAVE_LETRAS = "mvll_letras_encontradas";
  const CLAVE_COMPLETO = "mvll_juego_completo";

  function cargarEncontradas(){
    try{
      const raw = localStorage.getItem(CLAVE_LETRAS);
      if(!raw) return new Array(TOTAL).fill(false);
      const arr = JSON.parse(raw);
      if(Array.isArray(arr) && arr.length === TOTAL) return arr;
    }catch(e){}
    return new Array(TOTAL).fill(false);
  }
  function guardarEncontradas(arr){
    try{ localStorage.setItem(CLAVE_LETRAS, JSON.stringify(arr)); }catch(e){}
  }

  let encontradas = cargarEncontradas();

  function paginaActual(){
    let archivo = (location.pathname.split('/').pop() || '').toLowerCase();
    if(archivo === '') archivo = 'index.html';
    if(!archivo.endsWith('.html')) archivo += '.html'; // Vercel usa cleanUrls (sin .html)
    return archivo;
  }

  /* ---------------- UI: cinta + pill ---------------- */
  let elCinta, elSlots, elPill;
  let timerOcultar = null;

  function crearUI(){
    elCinta = document.createElement('div');
    elCinta.className = 'cinta-letras';

    elSlots = document.createElement('div');
    elSlots.className = 'cinta-slots';
    elCinta.appendChild(elSlots);
    document.body.appendChild(elCinta);

    for(let i=0;i<TOTAL;i++){
      const slot = document.createElement('div');
      slot.className = 'clt-slot';
      slot.id = 'clt-slot-'+i;
      if(FIN_PALABRA.has(i)) slot.classList.add('clt-fin-palabra');
      if(encontradas[i]){
        slot.textContent = PALABRA_PLANA[i];
        slot.classList.add('clt-lleno');
      }
      elSlots.appendChild(slot);
    }

    elPill = document.createElement('button');
    elPill.type = 'button';
    elPill.className = 'pill-letras';
    elPill.setAttribute('aria-label','Ver progreso de letras encontradas');
    actualizarPill();
    elPill.addEventListener('click', ()=> mostrarCinta());
    document.body.appendChild(elPill);
  }

  function actualizarPill(){
    const n = encontradas.filter(Boolean).length;
    elPill.innerHTML = '🔤 <span>'+n+'/'+TOTAL+'</span>';
  }

  function mostrarCinta(){
    elCinta.classList.add('clt-visible');
    if(timerOcultar) clearTimeout(timerOcultar);
    timerOcultar = setTimeout(()=>{ elCinta.classList.remove('clt-visible'); }, 10000);
  }

  /* ---------------- Esconder letras en la página actual ---------------- */
  function posicionAleatoria(){
    const alturaTotal = document.body.scrollHeight;
    const anchoTotal = document.documentElement.clientWidth;
    const top = 160 + Math.random() * Math.max(200, alturaTotal - 380);
    const left = 20 + Math.random() * Math.max(40, anchoTotal - 60);
    return { top, left };
  }

  function esconderLetrasDePagina(){
    const cfg = PAGINAS[paginaActual()];
    if(!cfg) return; // página sin letras (login/admin/juegos)
    for(let i=cfg.desde; i<cfg.desde+cfg.largo; i++){
      if(encontradas[i]) continue; // ya la encontró antes en otra visita
      const el = document.createElement('div');
      el.className = 'letra-escondida-mvll';
      el.textContent = PALABRA_PLANA[i];
      const pos = posicionAleatoria();
      el.style.top = pos.top + 'px';
      el.style.left = pos.left + 'px';
      el.addEventListener('click', ()=> recolectar(el, i));
      document.body.appendChild(el);
    }
  }

  function recolectar(el, indice){
    if(encontradas[indice]) return;
    encontradas[indice] = true;
    guardarEncontradas(encontradas);
    actualizarPill();
    mostrarCinta();
    el.classList.add('clt-brillando');

    const rectOrigen = el.getBoundingClientRect();
    const slot = document.getElementById('clt-slot-'+indice);
    const rectDestino = slot.getBoundingClientRect();

    const volando = document.createElement('div');
    volando.className = 'letra-volando-mvll';
    volando.textContent = el.textContent;
    volando.style.top = rectOrigen.top + 'px';
    volando.style.left = rectOrigen.left + 'px';
    document.body.appendChild(volando);

    requestAnimationFrame(()=>{
      volando.style.top = (rectDestino.top + 6) + 'px';
      volando.style.left = (rectDestino.left + 6) + 'px';
      volando.style.transform = 'scale(0.6)';
      volando.style.opacity = '0.25';
    });

    setTimeout(()=>{
      volando.remove();
      slot.textContent = el.textContent;
      slot.classList.add('clt-lleno');
      el.remove();
      verificarVictoria();
    }, 560);
  }

  function verificarVictoria(){
    if(encontradas.every(Boolean)){
      try{ localStorage.setItem(CLAVE_COMPLETO,'true'); }catch(e){}
      setTimeout(mostrarMensajeFinal, 350);
    }
  }

  /* ---------------- Mensaje final ---------------- */
  function mostrarMensajeFinal(){
    if(document.getElementById('mvll-mensaje-final')) return;
    const overlay = document.createElement('div');
    overlay.id = 'mvll-mensaje-final';
    overlay.className = 'mvll-overlay';
    overlay.innerHTML =
      '<div class="mvll-caja">' +
        '<h3>' + PALABRAS.join(' ') + '</h3>' +
        '<p>¡Encontraste todas las letras escondidas en el sitio! 🎉</p>' +
        '<a href="juegos.html" class="mvll-btn-juegos">Ir a los juegos →</a>' +
      '</div>';
    document.body.appendChild(overlay);
    requestAnimationFrame(()=> overlay.classList.add('mvll-mostrar'));
  }

  /* ---------------- Arranque ---------------- */
  document.addEventListener('DOMContentLoaded', crearUI);
  // se espera a 'load' (+ pequeño margen) para que el contenido dinámico
  // de cada página (Supabase, carruseles, etc.) ya haya crecido el alto real
  window.addEventListener('load', function(){
    setTimeout(esconderLetrasDePagina, 600);
  });
})();
