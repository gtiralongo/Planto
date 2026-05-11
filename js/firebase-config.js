// Configuración de Firebase
// 1. Ve a https://console.firebase.google.com
// 2. Creá un proyecto → agregá una app web
// 3. Activá Authentication → Google en la sección "Sign-in method"
// 4. Copiá el objeto firebaseConfig y reemplazá los valores abajo
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROYECTO",
  storageBucket: "TU_PROYECTO.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
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
    firebase.auth().onAuthStateChanged(user => {
      currentUser = user;
      actualizarUIAuth();
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

  if (!loginBtn) return;

  if (currentUser) {
    loginBtn.classList.add('hidden');
    logoutBtn.classList.remove('hidden');
    userInfo.classList.remove('hidden');
    userAvatar.src = currentUser.photoURL || '';
    userName.textContent = currentUser.displayName || 'Usuario';
    if (landingLoginBtn) landingLoginBtn.classList.add('hidden');
  } else {
    loginBtn.classList.remove('hidden');
    logoutBtn.classList.add('hidden');
    userInfo.classList.add('hidden');
    if (landingLoginBtn) landingLoginBtn.classList.remove('hidden');
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
