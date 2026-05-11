// ---- PLANIFICADOR DE SIEMBRA ----

function getEstacion(mes) {
  if (mes >= 3 && mes <= 5) return 'primavera';
  if (mes >= 6 && mes <= 8) return 'verano';
  if (mes >= 9 && mes <= 11) return 'otoño';
  return 'invierno';
}

function getEstacionNombre(hem) {
  const m = new Date().getMonth() + 1;
  if (hem === 'norte') {
    if (m >= 3 && m <= 5) return 'Primavera';
    if (m >= 6 && m <= 8) return 'Verano';
    if (m >= 9 && m <= 11) return 'Otoño';
    return 'Invierno';
  }
  if (m >= 9 && m <= 11) return 'Primavera';
  if (m >= 12 || m <= 2) return 'Verano';
  if (m >= 3 && m <= 5) return 'Otoño';
  return 'Invierno';
}

// Verifica si el mes actual está dentro de la ventana de siembra
function enVentanaSiembra(planta) {
  const m = new Date().getMonth() + 1;
  const s = planta.siembra[hemisferio];
  return mesEntre(m, s.inicio, s.fin);
}

// Verifica si el mes actual está dentro de la ventana de cosecha
function enVentanaCosecha(planta) {
  const m = new Date().getMonth() + 1;
  const c = planta.cosecha[hemisferio];
  return mesEntre(m, c.inicio, c.fin);
}

// Calcula fecha estimada de cosecha
function calcularFechaCosecha(fechaSiembra, diasCosecha) {
  const f = new Date(fechaSiembra);
  f.setDate(f.getDate() + (diasCosecha || 90));
  return f;
}

// Obtiene plantas recomendadas para sembrar ahora
function getRecomendacionesAhora() {
  return getPlantas().filter(p => enVentanaSiembra(p)).sort((a, b) => a.nombre.localeCompare(b.nombre));
}

// Evalúa qué tan buena es la fecha de siembra para una planta
function evaluarFechaSiembra(planta, fechaStr) {
  if (!planta) return { puntaje: 0, label: 'Sin datos', cls: 'badge-fallo' };
  const m = new Date(fechaStr).getMonth() + 1;
  const s = planta.siembra[hemisferio];
  const dentro = mesEntre(m, s.inicio, s.fin);
  const distancia = dentro ? 0 : Math.min(
    Math.abs(m - s.inicio),
    Math.abs(m - s.fin),
    Math.abs(m - s.inicio + 12),
    Math.abs(m - s.fin + 12)
  );
  if (dentro) return { puntaje: 100, label: '✅ Ideal ahora', cls: 'badge-creciendo' };
  if (distancia <= 1) return { puntaje: 70, label: '⚠️ Casi en fecha', cls: 'badge-cosechado' };
  if (distancia <= 3) return { puntaje: 40, label: '⏳ Fuera de temporada', cls: '' };
  return { puntaje: 10, label: '❌ Mala época', cls: 'badge-fallo' };
}

// Analiza un planting y devuelve su estado de plan
function analizarPlanting(planting) {
  const planta = getPlantaById(planting.plantId);
  if (!planta) return null;
  const diasCosecha = planta.diasCosecha || 90;
  const fechaSiembra = new Date(planting.fechaSiembra);
  const fechaCosechaEst = calcularFechaCosecha(fechaSiembra, diasCosecha);
  const hoy = new Date();
  const diasTranscurridos = Math.floor((hoy - fechaSiembra) / 86400000);
  const diasRestantes = Math.max(0, Math.ceil((fechaCosechaEst - hoy) / 86400000));
  const progreso = Math.min(100, Math.round((diasTranscurridos / diasCosecha) * 100));
  const fechaCosechaStr = fechaCosechaEst.toISOString().split('T')[0];
  const mc = fechaCosechaEst.getMonth() + 1;
  const c = planta.cosecha[hemisferio];
  const cosechaEnVentana = mesEntre(mc, c.inicio, c.fin);

  let estadoPlan;
  if (planting.estado === 'cosechado') estadoPlan = 'cosechado';
  else if (planting.estado === 'fallo') estadoPlan = 'fallo';
  else if (diasRestantes <= 0) estadoPlan = 'listo';
  else if (diasRestantes <= 14) estadoPlan = 'pronto';
  else if (progreso >= 80) estadoPlan = 'madurando';
  else estadoPlan = 'creciendo';

  return {
    ...planting,
    planta,
    diasCosecha,
    fechaCosechaEst,
    diasTranscurridos,
    diasRestantes,
    progreso,
    fechaCosechaStr,
    cosechaEnVentana,
    estadoPlan
  };
}

// Obtiene próximas cosechas (ordenadas por fecha)
function getProximasCosechas(limite = 10) {
  const activos = getPlantings('creciendo');
  const analizados = activos.map(a => analizarPlanting(a)).filter(Boolean);
  return analizados.sort((a, b) => a.diasRestantes - b.diasRestantes).slice(0, limite);
}

// Plan de siembra completo para un conjunto de plantas seleccionadas
function generarPlanSiembra(plantIds) {
  return plantIds.map(id => {
    const p = getPlantaById(id);
    if (!p) return null;
    const s = p.siembra[hemisferio];
    const c = p.cosecha[hemisferio];
    const ahora = enVentanaSiembra(p);
    const mesActual = new Date().getMonth() + 1;
    return {
      id: p.id,
      nombre: p.nombre,
      emoji: p.emoji || '🌱',
      ventanaSiembra: `${MESES[s.inicio-1]} - ${MESES[s.fin-1]}`,
      ventanaCosecha: `${MESES[c.inicio-1]} - ${MESES[c.fin-1]}`,
      diasCosecha: p.diasCosecha || 90,
      sePuedeAhora: ahora,
      mesesParaSiembra: ahora ? 0 : (s.inicio > mesActual ? s.inicio - mesActual : s.inicio + 12 - mesActual),
      recomendacion: ahora ? '🌱 Plantalo ahora' : (p.diasCosecha ? `Esperá ${s.inicio > mesActual ? s.inicio - mesActual : s.inicio + 12 - mesActual} meses` : '')
    };
  }).filter(Boolean);
}

// ---- NOTIFICACIONES ----
function verificarNotificaciones() {
  const keyNotif = 'planto_notified_harvest';
  const notificadas = JSON.parse(localStorage.getItem(keyNotif) || '{}');
  const cosechas = getProximasCosechas(20);
  const nuevas = [];

  for (const c of cosechas) {
    if (c.estadoPlan === 'listo' && !notificadas[c.id]) {
      nuevas.push({ id: c.id, msg: `🍂 ${c.emoji} ${c.nombre} está listo para cosechar!` });
      notificadas[c.id] = true;
    } else if (c.estadoPlan === 'pronto' && !notificadas[c.id + '_soon']) {
      nuevas.push({ id: c.id, msg: `⏰ ${c.emoji} ${c.nombre} se cosechará en ~${c.diasRestantes} días` });
      notificadas[c.id + '_soon'] = true;
    }
  }

  localStorage.setItem(keyNotif, JSON.stringify(notificadas));
  return nuevas;
}

function mostrarNotificaciones() {
  const notifs = verificarNotificaciones();
  notifs.forEach(n => showToast(n.msg));
}
