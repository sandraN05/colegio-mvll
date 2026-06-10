
function toggleMenu() {
  const menu = document.getElementById('mobileMenu');
  menu.classList.toggle('open');
}

document.addEventListener('click', function(e) {
  const menu      = document.getElementById('mobileMenu');
  const hamburger = document.querySelector('.hamburger');
  if (menu && hamburger) {
    if (!menu.contains(e.target) && !hamburger.contains(e.target)) {
      menu.classList.remove('open');
    }
  }
});

// ══════════════════════════════════════════════════
//  SMOOTH SCROLL
// ══════════════════════════════════════════════════
document.querySelectorAll('a[href^="#"]').forEach(function(link) {
  link.addEventListener('click', function(e) {
    const destino = document.querySelector(this.getAttribute('href'));
    if (destino) {
      e.preventDefault();
      destino.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// ══════════════════════════════════════════════════
//  VISOR PDF
// ══════════════════════════════════════════════════
function abrirVisor(urlPdf, titulo) {
  const modal    = document.getElementById('visor-modal');
  const iframe   = document.getElementById('visor-iframe');
  const tituloEl = document.getElementById('visor-titulo');

  tituloEl.textContent         = titulo;
  iframe.src                   = urlPdf;
  modal.classList.add('activo');
  document.body.style.overflow = 'hidden';
}

function cerrarVisor(event) {
  if (event && event.target !== document.getElementById('visor-modal')) return;
  const modal  = document.getElementById('visor-modal');
  const iframe = document.getElementById('visor-iframe');
  modal.classList.remove('activo');
  iframe.src                   = '';
  document.body.style.overflow = '';
}

// Cerrar con ESC
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') cerrarVisor();
});

// ══════════════════════════════════════════════════
//  FORMATEAR FECHA
// ══════════════════════════════════════════════════
function formatearFecha(fechaStr) {
  const fecha = new Date(fechaStr);
  return fecha.toLocaleDateString('es-PE', {
    day: '2-digit', month: 'long', year: 'numeric'
  });
}

// ══════════════════════════════════════════════════
//  CARGAR ACTIVIDADES DESDE SUPABASE
// ══════════════════════════════════════════════════
async function cargarActividades() {
  const cargando = document.getElementById('cargando-actividades');
  const sinDatos = document.getElementById('sin-actividades');
  const lista    = document.getElementById('lista-actividades');
  if (!lista) return;

  try {
   const ahora = new Date().toISOString();

   const { data, error } = await supabase
   .from('actividades')
   .select('*')
   .eq('estado', 'activo')
   .gt('fecha_expiracion', ahora)
   .order('fecha', { ascending: false });

    cargando.style.display = 'none';

    if (error || !data || data.length === 0) {
      sinDatos.style.display = 'flex';
      return;
    }

    lista.style.display = 'grid';
    lista.innerHTML = data.map(function(act) {
      return `
        <div class="actividad-card">
          ${act.imagen_url
            ? `<img src="${act.imagen_url}" alt="${act.titulo}"/>`
            : `<div class="actividad-card-placeholder">${getIconoCategoria(act.categoria)}</div>`
          }
          <div class="actividad-franja"></div>
          <div class="actividad-body">
            <div class="actividad-meta">
              <span class="actividad-badge cat-${act.categoria || 'otro'}">
                ${getIconoCategoria(act.categoria)} ${capitalizarPrimera(act.categoria || 'Actividad')}
              </span>
              <span class="actividad-fecha">${formatearFecha(act.fecha)}</span>
            </div>
            <div class="actividad-titulo">${act.titulo}</div>
            ${act.descripcion ? `<div class="actividad-desc">${act.descripcion}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');

  } catch (err) {
    cargando.style.display = 'none';
    sinDatos.style.display = 'flex';
    console.error('Error al cargar actividades:', err);
  }
}

// ══════════════════════════════════════════════════
//  CARGAR REVISTAS DESDE SUPABASE
// ══════════════════════════════════════════════════
async function cargarRevistas() {
  const cargando = document.getElementById('cargando-revistas');
  const sinDatos = document.getElementById('sin-revistas');
  const lista    = document.getElementById('lista-revistas');
  if (!lista) return;

  try {
   const ahora = new Date().toISOString();

   const { data, error } = await supabase
   .from('revistas')
   .select('*')
   .eq('estado', 'activo')
   .gt('fecha_expiracion', ahora)
   .order('created_at', { ascending: false });

    cargando.style.display = 'none';

    if (error || !data || data.length === 0) {
      sinDatos.style.display = 'flex';
      return;
    }

    lista.style.display = 'grid';
    lista.innerHTML = data.map(function(rev) {
      return `
        <div class="actividad-card">
          ${rev.portada_url
            ? `<img src="${rev.portada_url}" alt="${rev.titulo}" style="width:100%;height:180px;object-fit:cover;display:block;"/>`
            : `<div class="actividad-card-placeholder"></div>`
          }
          <div class="actividad-franja"></div>
          <div class="actividad-body">
            <div class="actividad-meta">
              <span class="actividad-badge cat-otro"> Revista</span>
            </div>
            <div class="actividad-titulo">${rev.titulo}</div>
            ${rev.descripcion ? `<div class="actividad-desc">${rev.descripcion}</div>` : ''}
            <button class="btn-ver" style="margin-top:10px;" onclick="abrirVisor('${rev.pdf_url}', '${rev.titulo}')">
              👁 Ver revista
            </button>
          </div>
        </div>
      `;
    }).join('');

  } catch (err) {
    cargando.style.display = 'none';
    sinDatos.style.display = 'flex';
    console.error('Error al cargar revistas:', err);
  }
}

// ══════════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════════
function getIconoCategoria(categoria) {
  const iconos = {
    ciencia:     '',
    deporte:     '',
    aniversario: '',
    concurso:    '',
    feria:       '',
    arte:        '',
    otro:        ''
  };
  return iconos[categoria] || '';
}

function capitalizarPrimera(texto) {
  if (!texto) return '';
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// ══════════════════════════════════════════════════
//  ANIMACIONES AL HACER SCROLL
// ══════════════════════════════════════════════════
const observer = new IntersectionObserver(
  function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.style.opacity    = '1';
        entry.target.style.transform  = 'translateY(0)';
      }
    });
  },
  { threshold: 0.1 }
);

document.querySelectorAll('.nivel-card, .profe-card, .actividad-card, .anuncio-card').forEach(function(el) {
  el.style.opacity    = '0';
  el.style.transform  = 'translateY(20px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  observer.observe(el);
});

// ══════════════════════════════════════════════════
//  INICIAR AL CARGAR LA PÁGINA
// ══════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function() {
  cargarActividades();
  cargarRevistas();
  cargarAnuncios();
  cargarDireccion();
});
// ══════════════════════════════════════════════════
//  CARGAR ANUNCIOS DESDE SUPABASE
// ══════════════════════════════════════════════════
async function cargarAnuncios() {
  const cargando = document.getElementById('cargando-anuncios');
  const sinDatos = document.getElementById('sin-anuncios');
  const lista    = document.getElementById('lista-anuncios');
  if (!lista) return;

  try {
    const ahora = new Date().toISOString();

   const { data, error } = await supabase
   .from('anuncios')
   .select('*')
   .eq('estado', 'activo')
   .gt('fecha_expiracion', ahora)
   .order('fecha_evento', { ascending: true });

    cargando.style.display = 'none';

    if (error || !data || data.length === 0) {
      sinDatos.style.display = 'flex';
      return;
    }

    lista.style.display = 'grid';
    lista.innerHTML = data.map(function(a) {
      const detalles = [];
      if (a.fecha_evento) detalles.push(`<div class="anuncio-detalle"><span>📅</span><span>${formatearFecha(a.fecha_evento)}</span></div>`);
      if (a.hora)         detalles.push(`<div class="anuncio-detalle"><span>🕐</span><span>${a.hora}</span></div>`);
      if (a.lugar)        detalles.push(`<div class="anuncio-detalle"><span>📍</span><span>${a.lugar}</span></div>`);

      return `
        <div class="anuncio-card">
          ${a.imagen_url
            ? `<img class="anuncio-img" src="${a.imagen_url}" alt="${a.titulo}"/>`
            : `<div class="anuncio-img-placeholder"></div>`
          }
          <div class="anuncio-franja"></div>
          <div class="anuncio-body">
            <div class="anuncio-badge"> Anuncio</div>
            <div class="anuncio-titulo">${a.titulo}</div>
            ${a.descripcion ? `<div class="anuncio-desc">${a.descripcion}</div>` : ''}
            ${detalles.length ? `<div class="anuncio-detalles">${detalles.join('')}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');

  } catch (err) {
    cargando.style.display = 'none';
    sinDatos.style.display = 'flex';
    console.error('Error al cargar anuncios:', err);
  }
}

// ══════════════════════════════════════════════════
//  EFECTOS DE SCROLL (REVEAL)
// ══════════════════════════════════════════════════
function initReveal() {
  // Agregar clase reveal a todos los elementos que queremos animar
  const selectores = [
    '.nivel-card',
    '.actividad-card', 
    '.profe-card',
    '.revista-card',
    '.anuncio-card',
    '.contacto-item',
    '.valor-item',
    '.section-tag',
    '.section-title',
    '.section-sub',
    '.stat-item',
    '.nosotros-img',
    '.nosotros-text'
  ];

  selectores.forEach(function(selector) {
    document.querySelectorAll(selector).forEach(function(el, i) {
      el.classList.add('reveal');
      // Delay escalonado para cards en fila
      const delay = i % 4;
      if (delay === 1) el.classList.add('reveal-delay-1');
      if (delay === 2) el.classList.add('reveal-delay-2');
      if (delay === 3) el.classList.add('reveal-delay-3');
    });
  });

  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.reveal').forEach(function(el) {
    observer.observe(el);
  });
}

// ══════════════════════════════════════════════════
//  PARALLAX EN HERO
// ══════════════════════════════════════════════════
function initParallax() {
  const bg = document.querySelector('.hero-parallax-bg');
  if (!bg) return;
  window.addEventListener('scroll', function() {
    const scroll = window.scrollY;
    bg.style.transform = 'translateY(' + (scroll * 0.3) + 'px)';
  }, { passive: true });
}

// ══════════════════════════════════════════════════
//  CONTADOR ANIMADO EN STATS
// ══════════════════════════════════════════════════
function animarContador(el, target, suffix) {
  const duration = 1800;
  const start = performance.now();
  function update(time) {
    const progress = Math.min((time - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(ease * target) + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

function initContadores() {
  const stats = document.querySelectorAll('.stat-num');
  if (!stats.length) return;

  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        const el = entry.target;
        const text = el.textContent;
        const num = parseInt(text.replace(/[^0-9]/g, ''));
        const suffix = text.includes('+') ? '+' : '';
        animarContador(el, num, suffix);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  stats.forEach(function(s) { observer.observe(s); });
}

// ══════════════════════════════════════════════════
//  INICIAR TODOS LOS EFECTOS
// ══════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function() {
  initReveal();
  initParallax();
  initContadores();
});

// ══════════════════════════════════════════════════
//  MODAL DE NIVELES
// ══════════════════════════════════════════════════
const nivelesInfo = {
  inicial: {
    icon: '🌱',
    titulo: 'Nivel Inicial',
    desc: 'Estimulación temprana y desarrollo integral en un ambiente lúdico, seguro y estimulante para niños de 3 a 5 años.',
    clave: 'inicial'
  },
  primaria: {
    icon: '📚',
    titulo: 'Nivel Primaria',
    desc: 'Formación sólida en competencias fundamentales: lectura, matemáticas, ciencias y habilidades para la vida. Del 1° al 6° grado.',
    clave: 'primaria'
  },
  secundaria: {
    icon: '🎓',
    titulo: 'Nivel Secundaria',
    desc: 'Preparación integral para el ingreso a la universidad con orientación vocacional y desarrollo del liderazgo. Del 1° al 5° año.',
    clave: 'secundaria'
  }
};

async function abrirNivel(nivel) {
  const info = nivelesInfo[nivel];
  if (!info) return;

  // Llenar header
  document.getElementById('nivel-modal-icon').textContent = info.icon;
  document.getElementById('nivel-modal-titulo').textContent = info.titulo;
  document.getElementById('nivel-modal-desc').textContent = info.desc;

  // Resetear estado
  document.getElementById('nivel-modal-cargando').style.display = 'flex';
  document.getElementById('nivel-modal-sin-fotos').style.display = 'none';
  document.getElementById('nivel-modal-fotos').style.display = 'none';

  // Abrir modal
  document.getElementById('modal-nivel').classList.add('activo');
  document.body.style.overflow = 'hidden';

  try {
    // Buscar nivel en BD
    const { data: nivData, error: nivError } = await supabase
      .from('niveles')
      .select('id, descripcion')
      .eq('nivel', nivel)
      .single();

    if (!nivError && nivData && nivData.descripcion) {
      document.getElementById('nivel-modal-desc').textContent = nivData.descripcion;
    }

    // Buscar fotos
    const nivelId = nivData ? nivData.id : null;
    let fotosData = [];

    if (nivelId) {
      const { data, error } = await supabase
        .from('niveles_fotos')
        .select('*')
        .eq('nivel_id', nivelId)
        .order('orden', { ascending: true });

      if (!error && data) fotosData = data;
    }

    document.getElementById('nivel-modal-cargando').style.display = 'none';

    if (!fotosData.length) {
      document.getElementById('nivel-modal-sin-fotos').style.display = 'flex';
      return;
    }

    const galeria = document.getElementById('nivel-modal-fotos');
    galeria.style.display = 'grid';
    galeria.innerHTML = fotosData.map(function(f) {
      return `
        <div class="nivel-foto-item">
          <img src="${f.foto_url}" alt="${f.descripcion || info.titulo}" loading="lazy"/>
          ${f.descripcion ? `<div class="nivel-foto-desc">${f.descripcion}</div>` : ''}
        </div>
      `;
    }).join('');

  } catch(err) {
    document.getElementById('nivel-modal-cargando').style.display = 'none';
    document.getElementById('nivel-modal-sin-fotos').style.display = 'flex';
    console.error('Error cargando nivel:', err);
  }
}

function cerrarNivel(event) {
  if (event && event.target !== document.getElementById('modal-nivel')) return;
  document.getElementById('modal-nivel').classList.remove('activo');
  document.body.style.overflow = '';
}

// Cerrar con ESC
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') cerrarNivel();
});
// ══════════════════════════════════════════════════
//  CARGAR DIRECCIÓN DESDE SUPABASE
// ══════════════════════════════════════════════════
async function cargarDireccion() {
  const cargando = document.getElementById('cargando-direccion');
  const sinDatos = document.getElementById('sin-direccion');
  const grid     = document.getElementById('grid-direccion');
  if (!grid) return;

  try {
    const { data, error } = await supabase
      .from('direccion')
      .select('*')
      .order('created_at', { ascending: true });

    cargando.style.display = 'none';

    if (error || !data || !data.length) {
      sinDatos.style.display = 'flex';
      return;
    }

    grid.style.display = 'block';
    grid.innerHTML = data.map(d => `
      <div class="direccion-card">
        <div class="direccion-foto">
          ${d.foto_url
            ? `<img src="${d.foto_url}" alt="${d.nombre}"/>`
            : `<div class="direccion-foto-placeholder">🎖️</div>`
          }
        </div>
        <div class="direccion-info">
          <div class="section-tag">Liderazgo institucional</div>
          <h3>${d.nombre}</h3>
          <div class="direccion-cargo">${d.cargo || ''}</div>
          ${d.descripcion ? `<div class="direccion-desc">${d.descripcion}</div>` : ''}
        </div>
      </div>
    `).join('');

  } catch(err) {
    cargando.style.display = 'none';
    sinDatos.style.display = 'flex';
    console.error(err);
  }
}