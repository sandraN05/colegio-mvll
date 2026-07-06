/* ════════════════════════════════
   MENÚ MÓVIL
════════════════════════════════ */
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

document.querySelectorAll('a[href^="#"], a[href*="index.html#"]').forEach(function(link) {
  link.addEventListener('click', function(e) {
    const href = this.getAttribute('href');
    const hash = href.includes('#') ? '#' + href.split('#')[1] : href;
    const destino = document.querySelector(hash);
    if (destino) {
      e.preventDefault();
      destino.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

/* ════════════════════════════════
   VISOR PDF
════════════════════════════════ */
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

/* ════════════════════════════════
   TECLADO
════════════════════════════════ */
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    cerrarVisor();
    cerrarNivel();
    cerrarActividadDetalle();
  }
});

/* ════════════════════════════════
   UTILIDADES
════════════════════════════════ */
function formatearFecha(fechaStr) {
  const fecha = new Date(fechaStr);
  return fecha.toLocaleDateString('es-PE', {
    day: '2-digit', month: 'long', year: 'numeric'
  });
}
function getIconoCategoria(categoria) {
  const iconos = {
    ciencia:'🔬', deporte:'⚽', aniversario:'🎉',
    concurso:'🏆', feria:'🎪', arte:'🎨', otro:'📌'
  };
  return iconos[categoria] || '📌';
}
function capitalizarPrimera(texto) {
  if (!texto) return '';
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/* ════════════════════════════════
   ACTIVIDADES
════════════════════════════════ */
let actividadesData = [];

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
    actividadesData = data;
    lista.style.display = 'grid';
    lista.innerHTML = data.map(function(act, i) {
      const descCorta = act.descripcion && act.descripcion.length > 120
        ? act.descripcion.substring(0, 120) + '...'
        : (act.descripcion || '');
      return `
        <div class="actividad-card" onclick="abrirActividadDetalle(${i})" style="cursor:pointer;">
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
            ${descCorta ? `<div class="actividad-desc">${descCorta}</div>` : ''}
            ${act.descripcion && act.descripcion.length > 120
              ? `<div class="act-ver-mas">Ver más →</div>`
              : ''}
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

/* ════════════════════════════════
   MODALES DETALLE
════════════════════════════════ */
function abrirActividadDetalle(i) {
  const act = actividadesData[i];
  if (!act) return;
  _abrirDetalle(
    act.imagen_url || null,
    act.titulo,
    act.descripcion || '',
    formatearFecha(act.fecha),
    capitalizarPrimera(act.categoria || 'Actividad'),
    'cat-' + (act.categoria || 'otro')
  );
}

function abrirDireccionDetalle(i) {
  const d = direccionData[i];
  if (!d) return;
  _abrirDetalle(
    d.foto_url || null,
    d.nombre,
    d.descripcion || '',
    d.cargo || '',
    'Dirección',
    'cat-otro'
  );
}

function abrirAnuncioDetalle(i) {
  const a = anunciosData[i];
  if (!a) return;
  _abrirDetalle(
    a.imagen_url || null,
    a.titulo,
    a.descripcion || '',
    a.fecha_evento ? formatearFecha(a.fecha_evento) : '',
    'Anuncio',
    'cat-otro'
  );
}

function _abrirDetalle(imgUrl, titulo, desc, fecha, badgeTxt, badgeClass) {
  const modal = document.getElementById('modal-actividad-detalle');
  if (!modal) return;
  const inner = modal.querySelector('.nivel-modal');
  const tieneImagen = imgUrl && imgUrl.trim() !== '' && imgUrl !== 'null' && imgUrl !== 'undefined';
  inner.innerHTML = `
    <button class="nivel-modal-cerrar" onclick="cerrarActividadDetalle()">✕ Cerrar</button>
    ${tieneImagen ? `
    <div style="display:flex;gap:1.5rem;align-items:flex-start;flex-wrap:wrap;">
      <img src="${imgUrl}" alt="${titulo}"
        style="width:240px;height:280px;object-fit:cover;object-position:top center;border-radius:14px;flex-shrink:0;"/>
      <div style="flex:1;min-width:200px;display:flex;flex-direction:column;gap:8px;padding-top:4px;">
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
          <span class="actividad-badge ${badgeClass}">${badgeTxt}</span>
          <span style="font-size:0.8rem;color:#94a3b8;">${fecha}</span>
        </div>
        <h2 style="font-family:'Playfair Display',serif;font-size:1.5rem;color:#fff;line-height:1.3;margin:0;">${titulo}</h2>
        <p style="color:#a8b8d8;line-height:1.8;font-size:0.92rem;margin:0;">${desc}</p>
      </div>
    </div>
    ` : `
    <div>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:8px;">
        <span class="actividad-badge ${badgeClass}">${badgeTxt}</span>
        <span style="font-size:0.8rem;color:#94a3b8;">${fecha}</span>
      </div>
      <h2 style="font-family:'Playfair Display',serif;font-size:1.5rem;color:#fff;line-height:1.3;margin-bottom:12px;">${titulo}</h2>
      <p style="color:#a8b8d8;line-height:1.8;font-size:0.92rem;">${desc}</p>
    </div>
    `}
  `;
  modal.classList.add('activo');
  document.body.style.overflow = 'hidden';
}

function cerrarActividadDetalle(event) {
  const modal = document.getElementById('modal-actividad-detalle');
  if (!modal) return;
  if (event && event.target !== modal) return;
  modal.classList.remove('activo');
  document.body.style.overflow = '';
}

/* ════════════════════════════════
   REVISTAS
════════════════════════════════ */
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
            : `<div class="actividad-card-placeholder">📖</div>`
          }
          <div class="actividad-franja"></div>
          <div class="actividad-body">
            <div class="actividad-meta">
              <span class="actividad-badge cat-otro">📖 Revista</span>
            </div>
            <div class="actividad-titulo">${rev.titulo}</div>
            ${rev.descripcion ? `<div class="actividad-desc">${rev.descripcion}</div>` : ''}
            <button class="btn-ver" style="margin-top:10px;" onclick="${rev.drive_url ? `window.open('${rev.drive_url}', '_blank')` : `abrirVisor('${rev.pdf_url}', '${rev.titulo}')`}">
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

/* ════════════════════════════════
   NOTIFICACIÓN DE NUEVO ANUNCIO
════════════════════════════════ */
let notifAnuncioTimeout = null;

async function verificarNuevoAnuncio() {
  try {
    const ahora = new Date().toISOString();
    const { data, error } = await supabase
      .from('anuncios')
      .select('*')
      .eq('estado', 'activo')
      .gt('fecha_expiracion', ahora);

    if (error || !data || data.length === 0) return;

    mostrarNotifAnuncio(data[0]);
  } catch (err) {
    console.error('Error al verificar nuevo anuncio:', err);
  }
}

function mostrarNotifAnuncio(a) {
  const overlay = document.getElementById('notif-anuncio');
  if (!overlay) return;

  document.getElementById('notif-anuncio-titulo').textContent = a.titulo;
  document.getElementById('notif-anuncio-desc').textContent  = a.descripcion || '';

  const detalles = [];
  if (a.fecha_evento) detalles.push(`<span>📅 ${formatearFecha(a.fecha_evento)}</span>`);
  if (a.hora)         detalles.push(`<span>🕐 ${a.hora}</span>`);
  if (a.lugar)        detalles.push(`<span>📍 ${a.lugar}</span>`);
  document.getElementById('notif-anuncio-detalles').innerHTML = detalles.join('');

  overlay.classList.add('activo');
  document.body.style.overflow = 'hidden';

  const barra = document.getElementById('notif-anuncio-progreso');
  barra.style.transition = 'none';
  barra.style.width = '100%';
  void barra.offsetWidth;
  requestAnimationFrame(() => {
    barra.style.transition = 'width 60s linear';
    barra.style.width = '0%';
  });

  clearTimeout(notifAnuncioTimeout);
  notifAnuncioTimeout = setTimeout(cerrarNotifAnuncio, 60000);
}

function cerrarNotifAnuncio() {
  const overlay = document.getElementById('notif-anuncio');
  if (!overlay) return;
  overlay.classList.remove('activo');
  document.body.style.overflow = '';
  clearTimeout(notifAnuncioTimeout);
}

/* ════════════════════════════════
   ANUNCIOS
════════════════════════════════ */
let anunciosData = [];

async function cargarAnuncios() {
  const cargando = document.getElementById('cargando-anuncios');
  const sinDatos = document.getElementById('sin-anuncios');
  const lista    = document.getElementById('lista-anuncios');
  if (!lista) return;
  try {
    const ahora = new Date().toISOString();
    const { data, error } = await supabase
      .from('anuncios').select('*').eq('estado', 'activo')
      .gt('fecha_expiracion', ahora).order('fecha_evento', { ascending: true });
    cargando.style.display = 'none';
    if (error || !data || data.length === 0) {
      sinDatos.style.display = 'flex';
      return;
    }
    anunciosData = data;
    lista.style.display = 'grid';
    lista.innerHTML = data.map(function(a, i) {
      const descCorta = a.descripcion && a.descripcion.length > 120
        ? a.descripcion.substring(0, 120) + '...'
        : (a.descripcion || '');
      const detalles = [];
      if (a.fecha_evento) detalles.push(`<div class="anuncio-detalle"><span>📅</span><span>${formatearFecha(a.fecha_evento)}</span></div>`);
      if (a.hora)         detalles.push(`<div class="anuncio-detalle"><span>🕐</span><span>${a.hora}</span></div>`);
      if (a.lugar)        detalles.push(`<div class="anuncio-detalle"><span>📍</span><span>${a.lugar}</span></div>`);
      return `
        <div class="anuncio-card" onclick="abrirAnuncioDetalle(${i})" style="cursor:pointer;">
          ${a.imagen_url
            ? `<img class="anuncio-img" src="${a.imagen_url}" alt="${a.titulo}"/>`
            : `<div class="anuncio-img-placeholder">📢</div>`
          }
          <div class="anuncio-franja"></div>
          <div class="anuncio-body">
            <div class="anuncio-badge">📢 Anuncio</div>
            <div class="anuncio-titulo">${a.titulo}</div>
            ${descCorta ? `<div class="anuncio-desc">${descCorta}</div>` : ''}
            ${a.descripcion && a.descripcion.length > 120
              ? `<div class="act-ver-mas">Ver más →</div>`
              : ''}
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

/* ════════════════════════════════
   DIRECCIÓN
════════════════════════════════ */
let direccionData = [];

async function cargarDireccion() {
  const cargando = document.getElementById('cargando-direccion');
  const sinDatos = document.getElementById('sin-direccion');
  const grid     = document.getElementById('grid-direccion');
  if (!grid) return;
  try {
    const { data, error } = await supabase
      .from('direccion').select('*').order('created_at', { ascending: true });
    cargando.style.display = 'none';
    if (error || !data || !data.length) {
      sinDatos.style.display = 'flex';
      return;
    }
    direccionData = data;
    grid.style.display = 'block';
    grid.innerHTML = data.map(function(d, i) {
      const descCorta = d.descripcion && d.descripcion.length > 150
        ? d.descripcion.substring(0, 150) + '...'
        : (d.descripcion || '');
      return `
        <div class="direccion-card">
          <div class="direccion-foto">
            ${d.foto_url
              ? `<img src="${d.foto_url}" alt="${d.nombre}"/>`
              : `<div class="direccion-foto-placeholder"></div>`
            }
          </div>
          <div class="direccion-info">
            <div class="section-tag">Liderazgo institucional</div>
            <h3>${d.nombre}</h3>
            <div class="direccion-cargo">${d.cargo || ''}</div>
            ${descCorta ? `<div class="direccion-desc">${descCorta}</div>` : ''}
            ${d.descripcion && d.descripcion.length > 150
              ? `<div class="act-ver-mas" onclick="abrirDireccionDetalle(${i})" style="cursor:pointer;">Ver más →</div>`
              : ''}
          </div>
        </div>
      `;
    }).join('');
  } catch(err) {
    cargando.style.display = 'none';
    sinDatos.style.display = 'flex';
    console.error(err);
  }
}

/* ════════════════════════════════
   REVEAL AL SCROLL
════════════════════════════════ */
function initReveal() {
  const selectores = [
    '.nivel-card', '.actividad-card', '.profe-card', '.revista-card',
    '.anuncio-card', '.contacto-item', '.valor-item',
    '.section-tag', '.section-title', '.section-sub',
    '.stat-item', '.nosotros-img', '.nosotros-text'
  ];
  selectores.forEach(function(selector) {
    document.querySelectorAll(selector).forEach(function(el, i) {
      el.classList.add('reveal');
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

/* ════════════════════════════════
   REVEAL CON GSAP
════════════════════════════════ */
function initRevealGSAP() {
  if (typeof gsap === 'undefined') {
    initReveal();
    return;
  }
  const selectores = [
    '.nivel-card', '.actividad-card', '.profe-card', '.revista-card',
    '.anuncio-card', '.contacto-item', '.valor-item',
    '.section-tag', '.section-title', '.section-sub',
    '.stat-item', '.nosotros-img', '.nosotros-text'
  ];
  selectores.forEach(function(selector) {
    document.querySelectorAll(selector).forEach(function(el, i) {
      gsap.fromTo(el,
        { opacity: 0, y: 36 },
        {
          opacity: 1, y: 0, duration: 0.65,
          delay: (i % 4) * 0.1, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 92%', toggleActions: 'play none none none' }
        }
      );
    });
  });
}

/* ════════════════════════════════
   PARALLAX
════════════════════════════════ */
function initParallax() {
  const bg = document.querySelector('.hero-parallax-bg');
  if (!bg) return;
  window.addEventListener('scroll', function() {
    bg.style.transform = 'translateY(' + (window.scrollY * 0.3) + 'px)';
  }, { passive: true });
}

/* ════════════════════════════════
   CONTADORES ANIMADOS
════════════════════════════════ */
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
        const el     = entry.target;
        const text   = el.textContent;
        const num    = parseInt(text.replace(/[^0-9]/g, ''));
        const suffix = text.includes('+') ? '+' : '';
        animarContador(el, num, suffix);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  stats.forEach(function(s) { observer.observe(s); });
}

/* ════════════════════════════════
   CARDS 3D NIVELES
════════════════════════════════ */
function init3DNivelCards() {
  document.querySelectorAll('.nivel-card').forEach(function(card) {
    card.addEventListener('mousemove', function(e) {
      const rect = card.getBoundingClientRect();
      const x    = e.clientX - rect.left;
      const y    = e.clientY - rect.top;
      const cx   = rect.width  / 2;
      const cy   = rect.height / 2;
      const rotX = ((y - cy) / cy) * -10;
      const rotY = ((x - cx) / cx) *  10;
      card.style.transform = `perspective(600px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-8px) scale(1.03)`;
    });
    card.addEventListener('mouseleave', function() {
      card.style.transform = '';
      card.style.transition = 'transform 0.5s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s';
    });
    card.addEventListener('mouseenter', function() {
      card.style.transition = 'transform 0.12s ease, box-shadow 0.3s';
    });
  });
}

/* ════════════════════════════════
   CARRUSEL COVERFLOW 3D
════════════════════════════════ */
let carruselIndex = 0;
let carruselFotos = [];

function renderCarrusel(fotos, info) {
  carruselFotos = fotos;
  carruselIndex = 0;
  const galeria = document.getElementById('nivel-modal-fotos');
  galeria.style.display = 'block';
  galeria.innerHTML = `
    <div class="coverflow-wrap">
      <div class="coverflow-track" id="coverflow-track"></div>
    </div>
    <div class="carrusel-puntos" id="carrusel-puntos" style="display:flex;justify-content:center;gap:7px;margin-top:14px;"></div>
    <p class="carrusel-counter" id="carrusel-counter">1 / ${fotos.length}</p>
  `;
  const track  = document.getElementById('coverflow-track');
  const puntos = document.getElementById('carrusel-puntos');
  fotos.forEach(function(f, i) {
    const slide = document.createElement('div');
    slide.className    = 'coverflow-slide';
    slide.dataset.index = i;
    slide.onclick = function() { irASlide(i); };
    slide.innerHTML = `
      <img src="${f.foto_url}" alt="${f.descripcion || info.titulo}" loading="lazy"/>
      ${f.descripcion ? `<div class="coverflow-caption">${f.descripcion}</div>` : ''}
    `;
    track.appendChild(slide);
    const punto = document.createElement('button');
    punto.className = 'carrusel-punto' + (i === 0 ? ' activo' : '');
    punto.onclick   = function() { irASlide(i); };
    puntos.appendChild(punto);
  });
  actualizarCoverflow();
}

function actualizarCoverflow() {
  const slides  = document.querySelectorAll('.coverflow-slide');
  const puntos  = document.querySelectorAll('.carrusel-punto');
  const counter = document.getElementById('carrusel-counter');
  slides.forEach(function(slide, i) {
    const diff = i - carruselIndex;
    let transform, zIndex, opacity;
    if (diff === 0) {
      transform = 'translateX(-50%) translateY(-50%) scale(1) rotateY(0deg)';
      zIndex = 10; opacity = 1;
    } else if (diff === -1) {
      transform = 'translateX(-120%) translateY(-50%) scale(0.75) rotateY(40deg)';
      zIndex = 8; opacity = 0.65;
    } else if (diff === 1) {
      transform = 'translateX(20%) translateY(-50%) scale(0.75) rotateY(-40deg)';
      zIndex = 8; opacity = 0.65;
    } else if (diff < -1) {
      transform = 'translateX(-160%) translateY(-50%) scale(0.55) rotateY(50deg)';
      zIndex = 5; opacity = 0.25;
    } else {
      transform = 'translateX(60%) translateY(-50%) scale(0.55) rotateY(-50deg)';
      zIndex = 5; opacity = 0.25;
    }
    slide.style.transform = transform;
    slide.style.zIndex    = zIndex;
    slide.style.opacity   = opacity;
    slide.style.cursor    = diff === 0 ? 'default' : 'pointer';
  });
  puntos.forEach(function(p, i) { p.classList.toggle('activo', i === carruselIndex); });
  if (counter) counter.textContent = `${carruselIndex + 1} / ${carruselFotos.length}`;
}

function moverCarrusel(dir) {
  carruselIndex = (carruselIndex + dir + carruselFotos.length) % carruselFotos.length;
  actualizarCoverflow();
}
function irASlide(i) {
  carruselIndex = i;
  actualizarCoverflow();
}

let touchStartX = 0;
document.addEventListener('touchstart', function(e) {
  if (e.target.closest('.coverflow-wrap')) touchStartX = e.touches[0].clientX;
}, { passive: true });
document.addEventListener('touchend', function(e) {
  if (e.target.closest('.coverflow-wrap')) {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) moverCarrusel(diff > 0 ? 1 : -1);
  }
}, { passive: true });

/* ════════════════════════════════
   MODAL NIVELES
════════════════════════════════ */
const nivelesInfo = {
  inicial:    { icon: '🌱', titulo: 'Nivel Inicial',    desc: 'Estimulación temprana y desarrollo integral en un ambiente lúdico, seguro y estimulante para niños de 3 a 5 años.' },
  primaria:   { icon: '📚', titulo: 'Nivel Primaria',   desc: 'Formación sólida en competencias fundamentales: lectura, matemáticas, ciencias y habilidades para la vida. Del 1° al 6° grado.' },
  secundaria: { icon: '🎓', titulo: 'Nivel Secundaria', desc: 'Preparación integral para el ingreso a la universidad con orientación vocacional y desarrollo del liderazgo. Del 1° al 5° año.' }
};

async function abrirNivel(nivel) {
  const info = nivelesInfo[nivel];
  if (!info) return;
  document.getElementById('nivel-modal-icon').textContent    = info.icon;
  document.getElementById('nivel-modal-titulo').textContent  = info.titulo;
  document.getElementById('nivel-modal-desc').textContent    = info.desc;
  document.getElementById('nivel-modal-cargando').style.display  = 'flex';
  document.getElementById('nivel-modal-sin-fotos').style.display = 'none';
  document.getElementById('nivel-modal-fotos').style.display     = 'none';
  document.getElementById('modal-nivel').classList.add('activo');
  document.body.style.overflow = 'hidden';
  try {
    const { data: nivData, error: nivError } = await supabase
      .from('niveles').select('id, descripcion').eq('nivel', nivel).single();
    if (!nivError && nivData && nivData.descripcion) {
      document.getElementById('nivel-modal-desc').textContent = nivData.descripcion;
    }
    const nivelId = nivData ? nivData.id : null;
    let fotosData = [];
    if (nivelId) {
      const { data, error } = await supabase
        .from('niveles_fotos').select('*').eq('nivel_id', nivelId).order('orden', { ascending: true });
      if (!error && data) fotosData = data;
    }
    document.getElementById('nivel-modal-cargando').style.display = 'none';
    if (!fotosData.length) {
      document.getElementById('nivel-modal-sin-fotos').style.display = 'flex';
      return;
    }
    if (fotosData.length === 1) {
      const galeria = document.getElementById('nivel-modal-fotos');
      galeria.style.display = 'block';
      galeria.innerHTML = `
        <div class="nivel-foto-unica">
          <img src="${fotosData[0].foto_url}" alt="${fotosData[0].descripcion || info.titulo}" loading="lazy"/>
          ${fotosData[0].descripcion ? `<div class="coverflow-caption">${fotosData[0].descripcion}</div>` : ''}
        </div>
      `;
      return;
    }
    renderCarrusel(fotosData, info);
  } catch(err) {
    document.getElementById('nivel-modal-cargando').style.display    = 'none';
    document.getElementById('nivel-modal-sin-fotos').style.display   = 'flex';
    console.error('Error cargando nivel:', err);
  }
}

function cerrarNivel(event) {
  if (event && event.target !== document.getElementById('modal-nivel')) return;
  document.getElementById('modal-nivel').classList.remove('activo');
  document.body.style.overflow = '';
  carruselIndex = 0;
  carruselFotos = [];
}

/* ════════════════════════════════
   HERO CAROUSEL (imágenes fondo)
════════════════════════════════ */
let heroSlideIndex = 0;
let heroSlideTimer = null;

function irHeroSlide(n) {
  const slides = document.querySelectorAll('.hero-carousel-slide');
  const dots   = document.querySelectorAll('.hero-dot');
  if (!slides.length) return;
  slides[heroSlideIndex].classList.remove('active');
  dots[heroSlideIndex] && dots[heroSlideIndex].classList.remove('active');
  heroSlideIndex = (n + slides.length) % slides.length;
  slides[heroSlideIndex].classList.add('active');
  dots[heroSlideIndex] && dots[heroSlideIndex].classList.add('active');
}
function avanzarHeroSlide() { irHeroSlide(heroSlideIndex + 1); }
function initHeroCarousel() {
  const slides = document.querySelectorAll('.hero-carousel-slide');
  if (slides.length <= 1) return;
  heroSlideTimer = setInterval(avanzarHeroSlide, 4500);
  const hero = document.querySelector('.hero');
  if (hero) {
    hero.addEventListener('mouseenter', function() { clearInterval(heroSlideTimer); });
    hero.addEventListener('mouseleave', function() {
      clearInterval(heroSlideTimer);
      heroSlideTimer = setInterval(avanzarHeroSlide, 4500);
    });
  }
}

/* ════════════════════════════════
   BANNER SHIMMER
════════════════════════════════ */
function initBannerShimmer() {
  const banners = document.querySelectorAll('.banner-wrap');
  if (!banners.length) return;
  const obs = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) entry.target.classList.add('visible-banner');
    });
  }, { threshold: 0.3 });
  banners.forEach(function(b) { obs.observe(b); });
}

/* ════════════════════════════════
   ARCO DORADO — letras en bucle
════════════════════════════════ */
function animarArcoLetras() {
  const palabras = [
    { id: 'arco-mario',  texto: 'Mario',  delay: 0    },
    { id: 'arco-vargas', texto: 'Vargas', delay: 0.6  },
    { id: 'arco-llosa',  texto: 'Llosa',  delay: 1.15 },
  ];
  palabras.forEach(function(p) {
    const el = document.getElementById(p.id);
    if (!el) return;
    const letras   = p.texto.split('');
    const textPath = el.querySelector('textPath');
    if (!textPath) return;
    const offset = textPath.getAttribute('startOffset');
    const anchor = textPath.getAttribute('text-anchor');
    const href   = textPath.getAttribute('href');
    el.innerHTML =
      `<textPath href="${href}" startOffset="${offset}" text-anchor="${anchor}">` +
      letras.map(function(l, i) {
        return `<tspan class="arco-letra" style="--ld:${p.delay + i * 0.09}s">${l === ' ' ? '\u00A0' : l}</tspan>`;
      }).join('') +
      `</textPath>`;
  });

  function lanzarAnimacion() {
    document.querySelectorAll('.arco-letra').forEach(function(el) {
      el.classList.remove('arco-letra-in');
      void el.offsetWidth;
      el.classList.add('arco-letra-in');
    });
  }
  setTimeout(lanzarAnimacion, 100);
  setInterval(lanzarAnimacion, 5000);
}

/* ════════════════════════════════
   PARTÍCULAS FLOTANTES
════════════════════════════════ */
function initParticlesBackground() {
  const canvas = document.getElementById('particles-bg');
  if (!canvas) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ctx = canvas.getContext('2d');
  let width, height, particulas;
  function resize() {
    width  = canvas.width  = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();
  const colores = [
    'rgba(240,165,0,0.55)',
    'rgba(255,255,255,0.35)',
    'rgba(30,79,168,0.5)'
  ];
  const cantidad = Math.min(80, Math.floor((width * height) / 16000));
  particulas = Array.from({ length: cantidad }, function() {
    return {
      x: Math.random() * width, y: Math.random() * height,
      r: Math.random() * 2.2 + 0.6,
      dx: (Math.random() - 0.5) * 0.25,
      dy: (Math.random() - 0.5) * 0.25,
      color: colores[Math.floor(Math.random() * colores.length)]
    };
  });
  function animar() {
    ctx.clearRect(0, 0, width, height);
    particulas.forEach(function(p) {
      p.x += p.dx; p.y += p.dy;
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    });
    requestAnimationFrame(animar);
  }
  animar();
}

/* ════════════════════════════════
   CURSOR DORADO
════════════════════════════════ */
function initCursorDorado() {
  const esPC = window.matchMedia('(pointer: fine)').matches && window.innerWidth > 768;
  if (!esPC) return;
  const cursor = document.createElement('div');
  cursor.id = 'cursor-dorado';
  document.body.appendChild(cursor);
  const halo = document.createElement('div');
  halo.id = 'cursor-halo';
  document.body.appendChild(halo);
  let cx = 0, cy = 0, hx = 0, hy = 0;
  window.addEventListener('mousemove', function(e) {
    cx = e.clientX; cy = e.clientY;
    cursor.style.left = cx + 'px';
    cursor.style.top  = cy + 'px';
  });
  function animarHalo() {
    hx += (cx - hx) * 0.15;
    hy += (cy - hy) * 0.15;
    halo.style.left = hx + 'px';
    halo.style.top  = hy + 'px';
    requestAnimationFrame(animarHalo);
  }
  animarHalo();
}

/* ════════════════════════════════
   LENIS SCROLL SUAVE
════════════════════════════════ */
let lenis;
function initSmoothScroll() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (typeof Lenis === 'undefined') return;
  lenis = new Lenis({
    duration: 1.4,
    easing: function(t) { return 1 - Math.pow(1 - t, 4); },
    orientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 0.55,
    touchMultiplier: 2,
    infinite: false
  });
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function(time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
}

/* ════════════════════════════════
   MÚSICA AUTOMÁTICA
════════════════════════════════ */
function initMusica() {
  const music = document.getElementById('bg-music');
  if (!music) return;
  music.volume = 0.35;
  music.play().catch(function() {
    document.addEventListener('click', function iniciar() {
      music.play();
      document.removeEventListener('click', iniciar);
    }, { once: true });
  });
}

/* ════════════════════════════════
   SCROLL A HASH (desde otras páginas)
════════════════════════════════ */
function initHashScroll() {
  if (!window.location.hash) return;
  const id = window.location.hash.substring(1);
  setTimeout(function() {
    const destino = document.getElementById(id);
    if (!destino) return;
    if (lenis) {
      lenis.scrollTo(destino, { offset: -70, duration: 1.2 });
    } else {
      destino.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 800);
}

/* ════════════════════════════════
   INIT GLOBAL
════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function() {
  verificarNuevoAnuncio();
  cargarActividades();
  cargarRevistas();
  cargarAnuncios();
  cargarDireccion();
  initSmoothScroll();
  initRevealGSAP();
  initParallax();
  initContadores();
  init3DNivelCards();
  initHeroCarousel();
  initBannerShimmer();
  animarArcoLetras();
  initMusica();
  initParticlesBackground();
  initCursorDorado();
  initHashScroll();
});
