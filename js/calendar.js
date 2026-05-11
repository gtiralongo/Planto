const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

function renderCalendar() {
  const grid = document.getElementById('calendarGrid');
  grid.innerHTML = '';
  const mesActual = new Date().getMonth() + 1;

  // Reordenar meses para que el actual aparezca primero
  const mesesOrdenados = [];
  for (let i = 0; i < 12; i++) {
    const m = ((mesActual - 1 + i) % 12) + 1;
    mesesOrdenados.push({ indice: m - 1, mes: m });
  }

  mesesOrdenados.forEach(({ indice, mes }) => {
    const nombre = MESES[indice];
    const plantasDelMes = getPlantasPorMes(mes);
    const esActual = mes === mesActual;

    const monthDiv = document.createElement('div');
    monthDiv.className = 'calendar-month' + (esActual ? ' current-month' : '');

    const header = document.createElement('div');
    header.className = 'month-header';
    header.innerHTML = `${nombre} <span class="month-number">${plantasDelMes.length}</span>`;
    monthDiv.appendChild(header);

    const plantsDiv = document.createElement('div');
    plantsDiv.className = 'month-plants';

    if (plantasDelMes.length === 0) {
      plantsDiv.innerHTML = '<div class="month-empty">Sin actividad este mes</div>';
    } else {
      const ordenadas = [...plantasDelMes].sort((a, b) => a.nombre.localeCompare(b.nombre));
      ordenadas.forEach(p => {
        const s = p.siembra[hemisferio];
        const c = p.cosecha[hemisferio];
        const enSiembra = mesEntre(mes, s.inicio, s.fin);
        const enCosecha = mesEntre(mes, c.inicio, c.fin);

        let tipo = '';
        if (enSiembra && enCosecha) tipo = 'sow';
        else if (enSiembra) tipo = 'sow';
        else if (enCosecha) tipo = 'harvest';

        const item = document.createElement('div');
        item.className = `month-plant type-${tipo}`;
        item.innerHTML = `<span class="plant-emoji">${p.emoji || '🌱'}</span><span class="plant-name">${p.nombre}</span>`;
        if (enSiembra && enCosecha) item.innerHTML += '<span style="font-size:0.65rem;opacity:0.6">🌱🍂</span>';
        else if (enSiembra) item.innerHTML += '<span style="font-size:0.65rem;opacity:0.6">🌱</span>';
        else item.innerHTML += '<span style="font-size:0.65rem;opacity:0.6">🍂</span>';

        item.addEventListener('click', () => openPlantDetail(p.id));
        plantsDiv.appendChild(item);
      });
    }

    monthDiv.appendChild(plantsDiv);
    grid.appendChild(monthDiv);
  });

  // Scroll al mes actual
  const el = grid.querySelector('.current-month');
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
