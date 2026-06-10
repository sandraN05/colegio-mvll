// ══════════════════════════════════════════════════
//  ESCUELA DE INVESTIGACIÓN — página pública
// ══════════════════════════════════════════════════
async function cargarEscuela() {
  const cargando = document.getElementById('cargando-esc');
  const sinDatos = document.getElementById('sin-esc');
  const lista    = document.getElementById('lista-esc');
  if (!lista) return;

  try {
    const { data, error } = await supabase
      .from('escuela_investigacion')
      .select('*')
      .order('created_at', { ascending: true });

    cargando.style.display = 'none';

    if (error || !data || !data.length) {
      sinDatos.style.display = 'flex';
      return;
    }

    lista.style.display = 'block';
    lista.innerHTML = data.map(item => `
      <div class="inv-card">
        <h3 class="inv-card-titulo">${item.titulo}</h3>
        <div class="inv-card-cuerpo">${item.cuerpo || ''}</div>
      </div>
    `).join('');

  } catch(err) {
    cargando.style.display = 'none';
    sinDatos.style.display = 'flex';
    console.error(err);
  }
}

document.addEventListener('DOMContentLoaded', cargarEscuela);