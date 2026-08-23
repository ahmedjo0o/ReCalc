// firebase.js
// Put your firebase config here (from Firebase console)
const firebaseConfig = {
  apiKey: "AIzaSyAKbxlBH2LiHo8Nfv5806V0gYgfLdgkO1E",
  authDomain: "recalc-app.firebaseapp.com",
  projectId: "recalc-app",
  storageBucket: "recalc-app.firebasestorage.app",
  messagingSenderId: "1019107009825",
  appId: "1:1019107009825:web:758dcb79ec26aebc460a60",
  measurementId: "G-Z8RYVFS1RR"
};

// ---------------------------------------------------------------------
// Local-storage fallback helpers are defined FIRST and UNCONDITIONALLY.
// This guarantees they always exist — even if Firebase fails to load or
// initialize (network blocked, ad-blocker, offline, bad config, etc.) —
// so guest/local mode never breaks with "X is not defined" errors.
// ---------------------------------------------------------------------
window.localSaveCalculation = function (calculationObject) {
  const arr = JSON.parse(localStorage.getItem('recalc_history') || '[]');
  arr.unshift(calculationObject);
  localStorage.setItem('recalc_history', JSON.stringify(arr.slice(0, 50)));
};

window.localGetHistory = function () {
  try {
    return JSON.parse(localStorage.getItem('recalc_history') || '[]');
  } catch (e) {
    return [];
  }
};

window.localDeleteHistory = function (createdAtOrIndex) {
  const arr = JSON.parse(localStorage.getItem('recalc_history') || '[]');
  const newArr = arr.filter(item => item.createdAt !== createdAtOrIndex);
  localStorage.setItem('recalc_history', JSON.stringify(newArr));
  return newArr;
};

window.localToggleFavorite = function (favoriteObj) {
  const arr = JSON.parse(localStorage.getItem('recalc_favorites') || '[]');
  const idx = arr.findIndex(f => f.name === favoriteObj.name);
  if (idx === -1) {
    arr.unshift(favoriteObj);
  } else {
    arr.splice(idx, 1);
  }
  localStorage.setItem('recalc_favorites', JSON.stringify(arr));
  return arr;
};

window.localGetFavorites = function () {
  try {
    return JSON.parse(localStorage.getItem('recalc_favorites') || '[]');
  } catch (e) {
    return [];
  }
};

window.localUpdateFavorite = function (oldName, newName) {
  const arr = JSON.parse(localStorage.getItem('recalc_favorites') || '[]');
  const idx = arr.findIndex(f => f.name === oldName);
  if (idx === -1) return arr;
  arr[idx].name = newName;
  localStorage.setItem('recalc_favorites', JSON.stringify(arr));
  return arr;
};

window.localDeleteFavorite = function (name) {
  const arr = JSON.parse(localStorage.getItem('recalc_favorites') || '[]');
  const newArr = arr.filter(f => f.name !== name);
  localStorage.setItem('recalc_favorites', JSON.stringify(newArr));
  return newArr;
};

// ---------------------------------------------------------------------
// Firebase initialization — wrapped in try/catch so a failure here can
// NEVER stop the local helpers above from working, and never throws an
// uncaught error that halts the rest of this file (or this script tag).
// ---------------------------------------------------------------------
let auth = null;
let db = null;

try {
  if (typeof firebase === 'undefined') {
    throw new Error('Firebase SDK not loaded (blocked network, ad-blocker, or script order issue).');
  }
  firebase.initializeApp(firebaseConfig);
  auth = firebase.auth();
  db = firebase.firestore();
} catch (err) {
  console.warn('Firebase init failed — continuing in local/guest mode only:', err);
}

function requireAuth() {
  if (!auth) throw new Error('Firebase Auth is unavailable right now.');
  return auth;
}
function requireDb() {
  if (!db) throw new Error('Firebase Firestore is unavailable right now.');
  return db;
}

// --- Auth helpers ---
window.authCreateAccount = async function (email, password, displayName = '') {
  const userCredential = await requireAuth().createUserWithEmailAndPassword(email, password);
  if (displayName) {
    await userCredential.user.updateProfile({ displayName });
  }
  return userCredential.user;
};

window.authSignIn = async function (email, password) {
  const userCredential = await requireAuth().signInWithEmailAndPassword(email, password);
  return userCredential.user;
};

window.authSignOut = async function () {
  await requireAuth().signOut();
};

// Callback for auth state changes: supply a function to react
window.onAuthStateChanged = function (cb) {
  if (!auth) {
    // Firebase unavailable — report "signed out" once so the rest of the
    // page (history/favorites/UI) still initializes in guest mode.
    setTimeout(() => cb(null), 0);
    return;
  }
  auth.onAuthStateChanged((user) => {
    cb(user);
  });
};

// --- Firestore helpers ---
// Save a calculation result under users/{uid}/history
window.saveCalculationToFirestore = async function (uid, calculationObject) {
  if (!uid) throw new Error('no uid');
  const ref = requireDb().collection('users').doc(uid).collection('history');
  await ref.add(calculationObject);
};

// Return last N history items
window.getUserHistory = async function (uid, limit = 20) {
  const ref = requireDb().collection('users').doc(uid).collection('history').orderBy('createdAt', 'desc').limit(limit);
  const snap = await ref.get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// --- Google Sign-in helper ---
window.authSignInWithGoogle = async function () {
  const provider = new firebase.auth.GoogleAuthProvider();
  const result = await requireAuth().signInWithPopup(provider);
  return result.user;
};

// Add or remove a favorite person
window.toggleFavorite = async function (uid, favoriteObj) {
  if (!uid) throw new Error('no uid');
  const favRef = requireDb().collection('users').doc(uid).collection('favorites');
  const snap = await favRef.where('name', '==', favoriteObj.name).limit(1).get();
  if (snap.empty) {
    const res = await favRef.add({ ...favoriteObj, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    return { action: 'added', id: res.id };
  } else {
    const docId = snap.docs[0].id;
    await favRef.doc(docId).delete();
    return { action: 'removed', id: docId };
  }
};

// --- Favorite helpers (add, update, delete) ---
window.addFavorite = async function (uid, favoriteObj) {
  if (!uid) throw new Error('no uid');
  const favRef = requireDb().collection('users').doc(uid).collection('favorites');
  const snap = await favRef.where('name', '==', favoriteObj.name).limit(1).get();
  if (!snap.empty) {
    return { action: 'exists', id: snap.docs[0].id };
  }
  const res = await favRef.add({ ...favoriteObj, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
  return { action: 'added', id: res.id };
};

window.updateFavorite = async function (uid, favId, updates) {
  if (!uid) throw new Error('no uid');
  if (!favId) throw new Error('no favId');
  await requireDb().collection('users').doc(uid).collection('favorites').doc(favId).update({ ...updates });
  return { action: 'updated', id: favId };
};

window.deleteFavorite = async function (uid, favId) {
  if (!uid) throw new Error('no uid');
  if (!favId) throw new Error('no favId');
  await requireDb().collection('users').doc(uid).collection('favorites').doc(favId).delete();
  return { action: 'deleted', id: favId };
};

// Delete single history item (by doc id)
window.deleteHistoryItem = async function (uid, historyDocId) {
  if (!uid) throw new Error('no uid');
  if (!historyDocId) throw new Error('no id');
  await requireDb().collection('users').doc(uid).collection('history').doc(historyDocId).delete();
  return { action: 'deleted', id: historyDocId };
};

// Get favorites list for a user (or empty array)
window.getFavorites = async function (uid) {
  if (!uid || !db) {
    return [];
  }
  try {
    const ref = db.collection('users').doc(uid).collection('favorites').orderBy('createdAt', 'desc');
    const snap = await ref.get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error('getFavorites error', err);
    return [];
  }
};

// This runs after fetching user's saved calculations
function renderUserHistoryPreview(historyArray) {
  const list = document.getElementById('history-list');
  if (!list) return;

  list.innerHTML = ''; // clear before re-render

  if (!historyArray || historyArray.length === 0) {
    list.innerHTML = '<p style="color:#666;">No history found.</p>';
    return;
  }

  // show up to 3 most recent
  const recent = historyArray.slice(-3).reverse(); // latest first

  recent.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'history-item';
    div.style.cssText = 'padding:10px; margin-bottom:8px; border:1px solid rgba(0,0,0,0.05); border-radius:8px; background:#fff;';
    div.innerHTML = `
      <div style="font-weight:600;">${item.title || 'Calculation ' + (index + 1)}</div>
      <div style="font-size:13px; color:#555;">Total: ${item.total || 0}</div>
      <div style="font-size:12px; color:#999;">${new Date(item.timestamp).toLocaleString()}</div>
    `;
    list.appendChild(div);
  });
}

// example: loadHistoryForUser(uid)
async function loadHistoryForUser(uid) {
  try {
    if (!db) { renderUserHistoryPreview([]); return; }
    const userDocRef = db.collection('users').doc(uid);
    const userDocSnap = await userDocRef.get();
    if (!userDocSnap.exists) {
      renderUserHistoryPreview([]);
      return;
    }

    const data = userDocSnap.data();
    const history = data.history || [];
    renderUserHistoryPreview(history);
  } catch (err) {
    console.error('Error loading history:', err);
    renderUserHistoryPreview([]);
  }
}

function openFullHistory() {
  window.location.href = 'history.html';
}

// Expose auth & db for debug if needed
window._reCalcFirebase = { auth, db };
