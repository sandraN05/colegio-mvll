async function cargarInvestigadores() {
  const cargando = document.getElementById('cargando-inv');
  const sinDatos = document.getElementById('sin-inv');
  const grid = document.getElementById('grid-inv');
  if (!grid) return;
  try {
    const { data, error } = await supabase
      .from('investigadores')
      .select('*')
      .order('orden', { ascending: true });
    cargando.style.display = 'none';
    if (error || !data || !data.length) {
      sinDatos.style.display = 'flex';
      return;
    }
const perfilesAcademicos = {
  'Dr. Luis Alberto Almanza Ope': 'https://scholar.google.com/citations?hl=es&user=I5-LU6oAAAAJ',
  'Dr. Carlos David Laura Quispe': 'https://scholar.google.com/citations?hl=es&user=vgjClNcAAAAJ'
  // Dr. Angel Pilco Escobedo no tiene perfil propio, usa busqueda general
};

grid.style.display = 'grid';
grid.innerHTML = data.map(p => {
  const urlPerfil = perfilesAcademicos[p.nombre] || ('https://scholar.google.com/scholar?q=' + encodeURIComponent(p.nombre));
  return `
  <a class="profe-card-grande" href="${urlPerfil}" target="_blank" rel="noopener noreferrer" title="Ver perfil académico de ${p.nombre}">
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
  </a>
`;
}).join('');
  } catch(err) {
    cargando.style.display = 'none';
    sinDatos.style.display = 'flex';
    console.error(err);
  }
}

document.addEventListener('DOMContentLoaded', cargarInvestigadores);
