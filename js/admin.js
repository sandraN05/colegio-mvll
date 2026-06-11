async function verificarAdmin() {
  const { data: { session } } = await window.supabase.auth.getSession();
  if (!session) window.location.href = 'login.html';
}
verificarAdmin();

function mostrarTab(tab, btn) {
  document.querySelectorAll('.tab-contenido').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.sidebar-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  if (btn) btn.classList.add('active');

  if      (tab === 'actividades')    cargarActividades();
  else if (tab === 'revistas')       cargarRevistas();
  else if (tab === 'anuncios')       cargarAnuncios();
  else if (tab === 'archivados')     cargarArchivados();
  else if (tab === 'niveles')        cargarFotosNivel('inicial');
  else if (tab === 'permanentes')    cargarPermanentes();
  else if (tab === 'temporales')     cargarTemporales();
  else if (tab === 'promotores')     cargarPromotoresAdmin();
  else if (tab === 'direccion')      cargarDireccionAdmin();
  else if (tab === 'investigadores') cargarInvestigadoresAdmin();
  else if (tab === 'escuela') cargarEscuelaAdmin();
}
async function cerrarSesion() {
  await window.supabase.auth.signOut();
  window.location.href = 'login.html';
}
async function getUser() {
  const { data: { user } } = await window.supabase.auth.getUser();
  return user;
}

async function cargarActividades() {
  const lista = document.getElementById('lista-act');
  lista.innerHTML = '<p style="color:#94a3b8;padding:20px">Cargando...</p>';

  const ahora = new Date().toISOString();
  const user  = await getUser();

  const { data, error } = await window.supabase
    .from('actividades')
    .select('*')
    .eq('usuario_id', user.id)    
    .eq('estado', 'activo')
    .gt('fecha_expiracion', ahora)
    .order('fecha', { ascending: false });

  if (error) { lista.innerHTML = '<p style="color:red">Error al cargar actividades.</p>'; return; }

  if (!data.length) {
    lista.innerHTML = '<div class="admin-empty"><span>🎉</span><p>No hay actividades aún. ¡Agrega la primera!</p></div>';
    return;
  }
  lista.innerHTML = data.map(a => `
    <div class="admin-item">
      <div class="admin-item-img">
        ${a.imagen_url ? `<img src="${a.imagen_url}" alt="${a.titulo}"/>` : '<span style="font-size:2rem">🎉</span>'}
      </div>
      <div class="admin-item-info">
        <h4>${a.titulo}</h4>
        <p>${a.descripcion || 'Sin descripción'}</p>
        <div class="admin-item-meta"> ${formatearFecha(a.fecha)} · ${a.categoria || 'otro'}</div>
      </div>
      <div class="admin-item-acciones">
        <button class="btn-editar"   onclick="editarActividad('${a.id}')">✏️ Editar</button>
        <button class="btn-eliminar" onclick="confirmarEliminar('actividad','${a.id}','${a.titulo.replace(/'/g,"\\'")}')">🗑 Eliminar</button>
      </div>
    </div>
  `).join('');
}
async function editarActividad(id) {
  const user = await getUser();
  const { data, error } = await window.supabase
    .from('actividades').select('*')
    .eq('id', id).eq('usuario_id', user.id).single();
  if (error || !data) return;
  document.getElementById('modal-act-titulo').textContent = 'Editar actividad';
  document.getElementById('act-id').value        = data.id;
  document.getElementById('act-titulo').value    = data.titulo;
  document.getElementById('act-desc').value      = data.descripcion || '';
  document.getElementById('act-fecha').value     = data.fecha;
  document.getElementById('act-categoria').value = data.categoria || 'otro';
  if (data.imagen_url) {
    document.getElementById('act-img-actual').src = data.imagen_url;
    document.getElementById('act-imagen-preview').style.display = 'block';
  }
  document.getElementById('modal-actividad').classList.add('activo');
}
async function guardarActividad() {
  const btn     = document.getElementById('btn-guardar-act');
  const errorEl = document.getElementById('act-error');
  const titulo  = document.getElementById('act-titulo').value.trim();
  const fecha   = document.getElementById('act-fecha').value;

  if (!titulo || !fecha) {
    errorEl.textContent = 'El título y la fecha son obligatorios.';
    errorEl.style.display = 'block'; return;
  }

  btn.textContent = 'Guardando...'; btn.disabled = true;
  errorEl.style.display = 'none';

  const id         = document.getElementById('act-id').value;
  const imagenFile = document.getElementById('act-imagen').files[0];
  let imagen_url   = null;

  if (imagenFile) {
    const ext  = imagenFile.name.split('.').pop();
    const path = 'actividades/' + Date.now() + '.' + ext;
    const { error: upError } = await window.supabase.storage.from('archivos').upload(path, imagenFile, { upsert: true });
    if (!upError) {
      const { data: urlData } = window.supabase.storage.from('archivos').getPublicUrl(path);
      imagen_url = urlData.publicUrl;
    }
  } else if (id && document.getElementById('act-imagen-preview').style.display !== 'none') {
    imagen_url = document.getElementById('act-img-actual').src || null;
  }

  const fechaExp  = new Date(); fechaExp.setMonth(fechaExp.getMonth() + 5);
  const fechaElim = new Date(); fechaElim.setMonth(fechaElim.getMonth() + 11);
  const user = await getUser();

  const payload = {
    titulo:           titulo,
    descripcion:      document.getElementById('act-desc').value.trim(),
    fecha:            fecha,
    categoria:        document.getElementById('act-categoria').value,
    imagen_url:       imagen_url,
    fecha_expiracion: fechaExp.toISOString(),
    fecha_eliminacion:fechaElim.toISOString(),
    estado:           'activo',
    usuario_id:       user.id     
  };
  let error;
  if (id) {
    ({ error } = await window.supabase.from('actividades').update(payload).eq('id', id).eq('usuario_id', user.id));
  } else {
    ({ error } = await window.supabase.from('actividades').insert(payload));
  }
  if (error) {
    errorEl.textContent = 'Error al guardar: ' + error.message;
    errorEl.style.display = 'block';
    btn.textContent = 'Guardar'; btn.disabled = false; return;
  }
  cerrarModal('actividad');
  cargarActividades();
}
async function cargarAnuncios() {
  const lista = document.getElementById('lista-anu');
  lista.innerHTML = '<p style="color:#94a3b8;padding:20px">Cargando...</p>';

  const ahora = new Date().toISOString();
  const user  = await getUser();

  const { data, error } = await window.supabase
    .from('anuncios').select('*')
    .eq('usuario_id', user.id)       
    .eq('estado', 'activo')
    .gt('fecha_expiracion', ahora)
    .order('fecha_evento', { ascending: true });

  if (error) { lista.innerHTML = '<p style="color:red">Error al cargar anuncios.</p>'; return; }
  if (!data.length) {
    lista.innerHTML = '<div class="admin-empty"><span></span><p>No hay anuncios aún. ¡Agrega el primero!</p></div>';
    return;
  }
  lista.innerHTML = data.map(a => `
    <div class="admin-item">
      <div class="admin-item-img">
        ${a.imagen_url ? `<img src="${a.imagen_url}" alt="${a.titulo}"/>` : '<span style="font-size:2rem">📢</span>'}
      </div>
      <div class="admin-item-info">
        <h4>${a.titulo}</h4>
        <p>${a.descripcion || 'Sin descripción'}</p>
        <div class="admin-item-meta">
          ${a.fecha_evento ? '📅 ' + formatearFecha(a.fecha_evento) : ''}
          ${a.hora  ? ' · 🕐 ' + a.hora  : ''}
          ${a.lugar ? ' · 📍 ' + a.lugar : ''}
        </div>
      </div>
      <div class="admin-item-acciones">
        <button class="btn-editar"   onclick="editarAnuncio('${a.id}')">✏️ Editar</button>
        <button class="btn-eliminar" onclick="confirmarEliminar('anuncio','${a.id}','${a.titulo.replace(/'/g,"\\'")}')">🗑 Eliminar</button>
      </div>
    </div>
  `).join('');
}
async function editarAnuncio(id) {
  const user = await getUser();
  const { data, error } = await window.supabase
    .from('anuncios').select('*')
    .eq('id', id).eq('usuario_id', user.id).single();
  if (error || !data) return;
  document.getElementById('modal-anu-titulo').textContent = 'Editar anuncio';
  document.getElementById('anu-id').value    = data.id;
  document.getElementById('anu-titulo').value = data.titulo;
  document.getElementById('anu-desc').value  = data.descripcion || '';
  document.getElementById('anu-fecha').value = data.fecha_evento || '';
  document.getElementById('anu-hora').value  = data.hora || '';
  document.getElementById('anu-lugar').value = data.lugar || '';
  if (data.imagen_url) {
    document.getElementById('anu-img-actual').src = data.imagen_url;
    document.getElementById('anu-imagen-preview').style.display = 'block';
  }
  document.getElementById('modal-anuncio').classList.add('activo');
}

async function guardarAnuncio() {
  const btn     = document.getElementById('btn-guardar-anu');
  const errorEl = document.getElementById('anu-error');
  const titulo  = document.getElementById('anu-titulo').value.trim();

  if (!titulo) {
    errorEl.textContent = 'El título es obligatorio.';
    errorEl.style.display = 'block'; return;
  }

  btn.textContent = 'Guardando...'; btn.disabled = true;
  errorEl.style.display = 'none';

  const id         = document.getElementById('anu-id').value;
  const imagenFile = document.getElementById('anu-imagen').files[0];
  let imagen_url   = null;

  if (imagenFile) {
    const ext  = imagenFile.name.split('.').pop();
    const path = 'anuncios/' + Date.now() + '.' + ext;
    const { error: upError } = await window.supabase.storage.from('archivos').upload(path, imagenFile, { upsert: true });
    if (!upError) {
      const { data: urlData } = window.supabase.storage.from('archivos').getPublicUrl(path);
      imagen_url = urlData.publicUrl;
    }
  } else if (id && document.getElementById('anu-imagen-preview').style.display !== 'none') {
    imagen_url = document.getElementById('anu-img-actual').src || null;
  }

  const fechaExp  = new Date(); fechaExp.setMonth(fechaExp.getMonth() + 3);
  const fechaElim = new Date(); fechaElim.setMonth(fechaElim.getMonth() + 9);
  const user = await getUser();

  const payload = {
    titulo:           titulo,
    descripcion:      document.getElementById('anu-desc').value.trim(),
    fecha_evento:     document.getElementById('anu-fecha').value || null,
    hora:             document.getElementById('anu-hora').value.trim() || null,
    lugar:            document.getElementById('anu-lugar').value.trim() || null,
    imagen_url:       imagen_url,
    fecha_expiracion: fechaExp.toISOString(),
    fecha_eliminacion:fechaElim.toISOString(),
    estado:           'activo',
    usuario_id:       user.id      
  };

  let error;
  if (id) {
    ({ error } = await window.supabase.from('anuncios').update(payload).eq('id', id).eq('usuario_id', user.id));
  } else {
    ({ error } = await window.supabase.from('anuncios').insert(payload));
  }

  if (error) {
    errorEl.textContent = 'Error al guardar: ' + error.message;
    errorEl.style.display = 'block';
    btn.textContent = 'Guardar'; btn.disabled = false; return;
  }
  cerrarModal('anuncio');
  cargarAnuncios();
}
async function cargarRevistas() {
  const lista = document.getElementById('lista-rev');
  lista.innerHTML = '<p style="color:#94a3b8;padding:20px">Cargando...</p>';

  const ahora = new Date().toISOString();
  const user  = await getUser();

  const { data, error } = await window.supabase
    .from('revistas').select('*')
    .eq('usuario_id', user.id)      
    .eq('estado', 'activo')
    .gt('fecha_expiracion', ahora)
    .order('created_at', { ascending: false });

  if (error) { lista.innerHTML = '<p style="color:red">Error al cargar revistas.</p>'; return; }
  if (!data.length) {
    lista.innerHTML = '<div class="admin-empty"><span></span><p>No hay revistas aún. ¡Agrega la primera!</p></div>';
    return;
  }
  lista.innerHTML = data.map(r => `
    <div class="admin-item">
      <div class="admin-item-img">
        ${r.portada_url ? `<img src="${r.portada_url}" alt="${r.titulo}"/>` : '<span style="font-size:2rem"></span>'}
      </div>
      <div class="admin-item-info">
        <h4>${r.titulo}</h4>
        <p>${r.descripcion || 'Sin descripción'}</p>
        <div class="admin-item-meta"> PDF subido</div>
      </div>
      <div class="admin-item-acciones">
        <button class="btn-editar"   onclick="editarRevista('${r.id}')">Editar</button>
        <button class="btn-eliminar" onclick="confirmarEliminar('revista','${r.id}','${r.titulo.replace(/'/g,"\\'")}')">🗑 Eliminar</button>
      </div>
    </div>
  `).join('');
}

async function editarRevista(id) {
  const user = await getUser();
  const { data, error } = await window.supabase
    .from('revistas').select('*')
    .eq('id', id).eq('usuario_id', user.id).single();
  if (error || !data) return;
  document.getElementById('modal-rev-titulo').textContent = 'Editar revista';
  document.getElementById('rev-id').value    = data.id;
  document.getElementById('rev-titulo').value = data.titulo;
  document.getElementById('rev-desc').value  = data.descripcion || '';
  if (data.pdf_url) {
    const pdfActual = document.getElementById('rev-pdf-actual');
    pdfActual.textContent = ' Ya tiene un PDF. Sube uno nuevo para reemplazarlo.';
    pdfActual.style.display = 'block';
  }
  if (data.portada_url) {
    document.getElementById('rev-img-actual').src = data.portada_url;
    document.getElementById('rev-portada-preview').style.display = 'block';
  }
  document.getElementById('modal-revista').classList.add('activo');
}
async function guardarRevista() {
  const btn     = document.getElementById('btn-guardar-rev');
  const errorEl = document.getElementById('rev-error');
  const titulo  = document.getElementById('rev-titulo').value.trim();
  const id      = document.getElementById('rev-id').value;
  const pdfFile = document.getElementById('rev-pdf').files[0];

  if (!titulo) { errorEl.textContent = 'El título es obligatorio.'; errorEl.style.display = 'block'; return; }
  if (!id && !pdfFile) { errorEl.textContent = 'Debes subir un PDF.'; errorEl.style.display = 'block'; return; }
  btn.textContent = 'Subiendo...'; btn.disabled = true;
  errorEl.style.display = 'none';
  let pdf_url = null, portada_url = null;
  if (pdfFile) {
    const path = 'revistas/' + Date.now() + '.pdf';
    const { error: upError } = await window.supabase.storage.from('archivos').upload(path, pdfFile, { upsert: true });
    if (upError) {
      errorEl.textContent = upError.message; errorEl.style.display = 'block';
      btn.textContent = 'Guardar'; btn.disabled = false; return;
    }
    const { data: urlData } = window.supabase.storage.from('archivos').getPublicUrl(path);
    pdf_url = urlData.publicUrl;
  }
  const portadaFile = document.getElementById('rev-portada').files[0];
  if (portadaFile) {
    const ext  = portadaFile.name.split('.').pop();
    const path = 'portadas/' + Date.now() + '.' + ext;
    const { error: upError } = await window.supabase.storage.from('archivos').upload(path, portadaFile, { upsert: true });
    if (!upError) {
      const { data: urlData } = window.supabase.storage.from('archivos').getPublicUrl(path);
      portada_url = urlData.publicUrl;
    }
  }
  const fechaExp  = new Date(); fechaExp.setFullYear(fechaExp.getFullYear() + 1);
  const fechaElim = new Date(); fechaElim.setFullYear(fechaElim.getFullYear() + 2); fechaElim.setMonth(fechaElim.getMonth() + 5);
  const user = await getUser();
  const payload = {
    titulo:           titulo,
    descripcion:      document.getElementById('rev-desc').value.trim(),
    pdf_url:          pdf_url,
    portada_url:      portada_url,
    fecha_expiracion: fechaExp.toISOString(),
    fecha_eliminacion:fechaElim.toISOString(),
    estado:           'activo',
    usuario_id:       user.id   
  };
  let error;
  if (id) {
    ({ error } = await window.supabase.from('revistas').update(payload).eq('id', id).eq('usuario_id', user.id));
  } else {
    ({ error } = await window.supabase.from('revistas').insert(payload));
  }
  if (error) {
    errorEl.textContent = 'Error al guardar: ' + error.message;
    errorEl.style.display = 'block'; btn.textContent = 'Guardar'; btn.disabled = false; return;
  }
  cerrarModal('revista');
  cargarRevistas();
}
async function cargarArchivados() {
  const lista = document.getElementById('lista-archivados');
  lista.innerHTML = '<p style="color:#94a3b8;padding:20px">Cargando...</p>';

  const ahora = new Date().toISOString();
  const user  = await getUser();

  const [actRes, anuRes, revRes] = await Promise.all([
    window.supabase.from('actividades').select('*').eq('usuario_id', user.id).lt('fecha_expiracion', ahora),
    window.supabase.from('anuncios').select('*').eq('usuario_id', user.id).lt('fecha_expiracion', ahora),
    window.supabase.from('revistas').select('*').eq('usuario_id', user.id).lt('fecha_expiracion', ahora)
  ]);
  const archivados = [
    ...(actRes.data || []).map(i => ({ ...i, tipo: 'Actividad' })),
    ...(anuRes.data || []).map(i => ({ ...i, tipo: 'Anuncio' })),
    ...(revRes.data || []).map(i => ({ ...i, tipo: 'Revista' }))
  ];

  if (!archivados.length) {
    lista.innerHTML = '<div class="admin-empty"><p>No hay contenido archivado.</p></div>';
    return;
  }
  lista.innerHTML = archivados.map(item => `
    <div class="admin-item">
      <div class="admin-item-img">
        ${item.imagen_url || item.portada_url
          ? `<img src="${item.imagen_url || item.portada_url}" alt="${item.titulo}"/>`
          : '<span style="font-size:2rem">📦</span>'}
      </div>
      <div class="admin-item-info">
        <h4>${item.titulo}</h4>
        <p>${item.tipo}</p>
        <div class="admin-item-meta">Expiró: ${new Date(item.fecha_expiracion).toLocaleDateString('es-PE')}</div>
      </div>
      <div class="admin-item-acciones">
        <button class="btn-editar"   onclick="verArchivado('${item.tipo}','${item.id}')">👁 Ver</button>
        <button class="btn-editar"   onclick="restaurarArchivado('${item.tipo}','${item.id}')">♻ Restaurar</button>
        <button class="btn-eliminar" onclick="eliminarArchivado('${item.tipo}','${item.id}','${item.titulo.replace(/'/g,"\\'")}')">🗑 Eliminar</button>
      </div>
    </div>
  `).join('');
}
async function verArchivado(tipo, id) {
  const tabla = tipo === 'Actividad' ? 'actividades' : tipo === 'Anuncio' ? 'anuncios' : 'revistas';
  const user  = await getUser();
  const { data, error } = await window.supabase.from(tabla).select('*').eq('id', id).eq('usuario_id', user.id).single();
  if (error || !data) return;

  document.getElementById('ver-archivado-tipo').value          = tipo;
  document.getElementById('ver-archivado-titulo-input').value  = data.titulo || '';
  document.getElementById('ver-archivado-descripcion').value   = data.descripcion || '';
  const imagen    = data.imagen_url || data.portada_url || null;
  const contenedor = document.getElementById('ver-archivado-imagen-container');
  const img        = document.getElementById('ver-archivado-imagen');
  if (imagen) { img.src = imagen; contenedor.style.display = 'block'; }
  else { contenedor.style.display = 'none'; }
  document.getElementById('modal-ver-archivado').classList.add('activo');
}

function cerrarVerArchivado() {
  document.getElementById('modal-ver-archivado').classList.remove('activo');
}

async function restaurarArchivado(tipo, id) {
  if (!confirm('¿Deseas restaurar este contenido?')) return;

  const tabla = tipo === 'Actividad' ? 'actividades' : tipo === 'Anuncio' ? 'anuncios' : 'revistas';
  const user  = await getUser();

  const nuevaFecha = new Date();
  if      (tipo === 'Actividad') nuevaFecha.setMonth(nuevaFecha.getMonth() + 5);
  else if (tipo === 'Anuncio')   nuevaFecha.setMonth(nuevaFecha.getMonth() + 3);
  else                           nuevaFecha.setFullYear(nuevaFecha.getFullYear() + 1);

  const { error } = await window.supabase.from(tabla)
    .update({ estado: 'activo', fecha_expiracion: nuevaFecha.toISOString() })
    .eq('id', id).eq('usuario_id', user.id);

  if (error) { alert('Error al restaurar'); return; }
  cargarArchivados();
  alert(' Contenido restaurado correctamente');
}

function eliminarArchivado(tipo, id, titulo) {
  const tipoEliminar = tipo === 'Actividad' ? 'actividad' : tipo === 'Anuncio' ? 'anuncio' : 'revista';
  confirmarEliminar(tipoEliminar, id, titulo);
}
function obtenerRutaStorage(url) {
  if (!url) return null;
  const marcador = '/object/public/archivos/';
  if (!url.includes(marcador)) return null;
  return url.split(marcador)[1];
}
function confirmarEliminar(tipo, id, nombre) {
  document.getElementById('eliminar-msg').textContent = '¿Eliminar "' + nombre + '"? Esta acción no se puede deshacer.';
  document.getElementById('modal-eliminar').classList.add('activo');

  document.getElementById('btn-confirmar-eliminar').onclick = async function() {
    const user  = await getUser();
  const tabla =
    tipo === 'actividad'    ? 'actividades' :
    tipo === 'revista'      ? 'revistas' :
    tipo === 'anuncio'      ? 'anuncios' :
    tipo === 'perm'         ? 'profesores_permanentes' :
    tipo === 'temp'         ? 'profesores_temporales' :
    tipo === 'promotor'     ? 'promotores' :
    tipo === 'direccion'    ? 'direccion' :
    tipo === 'investigador' ? 'investigadores' :
    tipo === 'escuela'      ? 'escuela_investigacion' :
  'profesores_temporales';
    try {
      const { data: registro } = await window.supabase.from(tabla).select('*').eq('id', id).single();
      if (registro) {
        const archivos = [];
        if (registro.imagen_url)  { const r = obtenerRutaStorage(registro.imagen_url);  if (r) archivos.push(r); }
        if (registro.pdf_url)     { const r = obtenerRutaStorage(registro.pdf_url);     if (r) archivos.push(r); }
        if (registro.portada_url) { const r = obtenerRutaStorage(registro.portada_url); if (r) archivos.push(r); }
        if (registro.foto_url)    { const r = obtenerRutaStorage(registro.foto_url);    if (r) archivos.push(r); }
        if (archivos.length > 0) {
          await window.supabase.storage.from('archivos').remove(archivos);
        }
      }
      let q = window.supabase.from(tabla).delete().eq('id', id);
      if (['actividades','anuncios','revistas'].includes(tabla)) {
        q = q.eq('usuario_id', user.id);
      }
      const { error } = await q;

      if (error) { alert('Error al eliminar.'); return; }
      cerrarEliminar();

   if      (tipo === 'actividad')    cargarActividades();
else if (tipo === 'revista')      cargarRevistas();
else if (tipo === 'anuncio')      cargarAnuncios();
else if (tipo === 'perm')         cargarPermanentes();
else if (tipo === 'temp')         cargarTemporales();
else if (tipo === 'escuela')      cargarEscuelaAdmin();
else if (tipo === 'investigador') cargarInvestigadoresAdmin();
else if (tipo === 'promotor')     cargarPromotoresAdmin();
else if (tipo === 'direccion')    cargarDireccionAdmin();
else                              cargarArchivados();                        cargarArchivados();

    } catch(err) { alert('Error inesperado al eliminar.'); }
  };
}

function cerrarEliminar() {
  document.getElementById('modal-eliminar').classList.remove('activo');
}
async function cargarPermanentes() {
  const lista = document.getElementById('lista-perm');
  lista.innerHTML = '<p style="color:#94a3b8;padding:20px">Cargando...</p>';

  const { data, error } = await window.supabase
    .from('profesores_permanentes').select('*').order('orden', { ascending: true });

  if (error) { lista.innerHTML = '<p style="color:red">Error al cargar.</p>'; return; }
  if (!data.length) {
    lista.innerHTML = '<div class="admin-empty"><span>👨‍🏫</span><p>No hay profesores permanentes. ¡Agrega el primero!</p></div>';
    return;
  }
  lista.innerHTML = data.map(p => `
    <div class="admin-item">
      <div class="admin-item-img">
        ${p.foto_url ? `<img src="${p.foto_url}" alt="${p.nombre}"/>` : '<span style="font-size:2rem">👨‍🏫</span>'}
      </div>
      <div class="admin-item-info">
        <h4>${p.nombre}</h4>
        <p>${p.curso}</p>
        <div class="admin-item-meta">Orden: ${p.orden || 0}</div>
      </div>
      <div class="admin-item-acciones">
        <button class="btn-editar"   onclick="editarPermanente('${p.id}')">✏️ Editar</button>
        <button class="btn-eliminar" onclick="confirmarEliminar('perm','${p.id}','${p.nombre.replace(/'/g,"\\'")}')">🗑 Eliminar</button>
      </div>
    </div>
  `).join('');
}
async function editarPermanente(id) {
  const { data, error } = await window.supabase
    .from('profesores_permanentes').select('*').eq('id', id).single();
  if (error || !data) return;
  document.getElementById('modal-perm-titulo').textContent = 'Editar profesor permanente';
  document.getElementById('perm-id').value     = data.id;
  document.getElementById('perm-nombre').value = data.nombre;
  document.getElementById('perm-curso').value  = data.curso;
  document.getElementById('perm-orden').value  = data.orden || '';
  if (data.foto_url) {
    document.getElementById('perm-foto-actual').src = data.foto_url;
    document.getElementById('perm-foto-preview').style.display = 'block';
  }
  document.getElementById('modal-perm').classList.add('activo');
}
async function guardarPermanente() {
  const btn     = document.getElementById('btn-guardar-perm');
  const errorEl = document.getElementById('perm-error');
  const nombre  = document.getElementById('perm-nombre').value.trim();
  const curso   = document.getElementById('perm-curso').value.trim();

  if (!nombre || !curso) {
    errorEl.textContent = 'El nombre y el curso son obligatorios.';
    errorEl.style.display = 'block'; return;
  }
  btn.textContent = 'Guardando...'; btn.disabled = true;
  errorEl.style.display = 'none';
  const id       = document.getElementById('perm-id').value;
  const fotoFile = document.getElementById('perm-foto').files[0];
  let foto_url   = null;

  if (fotoFile) {
    const ext  = fotoFile.name.split('.').pop();
    const path = 'profesores/' + Date.now() + '.' + ext;
    const { error: upError } = await window.supabase.storage.from('archivos').upload(path, fotoFile, { upsert: true });
    if (!upError) {
      const { data: urlData } = window.supabase.storage.from('archivos').getPublicUrl(path);
      foto_url = urlData.publicUrl;
    }
  } else if (id && document.getElementById('perm-foto-preview').style.display !== 'none') {
    foto_url = document.getElementById('perm-foto-actual').src || null;
  }
  const payload = {
    nombre:   nombre,
    curso:    curso,
    orden:    parseInt(document.getElementById('perm-orden').value) || 0,
    foto_url: foto_url
  };
  let error;
  if (id) {
    ({ error } = await window.supabase.from('profesores_permanentes').update(payload).eq('id', id));
  } else {
    ({ error } = await window.supabase.from('profesores_permanentes').insert(payload));
  }
  if (error) {
    errorEl.textContent = 'Error al guardar: ' + error.message;
    errorEl.style.display = 'block'; btn.textContent = 'Guardar'; btn.disabled = false; return;
  }
  cerrarModal('perm');
  cargarPermanentes();
}
async function cargarTemporales() {
  const lista = document.getElementById('lista-temp');
  lista.innerHTML = '<p style="color:#94a3b8;padding:20px">Cargando...</p>';
  const { data, error } = await window.supabase
    .from('profesores_temporales').select('*').order('created_at', { ascending: true });

  if (error) { lista.innerHTML = '<p style="color:red">Error al cargar.</p>'; return; }
  if (!data.length) {
    lista.innerHTML = '<div class="admin-empty"><span></span><p>No hay profesores temporales. ¡Agrega el primero!</p></div>';
    return;
  }
  lista.innerHTML = data.map(p => `
    <div class="admin-item">
      <div class="admin-item-img"><span style="font-size:2rem"></span></div>
      <div class="admin-item-info">
        <h4>${p.nombre}</h4>
        <p>${p.curso}</p>
      </div>
      <div class="admin-item-acciones">
        <button class="btn-editar"   onclick="editarTemporal('${p.id}')">Editar</button>
        <button class="btn-eliminar" onclick="confirmarEliminar('temp','${p.id}','${p.nombre.replace(/'/g,"\\'")}')">🗑 Eliminar</button>
      </div>
    </div>
  `).join('');
}
async function editarTemporal(id) {
  const { data, error } = await window.supabase.from('profesores_temporales').select('*').eq('id', id).single();
  if (error || !data) return;
  document.getElementById('modal-temp-titulo').textContent = 'Editar profesor temporal';
  document.getElementById('temp-id').value     = data.id;
  document.getElementById('temp-nombre').value = data.nombre;
  document.getElementById('temp-curso').value  = data.curso;
  document.getElementById('modal-temp').classList.add('activo');
}
async function guardarTemporal() {
  const btn     = document.getElementById('btn-guardar-temp');
  const errorEl = document.getElementById('temp-error');
  const nombre  = document.getElementById('temp-nombre').value.trim();
  const curso   = document.getElementById('temp-curso').value.trim();

  if (!nombre || !curso) {
    errorEl.textContent = 'El nombre y el curso son obligatorios.';
    errorEl.style.display = 'block'; return;
  }
  btn.textContent = 'Guardando...'; btn.disabled = true;
  errorEl.style.display = 'none';
  const id      = document.getElementById('temp-id').value;
  const payload = { nombre, curso };
  let error;
  if (id) {
    ({ error } = await window.supabase.from('profesores_temporales').update(payload).eq('id', id));
  } else {
    ({ error } = await window.supabase.from('profesores_temporales').insert(payload));
  }
  if (error) {
    errorEl.textContent = 'Error al guardar: ' + error.message;
    errorEl.style.display = 'block'; btn.textContent = 'Guardar'; btn.disabled = false; return;
  }
  cerrarModal('temp');
  cargarTemporales();
}
let nivelSeleccionado   = 'inicial';
let nivelSeleccionadoId = null;

async function seleccionarNivel(nivel, btn) {
  nivelSeleccionado = nivel;
  document.querySelectorAll('.btn-nivel-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const nombres = { inicial: 'Inicial', primaria: 'Primaria', secundaria: 'Secundaria' };
  document.getElementById('nivel-actual-titulo').textContent = 'Nivel: ' + nombres[nivel];
  await cargarFotosNivel(nivel);
}
async function cargarFotosNivel(nivel) {
  nivelSeleccionado = nivel;
  const lista = document.getElementById('lista-fotos-nivel');
  lista.innerHTML = '<p style="color:#94a3b8;padding:20px">Cargando...</p>';
  let { data: nivData, error: nivError } = await window.supabase
    .from('niveles').select('id').eq('nivel', nivel).single();
  if (nivError || !nivData) {
    const { data: nuevo } = await window.supabase
      .from('niveles').insert({ nivel, descripcion: '' }).select().single();
    nivData = nuevo;
  }
  nivelSeleccionadoId = nivData ? nivData.id : null;
  if (!nivelSeleccionadoId) { lista.innerHTML = '<p style="color:red">Error al cargar el nivel.</p>'; return; }
  const { data, error } = await window.supabase
    .from('niveles_fotos').select('*').eq('nivel_id', nivelSeleccionadoId).order('orden', { ascending: true });
  if (error) { lista.innerHTML = '<p style="color:red">Error al cargar fotos.</p>'; return; }
  if (!data || !data.length) {
    lista.innerHTML = '<div class="admin-empty"><span>📷</span><p>No hay fotos para este nivel. ¡Agrega la primera!</p></div>';
    return;
  }
  lista.innerHTML = data.map(f => `
    <div class="admin-item">
      <div class="admin-item-img"><img src="${f.foto_url}" alt="foto"/></div>
      <div class="admin-item-info">
        <h4>${f.descripcion || 'Sin descripción'}</h4>
        <div class="admin-item-meta">Orden: ${f.orden || 0}</div>
      </div>
      <div class="admin-item-acciones">
        <button class="btn-editar"   onclick="editarFotoNivel('${f.id}')">Editar</button>
        <button class="btn-eliminar" onclick="confirmarEliminarFoto('${f.id}','${(f.descripcion || 'esta foto').replace(/'/g,"\\'")}')">🗑️ Eliminar</button>
      </div>
    </div>
  `).join('');
}
function abrirModalFoto() {
  document.getElementById('modal-foto-titulo').textContent = 'Agregar foto — ' + nivelSeleccionado;
  document.getElementById('foto-nivel-nivel').value = nivelSeleccionado;
  document.getElementById('modal-foto-nivel').classList.add('activo');
}
async function editarFotoNivel(id) {
  const { data, error } = await window.supabase.from('niveles_fotos').select('*').eq('id', id).single();
  if (error || !data) return;
  document.getElementById('modal-foto-titulo').textContent = ' Editar foto';
  document.getElementById('foto-nivel-id').value    = data.id;
  document.getElementById('foto-nivel-desc').value  = data.descripcion || '';
  document.getElementById('foto-nivel-orden').value = data.orden || '';
  if (data.foto_url) {
    document.getElementById('foto-nivel-actual').src = data.foto_url;
    document.getElementById('foto-nivel-preview').style.display = 'block';
  }
  document.getElementById('modal-foto-nivel').classList.add('activo');
}

async function guardarFotoNivel() {
  const btn     = document.getElementById('btn-guardar-foto-nivel');
  const errorEl = document.getElementById('foto-nivel-error');
  const id      = document.getElementById('foto-nivel-id').value;
  const archivo = document.getElementById('foto-nivel-archivo').files[0];

  if (!id && !archivo) {
    errorEl.textContent = 'Debes seleccionar una foto.';
    errorEl.style.display = 'block'; return;
  }
  btn.textContent = 'Subiendo...'; btn.disabled = true;
  errorEl.style.display = 'none';
  let foto_url = null;
  if (archivo) {
    const ext  = archivo.name.split('.').pop();
    const path = 'niveles/' + nivelSeleccionado + '/' + Date.now() + '.' + ext;
    const { error: upError } = await window.supabase.storage.from('archivos').upload(path, archivo, { upsert: true });
    if (upError) {
      errorEl.textContent = 'Error al subir la foto: ' + upError.message;
      errorEl.style.display = 'block'; btn.textContent = 'Guardar'; btn.disabled = false; return;
    }
    const { data: urlData } = window.supabase.storage.from('archivos').getPublicUrl(path);
    foto_url = urlData.publicUrl;
  } else if (id) {
    foto_url = document.getElementById('foto-nivel-actual').src;
  }
  const payload = {
    nivel_id:    nivelSeleccionadoId,
    foto_url:    foto_url,
    descripcion: document.getElementById('foto-nivel-desc').value.trim(),
    orden:       parseInt(document.getElementById('foto-nivel-orden').value) || 0
  };
  let error;
  if (id) {
    ({ error } = await window.supabase.from('niveles_fotos').update(payload).eq('id', id));
  } else {
    ({ error } = await window.supabase.from('niveles_fotos').insert(payload));
  }
  if (error) {
    errorEl.textContent = 'Error al guardar: ' + error.message;
    errorEl.style.display = 'block'; btn.textContent = 'Guardar'; btn.disabled = false; return;
  }
  cerrarModal('foto-nivel');
  cargarFotosNivel(nivelSeleccionado);
}
function confirmarEliminarFoto(id, nombre) {
  document.getElementById('eliminar-msg').textContent = '¿Eliminar "' + nombre + '"?';
  document.getElementById('modal-eliminar').classList.add('activo');
  document.getElementById('btn-confirmar-eliminar').onclick = async function() {
    await window.supabase.from('niveles_fotos').delete().eq('id', id);
    cerrarEliminar();
    cargarFotosNivel(nivelSeleccionado);
  };
}
function abrirModal(tipo) {
  limpiarModal(tipo);
  document.getElementById('modal-' + tipo).classList.add('activo');
  if (tipo === 'actividad') {
    document.getElementById('modal-act-titulo').textContent = 'Nueva actividad';
    document.getElementById('act-fecha').value = new Date().toISOString().split('T')[0];
  } else if (tipo === 'revista') {
    document.getElementById('modal-rev-titulo').textContent = 'Nueva revista';
  } else if (tipo === 'anuncio') {
    document.getElementById('modal-anu-titulo').textContent = 'Nuevo anuncio';
  } else if (tipo === 'perm') {
    document.getElementById('modal-perm-titulo').textContent = 'Nuevo profesor permanente';
  } else if (tipo === 'temp') {
    document.getElementById('modal-temp-titulo').textContent = 'Nuevo profesor temporal';
  }
}
function cerrarModal(tipo) {
  document.getElementById('modal-' + tipo).classList.remove('activo');
  limpiarModal(tipo);
}
function limpiarModal(tipo) {
  const campos = {
    'foto-nivel': ['foto-nivel-id','foto-nivel-archivo','foto-nivel-desc','foto-nivel-orden'],
    'perm':       ['perm-id','perm-nombre','perm-curso','perm-orden','perm-foto'],
    'temp':       ['temp-id','temp-nombre','temp-curso'],
    'anuncio':    ['anu-id','anu-titulo','anu-desc','anu-fecha','anu-hora','anu-lugar','anu-imagen'],
    'actividad':  ['act-id','act-titulo','act-desc','act-fecha','act-imagen'],
    'revista':    ['rev-id','rev-titulo','rev-desc','rev-pdf','rev-portada'],
    'escuela':    ['esc-id','esc-titulo','esc-cuerpo'],
  };
  const previews = {
    'foto-nivel': 'foto-nivel-preview',
    'perm':       'perm-foto-preview',
    'anuncio':    'anu-imagen-preview',
    'actividad':  'act-imagen-preview',
    'revista':    'rev-portada-preview',
  };
  const errors = {
    'foto-nivel': 'foto-nivel-error',
    'perm':       'perm-error',
    'temp':       'temp-error',
    'anuncio':    'anu-error',
    'actividad':  'act-error',
    'revista':    'rev-error',
    'escuela':    'esc-error',
  };
  const btns = {
    'foto-nivel': 'btn-guardar-foto-nivel',
    'perm':       'btn-guardar-perm',
    'temp':       'btn-guardar-temp',
    'anuncio':    'btn-guardar-anu',
    'actividad':  'btn-guardar-act',
    'revista':    'btn-guardar-rev',
    'escuela':    'btn-guardar-esc',
  };

  (campos[tipo] || []).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = (el.tagName === 'SELECT') ? (el.options[0] && el.options[0].value) : '';
  });
  if (previews[tipo]) { const el = document.getElementById(previews[tipo]); if (el) el.style.display = 'none'; }
  if (errors[tipo])   { const el = document.getElementById(errors[tipo]);   if (el) el.style.display = 'none'; }
  if (btns[tipo])     { const el = document.getElementById(btns[tipo]);     if (el) { el.textContent = 'Guardar'; el.disabled = false; } }
  if (tipo === 'actividad') { const s = document.getElementById('act-categoria'); if (s) s.value = 'otro'; }
  if (tipo === 'revista')   { const p = document.getElementById('rev-pdf-actual'); if (p) p.style.display = 'none'; }
}
function formatearFecha(fecha) {
  if (!fecha) return '';
  const [y, m, d] = fecha.split('-');
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return d + ' ' + meses[parseInt(m)-1] + ' ' + y;
}
function abrirModalPromotor() {
  limpiarModalNuevo('promotor');
  document.getElementById('modal-promotor-titulo').textContent = 'Nuevo promotor';
  document.getElementById('modal-promotor').classList.add('activo');
}
function abrirModalDireccion() {
  limpiarModalNuevo('direccion');
  document.getElementById('modal-dir-titulo').textContent = 'Nueva dirección';
  document.getElementById('modal-direccion').classList.add('activo');
}
function abrirModalInvestigador() {
  limpiarModalNuevo('investigador');
  document.getElementById('modal-inv-titulo-label').textContent = 'Nuevo contenido';
  document.getElementById('modal-investigador').classList.add('activo');
}
function limpiarModalNuevo(tipo) {
  const maps = {
    promotor: {
      campos: ['prom-id','prom-nombre','prom-cargo','prom-orden','prom-foto'],
      preview: 'prom-foto-preview',
      error: 'prom-error',
      btn: 'btn-guardar-prom'
    },
    direccion: {
      campos: ['dir-id','dir-nombre','dir-cargo','dir-descripcion','dir-foto'],
      preview: 'dir-foto-preview',
      error: 'dir-error',
      btn: 'btn-guardar-dir'
    },
  investigador: {
  campos: ['inv-id','inv-nombre','inv-cargo','inv-orden','inv-foto'],
  preview: 'inv-foto-preview',
  error: 'inv-error',
  btn: 'btn-guardar-inv'
}
  };
  const m = maps[tipo];
  if (!m) return;
  m.campos.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  if (m.preview) {
    const el = document.getElementById(m.preview);
    if (el) el.style.display = 'none';
  }
  if (m.error) {
    const el = document.getElementById(m.error);
    if (el) el.style.display = 'none';
  }
  if (m.btn) {
    const el = document.getElementById(m.btn);
    if (el) {
      el.textContent = 'Guardar';
      el.disabled = false;
    }
  }
}
const TIEMPO_INACTIVIDAD =  60 * 1000;
let temporizadorInactividad;
function reiniciarTemporizador() {
  clearTimeout(temporizadorInactividad);
  temporizadorInactividad = setTimeout(cerrarSesionPorInactividad, TIEMPO_INACTIVIDAD);
}
async function cerrarSesionPorInactividad() {
  alert('Tu sesión se cerró por inactividad.');
  await window.supabase.auth.signOut();
  window.location.href = 'login.html';
}
['mousemove','mousedown','click','scroll','keydown','touchstart'].forEach(ev => {
  document.addEventListener(ev, reiniciarTemporizador);
});
reiniciarTemporizador();
cargarActividades();
async function cargarPromotoresAdmin() {
  const lista = document.getElementById('lista-promotores');
  lista.innerHTML = '<p style="color:#94a3b8;padding:20px">Cargando...</p>';
  const user = await getUser();
  const { data, error } = await window.supabase
    .from('promotores').select('*')
    .eq('usuario_id', user.id)
    .order('orden', { ascending: true });
  if (error) { lista.innerHTML = '<p style="color:red">Error al cargar.</p>'; return; }
  if (!data.length) {
    lista.innerHTML = '<div class="admin-empty"><span>🏅</span><p>No hay promotores. ¡Agrega el primero!</p></div>';
    return;
  }
  lista.innerHTML = data.map(p => `
    <div class="admin-item">
      <div class="admin-item-img">
        ${p.foto_url ? `<img src="${p.foto_url}" alt="${p.nombre}"/>` : '<span style="font-size:2rem">🏅</span>'}
      </div>
      <div class="admin-item-info">
        <h4>${p.nombre}</h4>
        <p>${p.cargo || 'Sin cargo'}</p>
        <div class="admin-item-meta">Orden: ${p.orden || 0}</div>
      </div>
      <div class="admin-item-acciones">
        <button class="btn-editar"   onclick="editarPromotor('${p.id}')">✏️ Editar</button>
        <button class="btn-eliminar" onclick="confirmarEliminar('promotor','${p.id}','${p.nombre.replace(/'/g,"\\'")}')">🗑 Eliminar</button>
      </div>
    </div>
  `).join('');
}
async function editarPromotor(id) {
  const user = await getUser();
  const { data, error } = await window.supabase
    .from('promotores').select('*').eq('id', id).eq('usuario_id', user.id).single();
  if (error || !data) return;
  document.getElementById('modal-promotor-titulo').textContent = 'Editar promotor';
  document.getElementById('prom-id').value     = data.id;
  document.getElementById('prom-nombre').value = data.nombre;
  document.getElementById('prom-cargo').value  = data.cargo || '';
  document.getElementById('prom-orden').value  = data.orden || '';
  if (data.foto_url) {
    document.getElementById('prom-foto-actual').src = data.foto_url;
    document.getElementById('prom-foto-preview').style.display = 'block';
  }
  document.getElementById('modal-promotor').classList.add('activo');
}
async function guardarPromotor() {
  const btn     = document.getElementById('btn-guardar-prom');
  const errorEl = document.getElementById('prom-error');
  const nombre  = document.getElementById('prom-nombre').value.trim();
  if (!nombre) {
    errorEl.textContent = 'El nombre es obligatorio.';
    errorEl.style.display = 'block'; return;
  }
  btn.textContent = 'Guardando...'; btn.disabled = true;
  errorEl.style.display = 'none';
  const id       = document.getElementById('prom-id').value;
  const fotoFile = document.getElementById('prom-foto').files[0];
  let foto_url   = null;
  const user     = await getUser();
  if (fotoFile) {
    const ext  = fotoFile.name.split('.').pop();
    const path = 'promotores/' + Date.now() + '.' + ext;
    const { error: upError } = await window.supabase.storage.from('archivos').upload(path, fotoFile, { upsert: true });
    if (!upError) {
      const { data: urlData } = window.supabase.storage.from('archivos').getPublicUrl(path);
      foto_url = urlData.publicUrl;
    }
  } else if (id && document.getElementById('prom-foto-preview').style.display !== 'none') {
    foto_url = document.getElementById('prom-foto-actual').src || null;
  }
  const payload = {
    nombre:     nombre,
    cargo:      document.getElementById('prom-cargo').value.trim() || null,
    orden:      parseInt(document.getElementById('prom-orden').value) || 0,
    foto_url:   foto_url,
    usuario_id: user.id
  };
  let error;
  if (id) {
    ({ error } = await window.supabase.from('promotores').update(payload).eq('id', id).eq('usuario_id', user.id));
  } else {
    ({ error } = await window.supabase.from('promotores').insert(payload));
  }
  if (error) {
    errorEl.textContent = 'Error: ' + error.message;
    errorEl.style.display = 'block'; btn.textContent = 'Guardar'; btn.disabled = false; return;
  }
  cerrarModal('promotor');
  cargarPromotoresAdmin();
}
async function cargarDireccionAdmin() {
  const lista = document.getElementById('lista-direccion');
  lista.innerHTML = '<p style="color:#94a3b8;padding:20px">Cargando...</p>';
  const user = await getUser();
  const { data, error } = await window.supabase
    .from('direccion').select('*')
    .eq('usuario_id', user.id)
    .order('created_at', { ascending: true });

  if (error) { lista.innerHTML = '<p style="color:red">Error al cargar.</p>'; return; }
  if (!data.length) {
    lista.innerHTML = '<div class="admin-empty"><span></span><p>No hay dirección registrada. ¡Agrega la primera!</p></div>';
    return;
  }
  lista.innerHTML = data.map(d => `
    <div class="admin-item">
      <div class="admin-item-img">
        ${d.foto_url ? `<img src="${d.foto_url}" alt="${d.nombre}"/>` : '<span style="font-size:2rem"></span>'}
      </div>
      <div class="admin-item-info">
        <h4>${d.nombre}</h4>
        <p>${d.cargo || 'Sin cargo'}</p>
        ${d.descripcion ? `<div class="admin-item-meta">${d.descripcion.substring(0,60)}...</div>` : ''}
      </div>
      <div class="admin-item-acciones">
        <button class="btn-editar"   onclick="editarDireccion('${d.id}')">Editar</button>
        <button class="btn-eliminar" onclick="confirmarEliminar('direccion','${d.id}','${d.nombre.replace(/'/g,"\\'")}')">🗑 Eliminar</button>
      </div>
    </div>
  `).join('');
}
async function editarDireccion(id) {
  const user = await getUser();
  const { data, error } = await window.supabase
    .from('direccion').select('*').eq('id', id).eq('usuario_id', user.id).single();
  if (error || !data) return;

  document.getElementById('modal-dir-titulo').textContent  = 'Editar dirección';
  document.getElementById('dir-id').value                  = data.id;
  document.getElementById('dir-nombre').value              = data.nombre;
  document.getElementById('dir-cargo').value               = data.cargo || '';
  document.getElementById('dir-descripcion').value         = data.descripcion || '';
  if (data.foto_url) {
    document.getElementById('dir-foto-actual').src = data.foto_url;
    document.getElementById('dir-foto-preview').style.display = 'block';
  }
  document.getElementById('modal-direccion').classList.add('activo');
}
async function guardarDireccion() {
  const btn     = document.getElementById('btn-guardar-dir');
  const errorEl = document.getElementById('dir-error');
  const nombre  = document.getElementById('dir-nombre').value.trim();

  if (!nombre) {
    errorEl.textContent = 'El nombre es obligatorio.';
    errorEl.style.display = 'block'; return;
  }

  btn.textContent = 'Guardando...'; btn.disabled = true;
  errorEl.style.display = 'none';

  const id       = document.getElementById('dir-id').value;
  const fotoFile = document.getElementById('dir-foto').files[0];
  let foto_url   = null;
  const user     = await getUser();

  if (fotoFile) {
    const ext  = fotoFile.name.split('.').pop();
    const path = 'direccion/' + Date.now() + '.' + ext;
    const { error: upError } = await window.supabase.storage.from('archivos').upload(path, fotoFile, { upsert: true });
    if (!upError) {
      const { data: urlData } = window.supabase.storage.from('archivos').getPublicUrl(path);
      foto_url = urlData.publicUrl;
    }
  } else if (id && document.getElementById('dir-foto-preview').style.display !== 'none') {
    foto_url = document.getElementById('dir-foto-actual').src || null;
  }
  const payload = {
    nombre:      nombre,
    cargo:       document.getElementById('dir-cargo').value.trim() || null,
    descripcion: document.getElementById('dir-descripcion').value.trim() || null,
    foto_url:    foto_url,
    usuario_id:  user.id
  };
  let error;
  if (id) {
    ({ error } = await window.supabase.from('direccion').update(payload).eq('id', id).eq('usuario_id', user.id));
  } else {
    ({ error } = await window.supabase.from('direccion').insert(payload));
  }

  if (error) {
    errorEl.textContent = 'Error: ' + error.message;
    errorEl.style.display = 'block'; btn.textContent = 'Guardar'; btn.disabled = false; return;
  }
  cerrarModal('direccion');
  cargarDireccionAdmin();
}

async function cargarInvestigadoresAdmin() {
  const lista = document.getElementById('lista-investigadores');
  lista.innerHTML = '<p style="color:#94a3b8;padding:20px">Cargando...</p>';
  const user = await getUser();

  const { data, error } = await window.supabase
    .from('investigadores').select('*')
    .eq('usuario_id', user.id)
    .order('orden', { ascending: true });

  if (error) { lista.innerHTML = '<p style="color:red">Error al cargar.</p>'; return; }
  if (!data.length) {
    lista.innerHTML = '<div class="admin-empty"><span></span><p>No hay investigadores. ¡Agrega el primero!</p></div>';
    return;
  }
  lista.innerHTML = data.map(p => `
    <div class="admin-item">
      <div class="admin-item-img">
        ${p.foto_url ? `<img src="${p.foto_url}" alt="${p.nombre}"/>` : '<span style="font-size:2rem">🔬</span>'}
      </div>
      <div class="admin-item-info">
        <h4>${p.nombre}</h4>
        <p>${p.cargo || 'Sin cargo'}</p>
        <div class="admin-item-meta">Orden: ${p.orden || 0}</div>
      </div>
      <div class="admin-item-acciones">
        <button class="btn-editar"   onclick="editarInvestigador('${p.id}')"> Editar</button>
        <button class="btn-eliminar" onclick="confirmarEliminar('investigador','${p.id}','${p.nombre.replace(/'/g,"\\'")}')">🗑 Eliminar</button>
      </div>
    </div>
  `).join('');
}
async function editarInvestigador(id) {
  const user = await getUser();
  const { data, error } = await window.supabase
    .from('investigadores').select('*').eq('id', id).eq('usuario_id', user.id).single();
  if (error || !data) return;

  document.getElementById('modal-inv-titulo-label').textContent = 'Editar investigador';
  document.getElementById('inv-id').value     = data.id;
  document.getElementById('inv-nombre').value = data.nombre;
  document.getElementById('inv-cargo').value  = data.cargo || '';
  document.getElementById('inv-orden').value  = data.orden || '';
  document.getElementById('modal-investigador').classList.add('activo');
}
async function guardarInvestigador() {
  const btn     = document.getElementById('btn-guardar-inv');
  const errorEl = document.getElementById('inv-error');
  const nombre  = document.getElementById('inv-nombre').value.trim();

  if (!nombre) {
    errorEl.textContent = 'El nombre es obligatorio.';
    errorEl.style.display = 'block'; return;
  }

  btn.textContent = 'Guardando...'; btn.disabled = true;
  errorEl.style.display = 'none';

  const id       = document.getElementById('inv-id').value;
  const fotoFile = document.getElementById('inv-foto').files[0];
  let foto_url   = null;
  const user     = await getUser();

  if (fotoFile) {
    const ext  = fotoFile.name.split('.').pop();
    const path = 'investigadores/' + Date.now() + '.' + ext;
    const { error: upError } = await window.supabase.storage.from('archivos').upload(path, fotoFile, { upsert: true });
    if (!upError) {
      const { data: urlData } = window.supabase.storage.from('archivos').getPublicUrl(path);
      foto_url = urlData.publicUrl;
    }
  } else if (id && document.getElementById('inv-foto-preview').style.display !== 'none') {
    foto_url = document.getElementById('inv-foto-actual').src || null;
  }
  const payload = {
    nombre:     nombre,
    cargo:      document.getElementById('inv-cargo').value.trim() || null,
    orden:      parseInt(document.getElementById('inv-orden').value) || 0,
    foto_url:   foto_url,
    usuario_id: user.id
  };
  let error;
  if (id) {
    ({ error } = await window.supabase.from('investigadores').update(payload).eq('id', id).eq('usuario_id', user.id));
  } else {
    ({ error } = await window.supabase.from('investigadores').insert(payload));
  }
  if (error) {
    errorEl.textContent = 'Error: ' + error.message;
    errorEl.style.display = 'block'; btn.textContent = 'Guardar'; btn.disabled = false; return;
  }
  cerrarModal('investigador');
  cargarInvestigadoresAdmin();
}
function abrirModalEscuela() {
  limpiarModalEscuela();
  document.getElementById('modal-esc-titulo-label').textContent = 'Nuevo contenido';
  document.getElementById('modal-escuela').classList.add('activo');
}

function limpiarModalEscuela() {
  document.getElementById('esc-id').value = '';
  document.getElementById('esc-titulo').value = '';
  document.getElementById('esc-cuerpo').value = '';
  document.getElementById('esc-error').style.display = 'none';
  const btn = document.getElementById('btn-guardar-esc');
  btn.textContent = 'Guardar'; btn.disabled = false;
}

async function cargarEscuelaAdmin() {
  const lista = document.getElementById('lista-escuela');
  lista.innerHTML = '<p style="color:#94a3b8;padding:20px">Cargando...</p>';
  const user = await getUser();

  const { data, error } = await window.supabase
    .from('escuela_investigacion').select('*')
    .eq('usuario_id', user.id)
    .order('created_at', { ascending: true });

  if (error) { lista.innerHTML = '<p style="color:red">Error al cargar.</p>'; return; }
  if (!data.length) {
    lista.innerHTML = '<div class="admin-empty"><span></span><p>No hay contenido. ¡Agrega el primero!</p></div>';
    return;
  }

  lista.innerHTML = data.map(i => `
    <div class="admin-item">
      <div class="admin-item-img"><span style="font-size:2rem"></span></div>
      <div class="admin-item-info">
        <h4>${i.titulo}</h4>
        <p>${i.cuerpo ? i.cuerpo.substring(0,80) + '...' : 'Sin contenido'}</p>
      </div>
      <div class="admin-item-acciones">
        <button class="btn-editar" onclick="editarEscuela('${i.id}')"> Editar</button>
        <button class="btn-eliminar" onclick="confirmarEliminar('escuela','${i.id}','${i.titulo.replace(/'/g,"\\'")}')">🗑 Eliminar</button>
      </div>
    </div>
  `).join('');
}

async function editarEscuela(id) {
  const user = await getUser();
  const { data, error } = await window.supabase
    .from('escuela_investigacion').select('*').eq('id', id).eq('usuario_id', user.id).single();
  if (error || !data) return;
  document.getElementById('modal-esc-titulo-label').textContent = 'Editar contenido';
  document.getElementById('esc-id').value     = data.id;
  document.getElementById('esc-titulo').value = data.titulo;
  document.getElementById('esc-cuerpo').value = data.cuerpo || '';
  document.getElementById('modal-escuela').classList.add('activo');
}
async function guardarEscuela() {
  const btn     = document.getElementById('btn-guardar-esc');
  const errorEl = document.getElementById('esc-error');
  const titulo  = document.getElementById('esc-titulo').value.trim();

  if (!titulo) {
    errorEl.textContent = 'El título es obligatorio.';
    errorEl.style.display = 'block'; return;
  }
  btn.textContent = 'Guardando...'; btn.disabled = true;
  errorEl.style.display = 'none';

  const id   = document.getElementById('esc-id').value;
  const user = await getUser();

  const payload = {
    titulo:     titulo,
    cuerpo:     document.getElementById('esc-cuerpo').value.trim(),
    usuario_id: user.id
  };
  let error;
  if (id) {
    ({ error } = await window.supabase.from('escuela_investigacion').update(payload).eq('id', id).eq('usuario_id', user.id));
  } else {
    ({ error } = await window.supabase.from('escuela_investigacion').insert(payload));
  }
  if (error) {
    errorEl.textContent = 'Error: ' + error.message;
    errorEl.style.display = 'block'; btn.textContent = 'Guardar'; btn.disabled = false; return;
  }
  cerrarModal('escuela');
  cargarEscuelaAdmin();
}
const menuBtn = document.getElementById("menuBtn");
const sidebar = document.querySelector(".sidebar");

menuBtn.addEventListener("click", () => {
  sidebar.classList.toggle("activa");
});

document.querySelectorAll(".sidebar-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    if (window.innerWidth <= 768) {
      sidebar.classList.remove("activa");
    }
  });
});
