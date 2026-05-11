let plantas = [];
let hemisferio = 'norte';

function initPlants() {
  const stored = localStorage.getItem('planto_plants');
  const savedHemi = localStorage.getItem('planto_hemisphere');
  if (savedHemi) hemisferio = savedHemi;

  if (stored) {
    try {
      plantas = JSON.parse(stored);
    } catch {
      plantas = JSON.parse(JSON.stringify(PLANTAS_INICIALES));
      savePlants();
    }
  } else {
    plantas = JSON.parse(JSON.stringify(PLANTAS_INICIALES));
    savePlants();
  }
}

function savePlants() {
  localStorage.setItem('planto_plants', JSON.stringify(plantas));
}

function getPlantas() {
  return plantas;
}

function getPlantasPorMes(mes) {
  return plantas.filter(p => {
    const s = p.siembra[hemisferio];
    const c = p.cosecha[hemisferio];
    const enSiembra = mesEntre(mes, s.inicio, s.fin);
    const enCosecha = mesEntre(mes, c.inicio, c.fin);
    return enSiembra || enCosecha;
  });
}

function mesEntre(mes, inicio, fin) {
  if (inicio <= fin) return mes >= inicio && mes <= fin;
  return mes >= inicio || mes <= fin;
}

function getPlantasPorCategoria(categoria) {
  if (!categoria || categoria === 'todas') return plantas;
  return plantas.filter(p => p.categoria === categoria);
}

function buscarPlantas(query) {
  const q = query.toLowerCase().trim();
  if (!q) return plantas;
  return plantas.filter(p =>
    p.nombre.toLowerCase().includes(q) ||
    p.categoria.toLowerCase().includes(q) ||
    (p.notas && p.notas.toLowerCase().includes(q))
  );
}

function getPlantaById(id) {
  return plantas.find(p => p.id === id);
}

function agregarPlanta(data) {
  const id = data.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '_') + '_' + Date.now();
  const nueva = {
    id,
    nombre: data.nombre,
    categoria: data.categoria,
    emoji: data.emoji || '🌱',
    siembra: {
      norte: { inicio: parseInt(data.norteInicio), fin: parseInt(data.norteFin) },
      sur: {
        inicio: data.norteInicio <= 6 ? parseInt(data.norteInicio) + 6 : parseInt(data.norteInicio) - 6,
        fin: data.norteFin <= 6 ? parseInt(data.norteFin) + 6 : parseInt(data.norteFin) - 6
      }
    },
    cosecha: {
      norte: { inicio: parseInt(data.norteInicio) + 3 > 12 ? parseInt(data.norteInicio) + 3 - 12 : parseInt(data.norteInicio) + 3, fin: parseInt(data.norteFin) + 3 > 12 ? parseInt(data.norteFin) + 3 - 12 : parseInt(data.norteFin) + 3 },
      sur: { inicio: 0, fin: 0 }
    },
    sol: data.sol || 'pleno sol',
    riego: data.riego || 'moderado',
    suelo: data.suelo || '',
    profundidad: data.profundidad || '',
    espaciado: data.espaciado || '',
    companieras: [],
    notas: data.notas || ''
  };
  // fix sur cosecha
  nueva.cosecha.sur = {
    inicio: nueva.cosecha.norte.inicio <= 6 ? nueva.cosecha.norte.inicio + 6 : nueva.cosecha.norte.inicio - 6,
    fin: nueva.cosecha.norte.fin <= 6 ? nueva.cosecha.norte.fin + 6 : nueva.cosecha.norte.fin - 6
  };

  plantas.unshift(nueva);
  savePlants();
  if (typeof isLoggedIn === 'function' && isLoggedIn() && typeof fs_addUserPlant === 'function') {
    const u = getUser();
    if (u) fs_addUserPlant(u.uid, nueva);
  }
  return nueva;
}

function actualizarPlanta(id, data) {
  const idx = plantas.findIndex(p => p.id === id);
  if (idx === -1) return null;
  const p = plantas[idx];
  const calcSur = (v) => v <= 6 ? v + 6 : v - 6;
  const calcCosecha = (v) => v + 3 > 12 ? v + 3 - 12 : v + 3;
  const updated = {
    ...p,
    nombre: data.nombre,
    categoria: data.categoria,
    emoji: data.emoji || '🌱',
    siembra: {
      norte: { inicio: parseInt(data.norteInicio), fin: parseInt(data.norteFin) },
      sur: { inicio: calcSur(parseInt(data.norteInicio)), fin: calcSur(parseInt(data.norteFin)) }
    },
    cosecha: {
      norte: { inicio: calcCosecha(parseInt(data.norteInicio)), fin: calcCosecha(parseInt(data.norteFin)) },
      sur: { inicio: calcSur(calcCosecha(parseInt(data.norteInicio))), fin: calcSur(calcCosecha(parseInt(data.norteFin))) }
    },
    sol: data.sol || p.sol,
    riego: data.riego || p.riego,
    suelo: data.suelo || p.suelo,
    profundidad: data.profundidad || p.profundidad,
    espaciado: data.espaciado || p.espaciado,
    notas: data.notas || p.notas
  };
  plantas[idx] = updated;
  savePlants();
  if (typeof isLoggedIn === 'function' && isLoggedIn() && typeof fs_updateUserPlant === 'function') {
    const u = getUser();
    if (u) fs_updateUserPlant(u.uid, id, updated);
  }
  return updated;
}

function eliminarPlanta(id) {
  plantas = plantas.filter(p => p.id !== id);
  savePlants();
  if (typeof isLoggedIn === 'function' && isLoggedIn() && typeof fs_deleteUserPlant === 'function') {
    const u = getUser();
    if (u) fs_deleteUserPlant(u.uid, id);
  }
}

// ----- PLANTACIONES (Mis Cultivos) -----
let plantings = [];

function initPlantings() {
  try {
    const stored = localStorage.getItem('planto_plantings');
    plantings = stored ? JSON.parse(stored) : [];
  } catch { plantings = []; }
}

function savePlantings() {
  localStorage.setItem('planto_plantings', JSON.stringify(plantings));
}

function getPlantings(filtro) {
  if (!filtro || filtro === 'todos') return plantings;
  return plantings.filter(p => p.estado === filtro);
}

function addPlanting(data) {
  const id = 'p_' + Date.now();
  const nueva = {
    id,
    plantId: data.plantId,
    nombre: data.nombre,
    emoji: data.emoji || '🌱',
    fechaSiembra: data.fechaSiembra,
    ubicacion: data.ubicacion || '',
    estado: 'creciendo',
    notas: data.notas || '',
    createdAt: new Date().toISOString()
  };
  plantings.unshift(nueva);
  savePlantings();
  if (typeof isLoggedIn === 'function' && isLoggedIn() && typeof fs_addPlanting === 'function') {
    const u = getUser();
    if (u) fs_addPlanting(u.uid, nueva);
  }
  return nueva;
}

function updatePlantingStatus(id, estado) {
  const p = plantings.find(x => x.id === id);
  if (p) { p.estado = estado; savePlantings(); }
  if (typeof isLoggedIn === 'function' && isLoggedIn() && typeof fs_updatePlantingStatus === 'function') {
    const u = getUser();
    if (u) fs_updatePlantingStatus(u.uid, id, estado);
  }
}

function deletePlanting(id) {
  plantings = plantings.filter(p => p.id !== id);
  savePlantings();
  if (typeof isLoggedIn === 'function' && isLoggedIn() && typeof fs_deletePlanting === 'function') {
    const u = getUser();
    if (u) fs_deletePlanting(u.uid, id);
  }
}

// ----- WISHLIST (planes de siembra) -----
let wishlist = [];

function initWishlist() {
  try {
    const stored = localStorage.getItem('planto_wishlist');
    wishlist = stored ? JSON.parse(stored) : [];
  } catch { wishlist = []; }
}

function saveWishlist() {
  localStorage.setItem('planto_wishlist', JSON.stringify(wishlist));
}

function getWishlist() { return wishlist; }

function isInWishlist(plantId) { return wishlist.includes(plantId); }

function toggleWishlist(plantId) {
  const idx = wishlist.indexOf(plantId);
  if (idx >= 0) wishlist.splice(idx, 1);
  else wishlist.push(plantId);
  saveWishlist();
  return idx < 0;
}

function getWishlistPlants() {
  return wishlist.map(id => getPlantaById(id)).filter(Boolean);
}

function setHemisferio(h) {
  hemisferio = h;
  localStorage.setItem('planto_hemisphere', h);
}

function getHemisferio() {
  return hemisferio;
}
