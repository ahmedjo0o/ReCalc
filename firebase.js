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

// initialize
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const functionsInstance = firebase.functions();

// Callable Cloud Function that authoritatively computes the VAT/discount
// split server-side (see functions/index.js) and, for signed-in users,
// writes the history entry itself via the Admin SDK.
window.callCalculateBill = function (payload) {
  return functionsInstance.httpsCallable('calculateBill')(payload);
};

// Callable Cloud Function that reads a photographed receipt using Gemini
// (any language/script) and returns structured {totalOrder, subTotal,
// discount, items}. Longer timeout since AI inference is slower than the
// pure-math calculateBill call.
window.callExtractReceipt = function (payload) {
  return functionsInstance.httpsCallable('extractReceipt', { timeout: 60000 })(payload);
};

// --- Auth helpers ---
window.authCreateAccount = async function (email, password, displayName = '') {
  const userCredential = await auth.createUserWithEmailAndPassword(email, password);
  if (displayName) {
    await userCredential.user.updateProfile({ displayName });
  }
  return userCredential.user;
};

window.authSignIn = async function (email, password) {
  const userCredential = await auth.signInWithEmailAndPassword(email, password);
  return userCredential.user;
};

window.authSignOut = async function () {
  await auth.signOut();
};

// Callback for auth state changes: supply a function to react
window.onAuthStateChanged = function (cb) {
  auth.onAuthStateChanged((user) => {
    cb(user);
  });
};

// --- Firestore helpers ---
// Save a calculation result under users/{uid}/history
window.saveCalculationToFirestore = async function (uid, calculationObject) {
  if (!uid) throw new Error('no uid');
  const ref = db.collection('users').doc(uid).collection('history');
  await ref.add(calculationObject);
};

// Return last N history items
// NOTE: order by createdAt (we save createdAt), not "timestamp"
window.getUserHistory = async function (uid, limit = 20) {
  const ref = db.collection('users').doc(uid).collection('history').orderBy('createdAt', 'desc').limit(limit);
  const snap = await ref.get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};



// --- Google Sign-in helper ---
window.authSignInWithGoogle = async function () {
  const provider = new firebase.auth.GoogleAuthProvider();
  const result = await auth.signInWithPopup(provider);
  return result.user;
};

// Add or remove a favorite person
window.toggleFavorite = async function (uid, favoriteObj) {
  // favoriteObj: { name: 'Ahmed', notes: '', ... }
  if (!uid) throw new Error('no uid');
  const favRef = db.collection('users').doc(uid).collection('favorites');
  // naive toggle: check if exists
  const snap = await favRef.where('name', '==', favoriteObj.name).limit(1).get();
  if (snap.empty) {
    const res = await favRef.add({ ...favoriteObj, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    return { action: 'added', id: res.id };
  } else {
    // remove first match
    const docId = snap.docs[0].id;
    await favRef.doc(docId).delete();
    return { action: 'removed', id: docId };
  }
};

// --- Favorite helpers (add, update, delete) ---
window.addFavorite = async function (uid, favoriteObj) {
  if (!uid) throw new Error('no uid');
  const favRef = db.collection('users').doc(uid).collection('favorites');
  // check duplicate by name
  const snap = await favRef.where('name', '==', favoriteObj.name).limit(1).get();
  if (!snap.empty) {
    // return existing doc id
    return { action: 'exists', id: snap.docs[0].id };
  }
  const res = await favRef.add({ ...favoriteObj, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
  return { action: 'added', id: res.id };
};

window.updateFavorite = async function (uid, favId, updates) {
  if (!uid) throw new Error('no uid');
  if (!favId) throw new Error('no favId');
  await db.collection('users').doc(uid).collection('favorites').doc(favId).update({ ...updates });
  return { action: 'updated', id: favId };
};

window.deleteFavorite = async function (uid, favId) {
  if (!uid) throw new Error('no uid');
  if (!favId) throw new Error('no favId');
  await db.collection('users').doc(uid).collection('favorites').doc(favId).delete();
  return { action: 'deleted', id: favId };
};

// Delete single history item (by doc id)
window.deleteHistoryItem = async function (uid, historyDocId) {
  if (!uid) throw new Error('no uid');
  if (!historyDocId) throw new Error('no id');
  await db.collection('users').doc(uid).collection('history').doc(historyDocId).delete();
  return { action: 'deleted', id: historyDocId };
};


// --- Local fallback storage for non-auth users ---
window.localSaveCalculation = function (calculationObject) {
  const arr = JSON.parse(localStorage.getItem('recalc_history') || '[]');
  arr.unshift(calculationObject);
  localStorage.setItem('recalc_history', JSON.stringify(arr.slice(0, 50)));
};

window.localGetHistory = function () {
  return JSON.parse(localStorage.getItem('recalc_history') || '[]');
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

// Get favorites list for a user (or empty array)
window.getFavorites = async function (uid) {
  // If uid is falsy, return an empty array to avoid exceptions
  if (!uid) {
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

// local fallback getter
window.localGetFavorites = function () {
  try {
    return JSON.parse(localStorage.getItem('recalc_favorites') || '[]');
  } catch (e) {
    return [];
  }
};


window.localDeleteHistory = function (createdAtOrIndex) {
  const arr = JSON.parse(localStorage.getItem('recalc_history') || '[]');
  // we store createdAt as ISO string for local saves; remove by createdAt match or index
  const newArr = arr.filter(item => item.createdAt !== createdAtOrIndex);
  localStorage.setItem('recalc_history', JSON.stringify(newArr));
  return newArr;
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
    const userDocRef = doc(db, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);
    if (!userDocSnap.exists()) {
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
