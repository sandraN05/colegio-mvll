// ══════════════════════════════════════════════════
//  PROMOTORES — página pública promotores.html
//  Muestra TODO el contenido (todos los admins)
// ══════════════════════════════════════════════════
async function cargarPromotores() {
  const cargando = document.getElementById('cargando-promotores');
  const sinDatos = document.getElementById('sin-promotores');
  const grid     = document.getElementById('grid-promotores');
  if (!grid) return;

  try {
    const { data, error } = await supabase
      .from('promotores')
      .select('*')
      .order('orden', { ascending: true });

    cargando.style.display = 'none';

    if (error || !data || !data.length) {
      sinDatos.style.display = 'flex';
      return;
    }

    grid.style.display = 'grid';
    grid.innerHTML = data.map(p => `
      <div class="profe-card-grande">
        <div class="profe-avatar-grande">
          ${p.foto_url
            ? `<img src="${p.foto_url}" alt="${p.nombre}"/>`
            : `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="1.2">
                <circle cx="12" cy="8" r="4"/>
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
               </svg>`
          }
        </div>
        <div class="profe-name">${p.nombre}</div>
        ${p.cargo ? `<div class="profe-curso">${p.cargo}</div>` : ''}
      </div>
    `).join('');

  } catch(err) {
    cargando.style.display = 'none';
    sinDatos.style.display = 'flex';
    console.error(err);
  }
}

document.addEventListener('DOMContentLoaded', cargarPromotores);