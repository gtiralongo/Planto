function selectHemisphere(h) {
  setHemisferio(h);
  hemisferio = h;
  enterApp();
}

function detectHemisphere() {
  if (!navigator.geolocation) {
    showToast('Geolocalización no disponible. Seleccioná manualmente.');
    return;
  }
  const btn = document.querySelector('.btn-gps');
  btn.textContent = '📍 Detectando...';
  btn.disabled = true;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      btn.disabled = false;
      btn.innerHTML = '<span>📍</span> Usar mi ubicación';
      const lat = pos.coords.latitude;
      const h = lat >= 0 ? 'norte' : 'sur';
      setHemisferio(h);
      hemisferio = h;
      enterApp();
    },
    () => {
      btn.disabled = false;
      btn.innerHTML = '<span>📍</span> Usar mi ubicación';
      showToast('No se pudo obtener la ubicación. Seleccioná manualmente.');
    },
    { timeout: 8000 }
  );
}

function enterApp() {
  hemisferio = getHemisferio();
  document.getElementById('landing').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  document.getElementById('badgeHemi').textContent = hemisferio === 'norte' ? '🌍 Norte' : '🌏 Sur';

  initPlants();
  initPlantings();
  renderCalendar();
  renderCatalog();
  renderPlantings('creciendo');
  renderPlan();

  setTimeout(() => mostrarNotificaciones(), 1500);

  const temaGuardado = localStorage.getItem('planto_theme');
  if (temaGuardado === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.getElementById('toggleTheme').textContent = '☀️';
  }
}

function showView(vista) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`view-${vista}`).classList.add('active');
  const btn = document.querySelector(`.nav-btn[data-view="${vista}"]`);
  if (btn) btn.classList.add('active');
  if (vista === 'calendar') renderCalendar();
  if (vista === 'catalog') filterPlants();
  if (vista === 'plantings') {
    const activeTab = document.querySelector('.plantings-tab.active');
    renderPlantings(activeTab ? activeTab.dataset.tab : 'creciendo');
  }
  if (vista === 'plan') renderPlan();
  if (vista === 'add') cancelEdit();
}

function toggleHemisphere() {
  const nuevo = hemisferio === 'norte' ? 'sur' : 'norte';
  setHemisferio(nuevo);
  hemisferio = nuevo;
  document.getElementById('badgeHemi').textContent = nuevo === 'norte' ? '🌍 Norte' : '🌏 Sur';
  const v = document.querySelector('.view.active');
  if (v) {
    const id = v.id.replace('view-', '');
    if (id === 'calendar') renderCalendar();
    if (id === 'catalog') filterPlants();
  }
  showToast(`Cambiado a Hemisferio ${nuevo === 'norte' ? 'Norte' : 'Sur'}`);
}

function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme');
  const nuevo = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', nuevo);
  localStorage.setItem('planto_theme', nuevo);
  document.getElementById('toggleTheme').textContent = nuevo === 'dark' ? '☀️' : '🌙';
}

// ---- PWA ----
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  });
}

// ---- Firebase Auth ----
if (typeof initFirebase === 'function') {
  initFirebase();
}
