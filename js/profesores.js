async function cargarPermanentes() {
  const cargando = document.getElementById('cargando-perm');
  const sinDatos = document.getElementById('sin-perm');
  const grid     = document.getElementById('grid-permanentes');

  try {
    const { data, error } = await window.supabase
      .from('profesores_permanentes')
      .select('*')
      .order('orden', { ascending: true });

    cargando.style.display = 'none';

    if (error || !data || data.length === 0) {
      sinDatos.style.display = 'flex';
      return;
    }
    grid.style.display = 'grid';
    grid.innerHTML = data.map(p => `
      <div class="profe-perm-card">
        <div class="profe-perm-avatar">
          ${p.foto_url
            ? `<img src="${p.foto_url}" alt="${p.nombre}"/>`
            : ''
          }
        </div>
        <div class="profe-perm-nombre">${p.nombre}</div>
        <div class="profe-perm-curso">${p.curso}</div>
      </div>
    `).join('');

  } catch (err) {
    cargando.style.display = 'none';
    sinDatos.style.display = 'flex';
    console.error('Error cargando permanentes:', err);
  }
}
async function cargarTemporales() {
  const cargando = document.getElementById('cargando-temp');
  const sinDatos = document.getElementById('sin-temp');
  const lista    = document.getElementById('lista-temporales');
  try {
    const { data, error } = await window.supabase
      .from('profesores_temporales')
      .select('*')
      .order('created_at', { ascending: true });
    cargando.style.display = 'none';

    if (error || !data || data.length === 0) {
      sinDatos.style.display = 'flex';
      return;
    }
    lista.style.display = 'grid';
    lista.innerHTML = data.map(p => `
      <div class="profe-temp-item">
        <div class="profe-temp-dot"></div>
        <div class="profe-temp-info">
          <div class="profe-temp-nombre">${p.nombre}</div>
          <div class="profe-temp-curso">${p.curso}</div>
        </div>
        <div class="profe-temp-badge">Temporal</div>
      </div>
    `).join('');
  } catch (err) {
    cargando.style.display = 'none';
    sinDatos.style.display = 'flex';
    console.error('Error cargando temporales:', err);
  }
}
cargarPermanentes();
cargarTemporales();
setTimeout(initRevealProfesores, 800);
function initRevealProfesores() {
  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  setTimeout(function() {
    document.querySelectorAll('.profe-perm-card, .profe-temp-item').forEach(function(el, i) {
      el.classList.add('reveal');
      const delay = i % 4;
      if (delay === 1) el.classList.add('reveal-delay-1');
      if (delay === 2) el.classList.add('reveal-delay-2');
      if (delay === 3) el.classList.add('reveal-delay-3');
      observer.observe(el);
    });
  }, 500);
}
