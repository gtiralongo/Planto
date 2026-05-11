// Configuración de Firebase
// 1. Ve a https://console.firebase.google.com
// 2. Creá un proyecto → agregá una app web
// 3. Activá Authentication → Google en la sección "Sign-in method"
// 4. Copiá el objeto firebaseConfig y reemplazá los valores abajo
const firebaseConfig = {
  apiKey: "AIzaSyDJ_HApl_fe7KGxS3O_eRvofxC2r3fzK1Q",
  authDomain: "planto-7f170.firebaseapp.com",
  projectId: "planto-7f170",
  storageBucket: "planto-7f170.firebasestorage.app",
  messagingSenderId: "992661682428",
  appId: "1:992661682428:web:88d084485caf87f00abf79",
  measurementId: "G-DZLRZ9W4XF"
};

let firebaseInicializado = false;
let currentUser = null;

function mostrarLanding() {
  const landing = document.getElementById('landing');
  if (!landing || landing.classList.contains('hidden')) return;
  const l = document.getElementById('landingLoading');
  const c = document.getElementById('landingContent');
  if (l) l.classList.add('hidden');
  if (c) c.classList.remove('hidden');
}

function initFirebase() {
  if (typeof firebase === 'undefined') {
    console.warn('Firebase SDK no cargado. Usando modo local sin auth.');
    if (localStorage.getItem('planto_hemisphere')) {
      if (typeof enterApp === 'function') enterApp();
    } else {
      mostrarLanding();
    }
    return;
  }
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    firebaseInicializado = true;
    initFirestore();
    firebase.auth().onAuthStateChanged(user => {
      try {
        currentUser = user;
        actualizarUIAuth();
        if (user) {
          const h = localStorage.getItem('planto_hemisphere');
          if (h) { setHemisferio(h); hemisferio = h; }
          const landing = document.getElementById('landing');
          if (landing && !landing.classList.contains('hidden')) {
            if (typeof enterApp === 'function') enterApp();
          }
          if (typeof showView === 'function') showView('plantings');
          fs_getProfile(user.uid).then(profile => {
            if (profile?.hemisphere && typeof getHemisferio === 'function' && profile.hemisphere !== getHemisferio()) {
              setHemisferio(profile.hemisphere);
              hemisferio = profile.hemisphere;
              const b = document.getElementById('badgeHemi');
              if (b) b.textContent = profile.hemisphere === 'norte' ? '🌍 Norte' : '🌏 Sur';
              if (typeof renderCalendar === 'function') renderCalendar();
              if (typeof filterPlants === 'function') filterPlants();
            }
          }).catch(() => {});
          fs_syncLocalToFirestore(user.uid).catch(() => {});
          fs_loadFromFirestore(user.uid).catch(() => {});
        } else {
          if (localStorage.getItem('planto_hemisphere')) {
            const landing = document.getElementById('landing');
            if (landing && !landing.classList.contains('hidden')) {
              if (typeof enterApp === 'function') enterApp();
              if (typeof showView === 'function') showView('calendar');
            }
          } else {
            // Esperar un momento por si Firebase dispara otra vez con el usuario (doble fire)
            setTimeout(() => {
              if (!currentUser) mostrarLanding();
            }, 1500);
          }
        }
      } catch (e) {
        console.error('Error en auth:', e);
        mostrarLanding();
      }
    });
  } catch (e) {
    console.warn('Firebase no disponible:', e.message);
    mostrarLanding();
  }
}

// Fallback: si Firebase no responde en 12 seg, mostrar landing igual
setTimeout(() => {
  const loading = document.getElementById('landingLoading');
  if (loading && !loading.classList.contains('hidden')) {
    mostrarLanding();
  }
}, 12000);

function actualizarUIAuth() {
  const userInfo = document.getElementById('userInfo');
  const userAvatar = document.getElementById('userAvatar');
  const userName = document.getElementById('userName');
  const landingLoginBtn = document.getElementById('landingLoginBtn');
  const dropdownUserInfo = document.getElementById('dropdownUserInfo');
  const dropdownAvatar = document.getElementById('dropdownAvatar');
  const dropdownName = document.getElementById('dropdownName');
  const dropdownLogout = document.getElementById('dropdownLogout');
  const dropdownLoginItem = document.getElementById('dropdownLoginItem');
  const cultivosBtn = document.getElementById('navCultivosBtn');
  const cultivosBottom = document.getElementById('navCultivosBottom');
  const navBtns = document.querySelectorAll('.nav-btn[data-view="plan"], .nav-bottom-btn[data-view="plan"]');
  const viewPlantings = document.getElementById('view-plantings');
  const viewPlan = document.getElementById('view-plan');

  if (!userInfo) return;

  if (currentUser) {
    userAvatar.src = currentUser.photoURL || '';
    userAvatar.style.display = '';
    userName.textContent = currentUser.displayName || 'Usuario';
    if (dropdownUserInfo) dropdownUserInfo.classList.remove('hidden');
    if (dropdownAvatar) dropdownAvatar.src = currentUser.photoURL || '';
    if (dropdownName) dropdownName.textContent = currentUser.displayName || 'Usuario';
    if (dropdownLogout) dropdownLogout.classList.remove('hidden');
    if (dropdownLoginItem) dropdownLoginItem.classList.add('hidden');
    if (landingLoginBtn) landingLoginBtn.classList.add('hidden');
    if (cultivosBtn) cultivosBtn.classList.remove('hidden');
    if (cultivosBottom) cultivosBottom.classList.remove('hidden');
    navBtns.forEach(b => b.classList.remove('hidden'));
    if (viewPlantings) viewPlantings.classList.remove('hidden');
    if (viewPlan) viewPlan.classList.remove('hidden');
  } else {
    userAvatar.style.display = 'none';
    userName.textContent = '👤 Invitado';
    if (dropdownUserInfo) dropdownUserInfo.classList.add('hidden');
    if (dropdownLogout) dropdownLogout.classList.add('hidden');
    if (dropdownLoginItem) dropdownLoginItem.classList.remove('hidden');
    if (landingLoginBtn) landingLoginBtn.classList.remove('hidden');
    if (cultivosBtn) cultivosBtn.classList.add('hidden');
    if (cultivosBottom) cultivosBottom.classList.add('hidden');
    navBtns.forEach(b => b.classList.add('hidden'));
    if (viewPlantings) viewPlantings.classList.add('hidden');
    if (viewPlan) viewPlan.classList.add('hidden');
  }
}

function loginGoogle() {
  if (!firebaseInicializado) {
    showToast('Firebase no configurado. Configuralo en js/firebase-config.js');
    return;
  }
  const provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider)
    .then(result => {
      showToast('✅ Sesión iniciada: ' + result.user.displayName);
    })
    .catch(error => {
      if (error.code !== 'auth/popup-closed-by-user') {
        showToast('❌ Error: ' + error.message);
      }
    });
}

function logout() {
  if (!firebaseInicializado) return;
  firebase.auth().signOut().then(() => {
    showToast('Sesión cerrada');
  });
}

function getUser() {
  return currentUser;
}

function isLoggedIn() {
  return currentUser !== null && currentUser !== undefined;
}
