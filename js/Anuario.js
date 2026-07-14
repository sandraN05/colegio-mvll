/* ════════════════════════════════
   ANUARIO (página pública independiente)
════════════════════════════════ */
let anuariosCache = [];
let anuarioLibroActual = null; // { titulo, descripcion, imagenes }
let anuarioPaginaActual = 0;
let pageFlipInstance = null;

async function cargarAnuarioPublico() {
  const cargando = document.getElementById('cargando-anuario');
  const sinDatos = document.getElementById('sin-anuario');
  const lista    = document.getElementById('lista-anuario');
  if (!lista) return;
  try {
    const ahora = new Date().toISOString();
    const { data, error } = await supabase
      .from('anuarios')
      .select('*')
      .eq('estado', 'activo')
      .gt('fecha_expiracion', ahora)
      .order('anio', { ascending: false });
    cargando.style.display = 'none';
    if (error || !data || data.length === 0) {
      sinDatos.style.display = 'flex';
      return;
    }
    anuariosCache = data;
    lista.style.display = 'grid';
    lista.innerHTML = data.map(function(a, i) {
      const imgs = Array.isArray(a.imagenes) ? a.imagenes : [];
      const portada = imgs[0] || null;
      return `
        <div class="anuario-ano-card" onclick="abrirLibroAnuario(${i})">
          <div class="anuario-ano-etiqueta">${a.anio}</div>
          <div class="anuario-ano-img">${portada ? `<img src="${portada}" alt="Anuario ${a.anio}"/>` : '📖'}</div>
          <div class="anuario-ano-franja">Ver anuario</div>
        </div>
      `;
    }).join('');
  } catch (err) {
    cargando.style.display = 'none';
    sinDatos.style.display = 'flex';
    console.error('Error al cargar el anuario:', err);
  }
}

function libroDisponible() {
  return typeof window.St !== 'undefined' && window.St.PageFlip;
}

function abrirLibroAnuario(indice) {
  const a = anuariosCache[indice];
  if (!a) return;
  anuarioLibroActual = {
    titulo: a.titulo || ('Anuario ' + a.anio),
    descripcion: a.descripcion || '',
    imagenes: Array.isArray(a.imagenes) ? a.imagenes : []
  };
  anuarioPaginaActual = 0;
  document.getElementById('libro-titulo').textContent = anuarioLibroActual.titulo;
  document.getElementById('libro-desc').textContent    = anuarioLibroActual.descripcion;
  document.getElementById('libro-modal').classList.add('activo');
  document.body.style.overflow = 'hidden';

  const imgs = anuarioLibroActual.imagenes;
  const vacio = document.getElementById('libro-sin-imagenes');
  const flipEl = document.getElementById('libro-flip');
  const imgEl  = document.getElementById('libro-imagen');

  if (!imgs.length) {
    vacio.style.display = 'flex';
    flipEl.style.display = 'none';
    imgEl.style.display = 'none';
    document.getElementById('libro-contador').textContent = '';
    return;
  }
  vacio.style.display = 'none';

  if (libroDisponible()) {
    imgEl.style.display = 'none';
    flipEl.style.display = 'block';
    // Pequeño delay para que el contenedor ya tenga tamaño real (modal recién visible)
    setTimeout(function() { iniciarLibroFlip(imgs); }, 60);
  } else {
    // Respaldo sin animación de libro (ej. sin conexión a la CDN)
    flipEl.style.display = 'none';
    imgEl.style.display = 'block';
    mostrarPaginaSimple();
  }
}

function iniciarLibroFlip(imgs) {
  const flipEl = document.getElementById('libro-flip');
  destruirLibroFlip();
  flipEl.innerHTML = '';

  try {
    pageFlipInstance = new St.PageFlip(flipEl, {
      width: 420,
      height: 560,
      size: 'stretch',
      minWidth: 240,
      maxWidth: 900,
      minHeight: 320,
      maxHeight: 1100,
      showCover: false,
      usePortrait: true,
      mobileScrollSupport: false,
      maxShadowOpacity: 0.5,
      flippingTime: 700
    });
    pageFlipInstance.loadFromImages(imgs);
    actualizarContadorFlip(0, imgs.length);
    actualizarFlechas(0, imgs.length);

    pageFlipInstance.on('flip', function(e) {
      actualizarContadorFlip(e.data, imgs.length);
      actualizarFlechas(e.data, imgs.length);
    });
  } catch (err) {
    console.error('No se pudo iniciar el visor de libro, usando respaldo simple:', err);
    flipEl.style.display = 'none';
    document.getElementById('libro-imagen').style.display = 'block';
    mostrarPaginaSimple();
  }
}

function destruirLibroFlip() {
  if (pageFlipInstance) {
    try { pageFlipInstance.destroy(); } catch (e) {}
    pageFlipInstance = null;
  }
}

function actualizarContadorFlip(indice, total) {
  document.getElementById('libro-contador').textContent = (indice + 1) + ' / ' + total;
}
function actualizarFlechas(indice, total) {
  document.querySelector('.libro-flecha-izq').disabled = indice === 0;
  document.querySelector('.libro-flecha-der').disabled = indice === total - 1;
}

/* ---- Respaldo sin StPageFlip (imagen simple con flechas) ---- */
function mostrarPaginaSimple() {
  if (!anuarioLibroActual) return;
  const imgs = anuarioLibroActual.imagenes;
  const img  = document.getElementById('libro-imagen');
  img.src = imgs[anuarioPaginaActual];
  actualizarContadorFlip(anuarioPaginaActual, imgs.length);
  actualizarFlechas(anuarioPaginaActual, imgs.length);
}

function paginaAnuarioAnterior() {
  if (pageFlipInstance) { pageFlipInstance.flipPrev(); return; }
  if (anuarioPaginaActual > 0) { anuarioPaginaActual--; mostrarPaginaSimple(); }
}
function paginaAnuarioSiguiente() {
  if (pageFlipInstance) { pageFlipInstance.flipNext(); return; }
  if (anuarioLibroActual && anuarioPaginaActual < anuarioLibroActual.imagenes.length - 1) {
    anuarioPaginaActual++; mostrarPaginaSimple();
  }
}

function cerrarLibroAnuario(event) {
  if (event && event.target !== document.getElementById('libro-modal')) return;
  document.getElementById('libro-modal').classList.remove('activo');
  document.body.style.overflow = '';
  destruirLibroFlip();
  anuarioLibroActual = null;
  anuarioPaginaActual = 0;
}

document.addEventListener('keydown', function(e) {
  const modal = document.getElementById('libro-modal');
  if (!modal || !modal.classList.contains('activo')) return;
  if (e.key === 'Escape')      cerrarLibroAnuario();
  if (e.key === 'ArrowLeft')   paginaAnuarioAnterior();
  if (e.key === 'ArrowRight')  paginaAnuarioSiguiente();
});

document.addEventListener('DOMContentLoaded', cargarAnuarioPublico);
