/* ============================================================
   OPINIONES Y "ME GUSTA" — lado público
   Requiere: window.supabase ya inicializado (js/supabase.js)
   Tablas reales en Supabase:
     megusta(id, tipo, item_id, session_id, created_at)
     opiniones(id, tipo, item_id, nombre, comentario, aprobado, created_at)
   El conteo de "me gusta" es el número de filas en "megusta"
   para ese item (no hay columna de contador en actividades/anuncios).
   ============================================================ */

/* ---------- Identidad anónima del visitante (persistente en el navegador) ---------- */
function obtenerSessionId() {
  try {
    let sid = localStorage.getItem('mvll_session_id');
    if (!sid) {
      sid = (crypto && crypto.randomUUID) ? crypto.randomUUID() :
        'sid-' + Date.now() + '-' + Math.random().toString(16).slice(2);
      localStorage.setItem('mvll_session_id', sid);
    }
    return sid;
  } catch (e) {
    return 'sid-temp-' + Math.random().toString(16).slice(2);
  }
}

/* ---------- Me gusta (uno por visitante, vía localStorage) ---------- */
function yaDioLike(tipo, id) {
  try { return localStorage.getItem('mvll_like_' + tipo + '_' + id) === '1'; }
  catch (e) { return false; }
}
function marcarLikeDado(tipo, id) {
  try { localStorage.setItem('mvll_like_' + tipo + '_' + id, '1'); }
  catch (e) {}
}

/* Trae cuántos "me gusta" tiene cada item de un tipo, en una sola consulta.
   Devuelve un objeto { item_id: cantidad } */
async function obtenerConteosLikes(tipo) {
  try {
    const { data, error } = await supabase
      .from('megusta')
      .select('item_id')
      .eq('tipo', tipo);
    if (error || !data) return {};
    const conteos = {};
    data.forEach(fila => {
      conteos[fila.item_id] = (conteos[fila.item_id] || 0) + 1;
    });
    return conteos;
  } catch (e) {
    console.error('Error al contar likes:', e);
    return {};
  }
}

async function darLike(tipo, id, btn) {
  if (yaDioLike(tipo, id)) return;
  if (btn) btn.disabled = true;
  try {
    const { error } = await supabase.from('megusta').insert({
      tipo: tipo,
      item_id: id,
      session_id: obtenerSessionId()
    });
    if (error) throw error;
    marcarLikeDado(tipo, id);

    // refleja el nuevo conteo en todos los botones de like de este mismo item
    // (puede haber uno en la tarjeta y otro en el modal de detalle a la vez)
    document.querySelectorAll('.op-like-btn[onclick*="' + id + '"]').forEach(b => {
      b.classList.add('op-like-dado');
      b.disabled = true;
      const icono = b.querySelector('.op-like-icono');
      if (icono) icono.textContent = '❤️';
      const count = b.querySelector('.op-like-count');
      if (count) count.textContent = (parseInt(count.textContent, 10) || 0) + 1;
    });
  } catch (err) {
    console.error('Error al dar like:', err);
    if (btn) btn.disabled = false;
  }
}

/* ---------- Tiempo relativo simple ---------- */
function tiempoRelativoOp(fechaISO) {
  const ahora = new Date();
  const fecha = new Date(fechaISO);
  const segs = Math.floor((ahora - fecha) / 1000);
  if (segs < 60) return 'hace un momento';
  const mins = Math.floor(segs / 60);
  if (mins < 60) return 'hace ' + mins + ' min';
  const horas = Math.floor(mins / 60);
  if (horas < 24) return 'hace ' + horas + 'h';
  const dias = Math.floor(horas / 24);
  if (dias < 30) return 'hace ' + dias + 'd';
  return fecha.toLocaleDateString('es-PE');
}

/* ---------- Lista de opiniones aprobadas (dentro del modal de detalle) ---------- */
async function cargarOpinionesPublicas(tipo, id, contenedorId) {
  const cont = document.getElementById(contenedorId);
  if (!cont) return;
  try {
    const { data, error } = await supabase
      .from('opiniones')
      .select('*')
      .eq('tipo', tipo).eq('item_id', id).eq('aprobado', true)
      .order('created_at', { ascending: false });
    if (error || !data || !data.length) { cont.innerHTML = ''; return; }
    cont.innerHTML =
      '<div class="op-lista-titulo">Opiniones (' + data.length + ')</div>' +
      data.map(o => `
        <div class="op-opinion-item">
          <div class="op-opinion-avatar">${(o.nombre || '?').trim().charAt(0).toUpperCase()}</div>
          <div class="op-opinion-cuerpo">
            <div class="op-opinion-cab"><strong>${o.nombre}</strong><span>${tiempoRelativoOp(o.created_at)}</span></div>
            <p>${o.comentario}</p>
          </div>
        </div>
      `).join('');
  } catch (err) {
    console.error('Error al cargar opiniones:', err);
  }
}

/* ---------- Formulario "Dejar opinión" ---------- */
function abrirFormOpinion(tipo, id, titulo) {
  const existente = document.getElementById('op-form-overlay');
  if (existente) existente.remove();

  const overlay = document.createElement('div');
  overlay.id = 'op-form-overlay';
  overlay.className = 'op-form-overlay';
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) overlay.remove();
  });
  overlay.innerHTML = `
    <div class="op-form-caja">
      <button type="button" class="op-form-cerrar" onclick="document.getElementById('op-form-overlay').remove()">✕</button>
      <h3>Deja tu opinión</h3>
      <p class="op-form-sub">${titulo}</p>
      <div id="op-form-exito" class="op-form-exito" style="display:none;">¡Gracias! Tu opinión quedó enviada para revisión. 💬</div>
      <div id="op-form-campos">
        <label for="op-form-nombre">Tu nombre</label>
        <input type="text" id="op-form-nombre" maxlength="60" placeholder="Nombre y apellido"/>
        <label for="op-form-comentario">Tu opinión</label>
        <textarea id="op-form-comentario" maxlength="400" rows="4" placeholder="Cuéntanos qué te pareció..."></textarea>
        <div id="op-form-error" class="op-form-error" style="display:none;"></div>
        <button type="button" class="op-form-enviar" id="op-form-btn"
          onclick="enviarOpinion('${tipo}','${id}')">Enviar opinión</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

async function enviarOpinion(tipo, id) {
  const nombre = document.getElementById('op-form-nombre').value.trim();
  const comentario = document.getElementById('op-form-comentario').value.trim();
  const errorEl = document.getElementById('op-form-error');
  const btn = document.getElementById('op-form-btn');
  errorEl.style.display = 'none';

  if (!nombre || !comentario) {
    errorEl.textContent = 'Completa tu nombre y tu opinión.';
    errorEl.style.display = 'block';
    return;
  }
  btn.disabled = true;
  btn.textContent = 'Enviando...';
  try {
    const { error } = await supabase.from('opiniones').insert({
      tipo: tipo,
      item_id: id,
      nombre: nombre,
      comentario: comentario,
      aprobado: false
    });
    if (error) throw error;
    document.getElementById('op-form-campos').style.display = 'none';
    document.getElementById('op-form-exito').style.display = 'block';
    setTimeout(() => {
      const ov = document.getElementById('op-form-overlay');
      if (ov) ov.remove();
    }, 2200);
  } catch (err) {
    console.error('Error al enviar opinión:', err);
    errorEl.textContent = 'No se pudo enviar tu opinión. Intenta de nuevo.';
    errorEl.style.display = 'block';
    btn.disabled = false;
    btn.textContent = 'Enviar opinión';
  }
}
