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
  initWishlist();
  renderCalendar();
  renderCatalog();
  renderPlantings('creciendo');
  renderPlantingsSuggestions();
  renderPlan();

  setTimeout(() => mostrarNotificaciones(), 1500);

  const temaGuardado = localStorage.getItem('planto_theme');
  if (temaGuardado === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.getElementById('toggleTheme').textContent = '☀️';
  }
}

function toggleUserDropdown(e) {
  e && e.stopPropagation();
  const d = document.getElementById('userDropdown');
  d.classList.toggle('hidden');
  document.getElementById('dropdownHemi').textContent = hemisferio === 'norte' ? '🌍 Norte' : '🌏 Sur';
  document.getElementById('dropdownThemeIcon').textContent = document.getElementById('toggleTheme').textContent;
  document.getElementById('dropdownThemeText').textContent = document.documentElement.getAttribute('data-theme') === 'dark' ? 'Modo claro' : 'Modo oscuro';
}

// Cerrar dropdown al tocar fuera
document.addEventListener('click', (e) => {
  const d = document.getElementById('userDropdown');
  const ui = document.getElementById('userInfo');
  const mb = document.getElementById('menuUserBtn');
  if (d && !d.classList.contains('hidden') && !d.contains(e.target) && !ui.contains(e.target) && !mb.contains(e.target)) {
    d.classList.add('hidden');
  }
});

function showView(vista) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn, .nav-bottom-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`view-${vista}`).classList.add('active');
  const btn = document.querySelector(`.nav-btn[data-view="${vista}"]`);
  if (btn) btn.classList.add('active');
  const btnBottom = document.querySelector(`.nav-bottom-btn[data-view="${vista}"]`);
  if (btnBottom) btnBottom.classList.add('active');
  document.getElementById('userDropdown').classList.add('hidden');
  if (vista === 'calendar') renderCalendar();
  if (vista === 'catalog') filterPlants();
  if (vista === 'plantings') {
    renderPlantingsSuggestions();
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
