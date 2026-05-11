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
        await fs_syncLocalToFirestore(user.uid);
        await fs_loadFromFirestore(user.uid);
        renderCalendar();
        const v = document.querySelector('.view.active');
        if (v && v.id === 'view-plantings') {
          const t = document.querySelector('.plantings-tab.active');
          renderPlantings(t ? t.dataset.tab : 'creciendo');
        }
        if (v && v.id === 'view-catalog') filterPlants();
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
  const plantingsView = document.getElementById('view-plantings');

  if (!loginBtn) return;

  if (currentUser) {
    loginBtn.classList.add('hidden');
    logoutBtn.classList.remove('hidden');
    userInfo.classList.remove('hidden');
    userAvatar.src = currentUser.photoURL || '';
    userName.textContent = currentUser.displayName || 'Usuario';
    if (landingLoginBtn) landingLoginBtn.classList.add('hidden');
    if (cultivosBtn) cultivosBtn.classList.remove('hidden');
    if (plantingsView) plantingsView.classList.remove('hidden');
  } else {
    loginBtn.classList.remove('hidden');
    logoutBtn.classList.add('hidden');
    userInfo.classList.add('hidden');
    if (landingLoginBtn) landingLoginBtn.classList.remove('hidden');
    if (cultivosBtn) cultivosBtn.classList.add('hidden');
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
