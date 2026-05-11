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
      <div style="display:flex;gap:0.5rem;margin-top:1rem">
        <button class="detail-edit" onclick="abrirEditForm('${p.id}')">✏️ Editar</button>
        <button class="detail-delete" onclick="eliminarYcerrar('${p.id}')">🗑️ Eliminar</button>
      </div>
    </div>`;
  modal.classList.remove('hidden');
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
  const lista = getPlantings(filtro || 'creciendo');
  grid.innerHTML = '';

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
