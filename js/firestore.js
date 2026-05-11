let db = null;

function initFirestore() {
  if (typeof firebase !== 'undefined' && firebase.apps.length) {
    db = firebase.firestore();
    db.settings({ merge: true });
  }
}

function getDb() { return db; }

// ---- PLANTAS del usuario (agregadas por él) ----

async function fs_getUserPlants(uid) {
  if (!db) return [];
  const snap = await db.collection('users').doc(uid).collection('plants').get();
  return snap.docs.map(d => d.data());
}

async function fs_addUserPlant(uid, data) {
  if (!db) return null;
  const ref = await db.collection('users').doc(uid).collection('plants').add(data);
  return ref.id;
}

async function fs_updateUserPlant(uid, id, data) {
  if (!db) return;
  await db.collection('users').doc(uid).collection('plants').doc(id).update(data);
}

async function fs_deleteUserPlant(uid, id) {
  if (!db) return;
  await db.collection('users').doc(uid).collection('plants').doc(id).delete();
}

// ---- PLANTACIONES ----

async function fs_getPlantings(uid) {
  if (!db) return [];
  const snap = await db.collection('users').doc(uid).collection('plantings')
    .orderBy('createdAt', 'desc')
    .get();
  return snap.docs.map(d => d.data());
}

async function fs_addPlanting(uid, data) {
  if (!db) return null;
  const ref = await db.collection('users').doc(uid).collection('plantings').add(data);
  return ref.id;
}

async function fs_updatePlantingStatus(uid, id, estado) {
  if (!db) return;
  await db.collection('users').doc(uid).collection('plantings').doc(id).update({ estado });
}

async function fs_deletePlanting(uid, id) {
  if (!db) return;
  await db.collection('users').doc(uid).collection('plantings').doc(id).delete();
}

// ---- SINCRONIZACIÓN ----

async function fs_syncLocalToFirestore(uid) {
  if (!db) return;
  // Sincronizar plantings locales a Firestore
  const locales = getPlantings('todos');
  for (const p of locales) {
    const exists = await db.collection('users').doc(uid).collection('plantings')
      .where('id', '==', p.id).get();
    if (exists.empty) {
      await db.collection('users').doc(uid).collection('plantings').add(p);
    }
  }
  // Sincronizar plantas agregadas localmente
  const todas = getPlantas();
  const inicialIds = PLANTAS_INICIALES.map(x => x.id);
  const agregadas = todas.filter(p => !inicialIds.includes(p.id));
  for (const p of agregadas) {
    const exists = await db.collection('users').doc(uid).collection('plants')
      .where('id', '==', p.id).get();
    if (exists.empty) {
      await db.collection('users').doc(uid).collection('plants').add(p);
    }
  }
}

async function fs_loadFromFirestore(uid) {
  if (!db) return;
  // Cargar plantings desde Firestore
  const fsPlantings = await fs_getPlantings(uid);
  if (fsPlantings.length > 0) {
    localStorage.setItem('planto_plantings', JSON.stringify(fsPlantings));
    plantings.length = 0;
    plantings.push(...fsPlantings);
  }
  // Cargar plantas agregadas desde Firestore
  const fsPlants = await fs_getUserPlants(uid);
  if (fsPlants.length > 0) {
    const inicialIds = PLANTAS_INICIALES.map(x => x.id);
    const existentes = plantas.filter(p => inicialIds.includes(p.id));
    const agregadas = fsPlants.filter(p => !existentes.some(e => e.id === p.id));
    plantas.push(...agregadas);
    savePlants();
  }
}
