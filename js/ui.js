let editandoId = null;

function formatDate(d) {
  const date = new Date(d);
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysSince(d) {
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
}

// ---- CATÁLOGO ----

function renderCatalog(plantasAMostrar) {
  const grid = document.getElementById('catalogGrid');
  const lista = plantasAMostrar || getPlantas();
  grid.innerHTML = '';
  if (lista.length === 0) {
    grid.innerHTML = '<p style="text-align:center;color:var(--text-secondary);grid-column:1/-1;padding:2rem;">No se encontraron plantas</p>';
    return;
  }
  lista.forEach(p => {
    const card = document.createElement('div');
    card.className = 'plant-card';
    const s = p.siembra[hemisferio];
    card.innerHTML = `
      <div class="card-emoji">${p.emoji || '🌱'}</div>
      <div class="card-name">${p.nombre}</div>
      <div class="card-category">${p.categoria}</div>
      <div class="card-season">${MESES[s.inicio - 1]} - ${MESES[s.fin - 1]}</div>
    `;
    card.addEventListener('click', () => openPlantDetail(p.id));
    grid.appendChild(card);
  });
}

function filterPlants() {
  const query = document.getElementById('searchInput').value;
  const categoria = document.getElementById('filterCategory').value;
  let filtradas = buscarPlantas(query);
  filtradas = getPlantasPorCategoria(categoria).filter(p => filtradas.some(f => f.id === p.id));
  renderCatalog(filtradas);
}

// ---- MODAL DETALLE + EDITAR ----

function openPlantDetail(id) {
  const p = getPlantaById(id);
  if (!p) return;
  const modal = document.getElementById('plantModal');
  const body = document.getElementById('modalBody');
  const s = p.siembra[hemisferio];
  const c = p.cosecha[hemisferio];

  const renderBarra = (label, inicio, fin, cls) => {
    const pctInicio = ((inicio - 1) / 12) * 100;
    const ancho = inicio <= fin ? ((fin - inicio + 1) / 12) * 100 : ((12 - inicio + 1 + fin) / 12) * 100;
    return `
      <div class="detail-season-bar">
        <span class="bar-label">${label}</span>
        <div class="bar-track">
          <div class="bar-fill ${cls}" style="width:${ancho}%;margin-left:${pctInicio}%"></div>
        </div>
        <span style="font-size:0.75rem;min-width:100px;color:var(--text-secondary)">${MESES[inicio-1]} - ${MESES[fin-1]}</span>
      </div>`;
  };

  body.innerHTML = `
    <div class="plant-detail-header">
      <div class="detail-emoji">${p.emoji || '🌱'}</div>
      <div class="detail-title">
        <h2>${p.nombre}</h2>
        <div class="detail-category">${p.categoria}</div>
      </div>
    </div>
    <div class="plant-detail-body">
      <div class="detail-section">
        <h3>📅 Temporada (${hemisferio === 'norte' ? 'Norte' : 'Sur'})</h3>
        ${renderBarra('Siembra', s.inicio, s.fin, 'sow-fill')}
        ${renderBarra('Cosecha', c.inicio, c.fin, 'harvest-fill')}
      </div>
      <div class="detail-section">
        <h3>🌱 Cultivo</h3>
        <div class="detail-grid">
          <div class="detail-item"><span class="label">Sol:</span> ${p.sol}</div>
          <div class="detail-item"><span class="label">Riego:</span> ${p.riego}</div>
          <div class="detail-item"><span class="label">Suelo:</span> ${p.suelo}</div>
          <div class="detail-item"><span class="label">Profundidad:</span> ${p.profundidad || '-'}</div>
          <div class="detail-item"><span class="label">Espaciado:</span> ${p.espaciado || '-'}</div>
        </div>
      </div>
      ${p.companieras && p.companieras.length ? `
      <div class="detail-section">
        <h3>🤝 Plantas compañeras</h3>
        <div class="detail-companieras">
          ${p.companieras.map(n => `<span class="companiera-chip">${n}</span>`).join('')}
        </div>
      </div>` : ''}
      ${p.notas ? `
      <div class="detail-section">
        <h3>📝 Notas</h3>
        <p class="detail-notas">${p.notas}</p>
      </div>` : ''}
      <div style="display:flex;gap:0.5rem;margin-top:1rem;flex-wrap:wrap">
        <button class="detail-wishlist ${isInWishlist(p.id) ? 'in-wishlist' : ''}" id="wishlistBtn_${p.id}" onclick="toggleWishlistDetail('${p.id}')">
          ${isInWishlist(p.id) ? '⭐ En mis planes' : '☆ Agregar a mis planes'}
        </button>
        <button class="detail-edit" onclick="abrirEditForm('${p.id}')">✏️ Editar</button>
        <button class="detail-delete" onclick="eliminarYcerrar('${p.id}')">🗑️ Eliminar</button>
      </div>
    </div>`;
  modal.classList.remove('hidden');
}

function toggleWishlistDetail(id) {
  const enLista = toggleWishlist(id);
  const btn = document.getElementById(`wishlistBtn_${id}`);
  if (btn) {
    btn.textContent = enLista ? '⭐ En mis planes' : '☆ Agregar a mis planes';
    btn.classList.toggle('in-wishlist', enLista);
  }
  showToast(enLista ? '✅ Agregado a tu plan de siembra' : 'Eliminado de tu plan');
  renderPlan();
}

function eliminarYcerrar(id) {
  if (confirm('¿Eliminar esta planta?')) {
    eliminarPlanta(id);
    closeModal();
    const v = document.querySelector('.view.active');
    if (v.id === 'view-catalog') filterPlants();
    if (v.id === 'view-calendar') renderCalendar();
    showToast('Planta eliminada');
  }
}

function abrirEditForm(id) {
  const p = getPlantaById(id);
  if (!p) return;
  editandoId = id;
  closeModal();
  document.getElementById('formNombre').value = p.nombre;
  document.getElementById('formCategoria').value = p.categoria;
  document.getElementById('formEmoji').value = p.emoji || '🌱';
  document.getElementById('formSol').value = p.sol;
  document.getElementById('formRiego').value = p.riego;
  document.getElementById('formSuelo').value = p.suelo;
  document.getElementById('formProfundidad').value = p.profundidad;
  document.getElementById('formEspaciado').value = p.espaciado;
  document.getElementById('formNorteInicio').value = p.siembra.norte.inicio;
  document.getElementById('formNorteFin').value = p.siembra.norte.fin;
  document.getElementById('formNotas').value = p.notas;
  document.getElementById('formSubmitBtn').textContent = 'Actualizar planta';
  document.getElementById('formTitle').textContent = '✏️ Editar: ' + p.nombre;
  document.getElementById('cancelEditBtn').classList.remove('hidden');
  showView('add');
}

function cancelEdit() {
  editandoId = null;
  document.getElementById('addForm').reset();
  document.getElementById('formSubmitBtn').textContent = 'Guardar planta';
  document.getElementById('formTitle').textContent = 'Agregar Nueva Planta';
  document.getElementById('cancelEditBtn').classList.add('hidden');
}

function closeModal() {
  document.getElementById('plantModal').classList.add('hidden');
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 3000);
}

// ---- AGREGAR / EDITAR PLANTA ----

function addPlant(e) {
  e.preventDefault();
  const data = {
    nombre: document.getElementById('formNombre').value,
    categoria: document.getElementById('formCategoria').value,
    emoji: document.getElementById('formEmoji').value || '🌱',
    sol: document.getElementById('formSol').value,
    riego: document.getElementById('formRiego').value,
    suelo: document.getElementById('formSuelo').value,
    profundidad: document.getElementById('formProfundidad').value,
    espaciado: document.getElementById('formEspaciado').value,
    norteInicio: document.getElementById('formNorteInicio').value,
    norteFin: document.getElementById('formNorteFin').value,
    notas: document.getElementById('formNotas').value
  };

  if (editandoId) {
    actualizarPlanta(editandoId, data);
    cancelEdit();
    showToast('✅ Planta actualizada');
  } else {
    agregarPlanta(data);
    document.getElementById('addForm').reset();
    document.getElementById('addSuccess').classList.remove('hidden');
    setTimeout(() => document.getElementById('addSuccess').classList.add('hidden'), 3000);
    showToast('✅ Planta agregada');
  }
  renderCalendar();
  showView('catalog');
}

// ---- MIS CULTIVOS ----

function renderPlantings(filtro) {
  const grid = document.getElementById('plantingsGrid');
  grid.innerHTML = '';

  if (!isLoggedIn()) {
    grid.innerHTML = `
      <div class="plantings-login-required">
        <p style="font-size:2rem;margin-bottom:0.5rem">🔒</p>
        <p>Iniciá sesión para ver tus cultivos</p>
        <button class="btn btn-submit" style="margin-top:1rem" onclick="loginGoogle()">Iniciar sesión con Google</button>
      </div>`;
    return;
  }

  const lista = getPlantings(filtro || 'creciendo');

  if (lista.length === 0) {
    const msj = filtro === 'creciendo' ? 'No tenés cultivos activos 🌱' :
               filtro === 'cosechado' ? 'No hay cosechas registradas aún' :
               'No hay cultivos registrados';
    grid.innerHTML = `<p class="plantings-empty">${msj}</p>`;
    return;
  }

  lista.forEach(p => {
    const dias = daysSince(p.fechaSiembra);
    const card = document.createElement('div');
    card.className = `planting-card planting-${p.estado}`;
    card.innerHTML = `
      <div class="planting-emoji">${p.emoji || '🌱'}</div>
      <div class="planting-info">
        <div class="planting-name">${p.nombre}</div>
        <div class="planting-meta">📅 ${formatDate(p.fechaSiembra)} · ${dias} días</div>
        ${p.ubicacion ? `<div class="planting-meta">📍 ${p.ubicacion}</div>` : ''}
        <span class="planting-badge badge-${p.estado}">
          ${p.estado === 'creciendo' ? '🌱 Crece' : p.estado === 'cosechado' ? '🍂 Cosechado' : '❌ Falló'}
        </span>
      </div>
      <div class="planting-actions">
        ${p.estado === 'creciendo' ? `
          <button class="planting-btn btn-harvest" onclick="cosecharPlanting('${p.id}')" title="Cosechar">🍂</button>
          <button class="planting-btn btn-fail" onclick="falloPlanting('${p.id}')" title="Falló">❌</button>
        ` : ''}
        <button class="planting-btn btn-delete-planting" onclick="eliminarPlanting('${p.id}')" title="Eliminar">🗑️</button>
      </div>
    `;
    card.addEventListener('click', (e) => {
      if (e.target.closest('.planting-actions')) return;
      openPlantDetail(p.plantId || '');
    });
    grid.appendChild(card);
  });
}

function switchPlantingsTab(tab) {
  document.querySelectorAll('.plantings-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`.plantings-tab[data-tab="${tab}"]`).classList.add('active');
  renderPlantings(tab);
}

function showAddPlanting() {
  const modal = document.getElementById('plantingModal');
  const select = document.getElementById('plantingSelect');
  select.innerHTML = '<option value="">Seleccionar planta…</option>';
  getPlantas().forEach(p => {
    select.innerHTML += `<option value="${p.id}" data-emoji="${p.emoji || '🌱'}">${p.emoji || '🌱'} ${p.nombre}</option>`;
  });
  document.getElementById('plantingFecha').value = new Date().toISOString().split('T')[0];
  document.getElementById('plantingUbicacion').value = '';
  document.getElementById('plantingNotas').value = '';
  modal.classList.remove('hidden');
}

function guardarPlanting(e) {
  e.preventDefault();
  const select = document.getElementById('plantingSelect');
  const plantId = select.value;
  if (!plantId) { showToast('Seleccioná una planta'); return; }
  const plant = getPlantaById(plantId);
  if (!plant) return;
  addPlanting({
    plantId,
    nombre: plant.nombre,
    emoji: plant.emoji || '🌱',
    fechaSiembra: document.getElementById('plantingFecha').value,
    ubicacion: document.getElementById('plantingUbicacion').value,
    notas: document.getElementById('plantingNotas').value
  });
  document.getElementById('plantingModal').classList.add('hidden');
  document.getElementById('plantingForm').reset();
  renderPlantings(document.querySelector('.plantings-tab.active')?.dataset?.tab || 'creciendo');
  showToast('✅ Cultivo agregado');
}

function cosecharPlanting(id) {
  updatePlantingStatus(id, 'cosechado');
  renderPlantings(document.querySelector('.plantings-tab.active')?.dataset?.tab || 'creciendo');
  showToast('🍂 Cosechado');
}

function falloPlanting(id) {
  if (confirm('¿Marcar como fallido?')) {
    updatePlantingStatus(id, 'fallo');
    renderPlantings(document.querySelector('.plantings-tab.active')?.dataset?.tab || 'creciendo');
    showToast('❌ Marcado como fallido');
  }
}

function eliminarPlanting(id) {
  if (confirm('¿Eliminar este cultivo del registro?')) {
    deletePlanting(id);
    renderPlantings(document.querySelector('.plantings-tab.active')?.dataset?.tab || 'creciendo');
    showToast('Eliminado');
  }
}

// ---- SMART PLANTING FORM ----

function onPlantingSelectChange() {
  const id = document.getElementById('plantingSelect').value;
  const info = document.getElementById('plantingInfo');
  const est = document.getElementById('plantingEstimacion');
  if (!id) { info.classList.add('hidden'); est.classList.add('hidden'); return; }
  const p = getPlantaById(id);
  if (!p) return;
  const s = p.siembra[hemisferio];
  const c = p.cosecha[hemisferio];
  const evalue = evaluarFechaSiembra(p, document.getElementById('plantingFecha').value);
  info.classList.remove('hidden');
  info.innerHTML = `
    <div class="plan-info-row">
      <span>📅 <strong>Siembra:</strong> ${MESES[s.inicio-1]} - ${MESES[s.fin-1]}</span>
      <span>🍂 <strong>Cosecha:</strong> ${MESES[c.inicio-1]} - ${MESES[c.fin-1]}</span>
    </div>
    <div class="plan-info-row">
      <span>⏱️ <strong>Maduración:</strong> ~${p.diasCosecha || 90} días</span>
      <span>${evalue.label ? `<span class="planting-badge ${evalue.cls}">${evalue.label}</span>` : ''}</span>
    </div>
  `;
  onPlantingFechaChange();
}

function onPlantingFechaChange() {
  const id = document.getElementById('plantingSelect').value;
  const fecha = document.getElementById('plantingFecha').value;
  const est = document.getElementById('plantingEstimacion');
  if (!id || !fecha) { est.classList.add('hidden'); return; }
  const p = getPlantaById(id);
  if (!p) return;
  const dias = p.diasCosecha || 90;
  const fCosecha = calcularFechaCosecha(fecha, dias);
  const evalue = evaluarFechaSiembra(p, fecha);
  const diasRest = Math.ceil((fCosecha - new Date()) / 86400000);
  est.classList.remove('hidden');
  est.innerHTML = `
    <div class="plan-info-row">
      <span>🌱 <strong>Siembra:</strong> ${formatDate(fecha)}</span>
      <span>🍂 <strong>Cosecha estimada:</strong> ${formatDate(fCosecha.toISOString())}</span>
    </div>
    <div class="plan-info-row">
      <span>⏳ <strong>Días hasta cosecha:</strong> ~${dias} días</span>
      <span class="planting-badge ${evalue.cls}">${evalue.label}</span>
    </div>
  `;
}

// ---- PLAN VIEW ----

function renderPlan() {
  const mesActual = new Date().getMonth() + 1;
  document.getElementById('planBadgeEstacion').textContent = `🌿 ${getEstacionNombre(hemisferio)}`;
  document.getElementById('planEstacionTexto').textContent =
    `Basado en tu hemisferio (${hemisferio === 'norte' ? 'Norte' : 'Sur'}) — estación actual: ${getEstacionNombre(hemisferio)}`;

  // ---- TUS PLANES DE SIEMBRA (wishlist) ----
  const wishlistPlants = getWishlistPlants();
  const grid = document.getElementById('planRecomendaciones');
  grid.innerHTML = '';
  document.getElementById('planRecomendacionesTitle').textContent =
    `📋 Tus planes de siembra (${wishlistPlants.length})`;

  if (wishlistPlants.length === 0) {
    grid.innerHTML = `
      <div class="plan-empty" style="grid-column:1/-1">
        <p style="font-size:1.5rem;margin-bottom:0.5rem">📋</p>
        <p>No tenés plantas en tu plan de siembra.</p>
        <p style="font-size:0.85rem;margin-top:0.5rem;color:var(--text-secondary)">
          Andá al <strong>Catálogo</strong>, abrí una planta y agregala a "Mis planes"
        </p>
      </div>`;
  } else {
    // Ordenar: primero las que se pueden sembrar ahora, luego por mes de siembra
    const ordenadas = [...wishlistPlants].sort((a, b) => {
      const aAhora = enVentanaSiembra(a);
      const bAhora = enVentanaSiembra(b);
      if (aAhora && !bAhora) return -1;
      if (!aAhora && bAhora) return 1;
      const sa = a.siembra[hemisferio];
      const sb = b.siembra[hemisferio];
      const da = sa.inicio >= mesActual ? sa.inicio - mesActual : sa.inicio + 12 - mesActual;
      const db = sb.inicio >= mesActual ? sb.inicio - mesActual : sb.inicio + 12 - mesActual;
      return da - db;
    });

    ordenadas.forEach(p => {
      const s = p.siembra[hemisferio];
      const ahora = enVentanaSiembra(p);
      const mesesFaltan = ahora ? 0 : (s.inicio >= mesActual ? s.inicio - mesActual : s.inicio + 12 - mesActual);
      const yaSembrado = getPlantings('todos').some(pl => pl.plantId === p.id && pl.estado === 'creciendo');
      const yaCosechado = getPlantings('todos').some(pl => pl.plantId === p.id && pl.estado === 'cosechado');

      const card = document.createElement('div');
      card.className = 'plant-card plan-rec-card';
      let badge = '';
      if (ahora) badge = '<span class="planting-badge badge-creciendo">🌱 Sembrar ahora</span>';
      else if (mesesFaltan <= 1) badge = `<span class="planting-badge badge-cosechado">⏰ En ${mesesFaltan === 0 ? 'este mes' : `${mesesFaltan} mes`}</span>`;
      else badge = `<span class="planting-badge">📅 En ${mesesFaltan} meses</span>`;

      card.innerHTML = `
        <div class="card-emoji">${p.emoji || '🌱'}</div>
        <div class="card-name">${p.nombre}</div>
        <div class="card-season">${MESES[s.inicio-1]} - ${MESES[s.fin-1]}</div>
        ${badge}
        <div style="font-size:0.7rem;color:var(--text-secondary);margin-top:0.2rem">
          ${yaSembrado ? '🌱 Ya sembrado' : yaCosechado ? '🍂 Ya cosechado' : ''}
        </div>
      `;
      card.addEventListener('click', () => openPlantDetail(p.id));
      grid.appendChild(card);
    });
  }

  // ---- QUÉ PLANTAR AHORA (recomendaciones generales) ----
  const recs = getRecomendacionesAhora();
  const divRecs = document.createElement('div');
  const recContainer = document.getElementById('planRecomendaciones').parentElement;

  // ---- PRÓXIMAS COSECHAS ----
  const cosechas = getProximasCosechas(10);
  const divCosechas = document.getElementById('planProximasCosechas');
  divCosechas.innerHTML = '';
  if (cosechas.length === 0) {
    divCosechas.innerHTML = '<p class="plan-empty">No tenés cultivos activos. Agregá algunos en "Cultivos"</p>';
  } else {
    cosechas.forEach(c => {
      const item = document.createElement('div');
      item.className = `planting-card planting-${c.estadoPlan === 'listo' ? 'cosechado' : ''}`;
      const progressBar = `<div class="progress-bar"><div class="progress-fill ${c.estadoPlan === 'listo' ? 'fill-ready' : c.estadoPlan === 'pronto' ? 'fill-soon' : ''}" style="width:${c.progreso}%"></div></div>`;
      item.innerHTML = `
        <div class="planting-emoji">${c.emoji || '🌱'}</div>
        <div class="planting-info">
          <div class="planting-name">${c.nombre}</div>
          <div class="planting-meta">
            ${c.estadoPlan === 'listo' ? '🍂 Listo para cosechar!' :
              c.estadoPlan === 'pronto' ? `⏰ ${c.diasRestantes} días para cosechar` :
              `📅 Cosecha estimada: ${formatDate(c.fechaCosechaStr)} (${c.diasRestantes} días)`}
          </div>
          ${progressBar}
        </div>
      `;
      item.addEventListener('click', () => openPlantDetail(c.plantId));
      divCosechas.appendChild(item);
    });
  }

  // ---- RESUMEN ----
  const divResumen = document.getElementById('planResumen');
  const activos = getPlantings('creciendo').length;
  const cosechados = getPlantings('cosechado').length;
  const fallidos = getPlantings('fallo').length;
  const total = activos + cosechados + fallidos;
  const enPlan = wishlistPlants.length;
  divResumen.innerHTML = total === 0 && enPlan === 0
    ? '<p class="plan-empty">Sin actividad aún. Agregá plantas a tu plan o registrá cultivos</p>'
    : `
    <div class="resumen-grid">
      <div class="resumen-item"><span class="resumen-num">${enPlan}</span>📋 En plan</div>
      <div class="resumen-item"><span class="resumen-num">${activos}</span>🌱 Activos</div>
      <div class="resumen-item"><span class="resumen-num">${cosechados}</span>🍂 Cosechados</div>
      <div class="resumen-item"><span class="resumen-num">${fallidos}</span>❌ Fallidos</div>
    </div>`;
}
