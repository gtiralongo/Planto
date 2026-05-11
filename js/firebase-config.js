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
let _onAuthReady = null;
let _authResolved = false;
let _authUser = null;
function setOnAuthReady(fn) {
  _onAuthReady = fn;
  // Si auth ya se resolvió (antes de que app.js cargara), disparar ahora
  if (_authResolved && _authUser) _onAuthReady(_authUser);
}

function initFirebase() {
  if (typeof firebase === 'undefined') {
    console.warn('Firebase SDK no cargado. Usando modo local sin auth.');
    return;
  }
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    firebaseInicializado = true;
    initFirestore();
    firebase.auth().onAuthStateChanged(async user => {
      currentUser = user;
      actualizarUIAuth();
      if (user) {
        // Cargar perfil con hemisferio guardado
        const profile = await fs_getProfile(user.uid);
        if (profile && profile.hemisphere) {
          setHemisferio(profile.hemisphere);
          hemisferio = profile.hemisphere;
        }
        await fs_syncLocalToFirestore(user.uid);
        await fs_loadFromFirestore(user.uid);
        // Notificar que auth está listo (para que app.js entre a la app)
        _authResolved = true;
        _authUser = user;
        if (typeof _onAuthReady === 'function') _onAuthReady(user);
        // Si ya estaba en la app, cambiar a Mis Cultivos
        const landing = document.getElementById('landing');
        if (landing && landing.classList.contains('hidden') && typeof showView === 'function') {
          showView('plantings');
        }
      } else {
        _authResolved = true;
        _authUser = null;
        // No logueado → mostrar landing con opciones
        document.getElementById('landingLoading').classList.add('hidden');
        document.getElementById('landingContent').classList.remove('hidden');
      }
    });
  } catch (e) {
    console.warn('Firebase no disponible:', e.message);
  }
}

function actualizarUIAuth() {
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const userInfo = document.getElementById('userInfo');
  const userAvatar = document.getElementById('userAvatar');
  const userName = document.getElementById('userName');
  const landingLoginBtn = document.getElementById('landingLoginBtn');

  const cultivosBtn = document.getElementById('navCultivosBtn');
  const cultivosBottom = document.getElementById('navCultivosBottom');
  const plantingsView = document.getElementById('view-plantings');
  const dropdownUserInfo = document.getElementById('dropdownUserInfo');
  const dropdownAvatar = document.getElementById('dropdownAvatar');
  const dropdownName = document.getElementById('dropdownName');
  const dropdownLogout = document.getElementById('dropdownLogout');
  const dropdownLoginItem = document.getElementById('dropdownLoginItem');
  const menuUserBtn = document.getElementById('menuUserBtn');

  if (!loginBtn) return;

  if (currentUser) {
    loginBtn.classList.add('hidden');
    logoutBtn.classList.remove('hidden');
    userInfo.classList.remove('hidden');
    userAvatar.src = currentUser.photoURL || '';
    userName.textContent = currentUser.displayName || 'Usuario';
    if (dropdownUserInfo) dropdownUserInfo.classList.remove('hidden');
    if (dropdownAvatar) dropdownAvatar.src = currentUser.photoURL || '';
    if (dropdownName) dropdownName.textContent = currentUser.displayName || 'Usuario';
    if (dropdownLogout) dropdownLogout.classList.remove('hidden');
    if (dropdownLoginItem) dropdownLoginItem.classList.add('hidden');
    if (menuUserBtn) menuUserBtn.classList.remove('hidden');
    if (landingLoginBtn) landingLoginBtn.classList.add('hidden');
    if (cultivosBtn) cultivosBtn.classList.remove('hidden');
    if (cultivosBottom) cultivosBottom.classList.remove('hidden');
    if (plantingsView) plantingsView.classList.remove('hidden');
  } else {
    loginBtn.classList.remove('hidden');
    logoutBtn.classList.add('hidden');
    userInfo.classList.add('hidden');
    if (dropdownUserInfo) dropdownUserInfo.classList.add('hidden');
    if (dropdownLogout) dropdownLogout.classList.add('hidden');
    if (dropdownLoginItem) dropdownLoginItem.classList.remove('hidden');
    if (menuUserBtn) menuUserBtn.classList.remove('hidden');
    if (landingLoginBtn) landingLoginBtn.classList.remove('hidden');
    if (cultivosBtn) cultivosBtn.classList.add('hidden');
    if (cultivosBottom) cultivosBottom.classList.add('hidden');
    if (plantingsView) plantingsView.classList.add('hidden');
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
