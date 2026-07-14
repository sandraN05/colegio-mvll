/* ════════════════════════════════
   ANUARIO (página pública independiente)
════════════════════════════════ */
let anuariosCache = [];
let anuarioLibroActual = null; // { titulo, descripcion, imagenes }
let anuarioPaginaActual = 0;

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
  mostrarPaginaAnuario();
  document.getElementById('libro-modal').classList.add('activo');
  document.body.style.overflow = 'hidden';
}

function mostrarPaginaAnuario() {
  if (!anuarioLibroActual) return;
  const imgs     = anuarioLibroActual.imagenes;
  const img      = document.getElementById('libro-imagen');
  const vacio    = document.getElementById('libro-sin-imagenes');
  const contador = document.getElementById('libro-contador');
  const flechaIzq = document.querySelector('.libro-flecha-izq');
  const flechaDer = document.querySelector('.libro-flecha-der');

  if (!imgs.length) {
    img.style.display = 'none';
    vacio.style.display = 'flex';
    contador.textContent = '';
    flechaIzq.disabled = true;
    flechaDer.disabled = true;
    return;
  }
  vacio.style.display = 'none';
  img.style.display = 'block';
  img.src = imgs[anuarioPaginaActual];
  contador.textContent = (anuarioPaginaActual + 1) + ' / ' + imgs.length;
  flechaIzq.disabled = anuarioPaginaActual === 0;
  flechaDer.disabled = anuarioPaginaActual === imgs.length - 1;
}

function paginaAnuarioAnterior() {
  if (anuarioPaginaActual > 0) { anuarioPaginaActual--; mostrarPaginaAnuario(); }
}
function paginaAnuarioSiguiente() {
  if (anuarioLibroActual && anuarioPaginaActual < anuarioLibroActual.imagenes.length - 1) {
    anuarioPaginaActual++; mostrarPaginaAnuario();
  }
}
function cerrarLibroAnuario(event) {
  if (event && event.target !== document.getElementById('libro-modal')) return;
  document.getElementById('libro-modal').classList.remove('activo');
  document.body.style.overflow = '';
  anuarioLibroActual = null;
}

document.addEventListener('keydown', function(e) {
  const modal = document.getElementById('libro-modal');
  if (!modal || !modal.classList.contains('activo')) return;
  if (e.key === 'Escape')      cerrarLibroAnuario();
  if (e.key === 'ArrowLeft')   paginaAnuarioAnterior();
  if (e.key === 'ArrowRight')  paginaAnuarioSiguiente();
});

document.addEventListener('DOMContentLoaded', cargarAnuarioPublico);
